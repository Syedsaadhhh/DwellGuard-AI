import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Store } from "@/domain/ports/store";
import {
  Incident,
  AuthorityVersion,
  CallIntent,
  CallSnapshot,
  Observation,
  WorkflowJob,
  Receipt,
  HandoffToken,
  AuditEvent,
  CausalProof,
} from "@/domain/types";

export class SupabaseStore implements Store {
  private client: SupabaseClient;

  constructor(url?: string, key?: string) {
    const supabaseUrl = url || process.env.SUPABASE_URL;
    const supabaseKey = key || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "SupabaseStore requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY in environment"
      );
    }
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  async getIncident(id: string): Promise<Incident | null> {
    const { data, error } = await this.client.from("incidents").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  }

  async listIncidents(): Promise<Incident[]> {
    const { data, error } = await this.client.from("incidents").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async createIncident(incident: Incident): Promise<Incident> {
    const { data, error } = await this.client.from("incidents").insert(incident).select().single();
    if (error) throw error;
    return data;
  }

  async updateIncident(incident: Incident): Promise<Incident> {
    const { data, error } = await this.client
      .from("incidents")
      .update({
        ...incident,
        state_revision: incident.state_revision + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", incident.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async freezeAuthority(
    incidentId: string,
    authority: Omit<AuthorityVersion, "id" | "incident_id" | "version" | "created_at">
  ): Promise<AuthorityVersion> {
    const { data: currentVersions } = await this.client
      .from("authority_versions")
      .select("version")
      .eq("incident_id", incidentId)
      .order("version", { ascending: false });

    const newVersionNum = (currentVersions?.[0]?.version ?? 0) + 1;
    const authRecord = {
      ...authority,
      id: `auth_${incidentId}_v${newVersionNum}`,
      incident_id: incidentId,
      version: newVersionNum,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await this.client.from("authority_versions").insert(authRecord).select().single();
    if (error) throw error;

    await this.client
      .from("incidents")
      .update({
        authority_version: newVersionNum,
        status: "authorized",
        state_revision: (await this.getIncident(incidentId))?.state_revision || 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", incidentId);

    return data;
  }

  async getLatestAuthority(incidentId: string): Promise<AuthorityVersion | null> {
    const { data, error } = await this.client
      .from("authority_versions")
      .select("*")
      .eq("incident_id", incidentId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async getAuthorityVersion(incidentId: string, version: number): Promise<AuthorityVersion | null> {
    const { data, error } = await this.client
      .from("authority_versions")
      .select("*")
      .eq("incident_id", incidentId)
      .eq("version", version)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async reserveCallBudget(
    incidentId: string,
    count: number
  ): Promise<{ success: boolean; remaining: number }> {
    const { data, error } = await this.client.rpc("reserve_call_budget", {
      p_incident_id: incidentId,
      p_count: count,
    });
    if (error) throw error;
    if (data && data.length > 0) {
      return { success: data[0].success, remaining: data[0].remaining };
    }
    return { success: false, remaining: 0 };
  }

  async saveCallIntent(intent: CallIntent): Promise<CallIntent> {
    const { data, error } = await this.client.from("call_intents").upsert(intent).select().single();
    if (error) throw error;
    return data;
  }

  async getCallIntent(id: string): Promise<CallIntent | null> {
    const { data, error } = await this.client.from("call_intents").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  }

  async getCallIntentByIdempotencyKey(key: string): Promise<CallIntent | null> {
    const { data, error } = await this.client
      .from("call_intents")
      .select("*")
      .eq("idempotency_key", key)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async getCallIntentByCalleCallId(calleCallId: string): Promise<CallIntent | null> {
    const { data, error } = await this.client
      .from("call_intents")
      .select("*")
      .eq("calle_call_id", calleCallId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async saveCallSnapshot(snapshot: CallSnapshot): Promise<CallSnapshot> {
    const { data, error } = await this.client.from("call_snapshots").insert(snapshot).select().single();
    if (error) throw error;
    return data;
  }

  async saveObservation(observation: Observation): Promise<Observation> {
    const { data, error } = await this.client.from("observations").insert(observation).select().single();
    if (error) throw error;
    return data;
  }

  async getObservations(incidentId: string): Promise<Observation[]> {
    const { data, error } = await this.client
      .from("observations")
      .select("*")
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async claimJob(
    jobId: string,
    workerId: string,
    leaseDurationMs: number
  ): Promise<{ claimed: boolean; job?: WorkflowJob }> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + leaseDurationMs).toISOString();

    const { data, error } = await this.client
      .from("workflow_jobs")
      .update({
        lease_owner: workerId,
        lease_expires_at: expiresAt,
        status: "running",
      })
      .eq("id", jobId)
      .select()
      .maybeSingle();

    if (error || !data) return { claimed: false };
    return { claimed: true, job: data };
  }

  async completeJob(jobId: string): Promise<void> {
    await this.client
      .from("workflow_jobs")
      .update({ status: "completed", lease_owner: null, lease_expires_at: null })
      .eq("id", jobId);
  }

  async finalizeReceipt(receipt: Receipt): Promise<Receipt> {
    const { data, error } = await this.client.from("receipts").insert(receipt).select().single();
    if (error) throw error;

    await this.client
      .from("incidents")
      .update({
        status: "plan_confirmed",
        confirmed_receipt_id: receipt.id,
        causal_proof_id: receipt.causal_proof_id,
        causal_proof_short_id: receipt.causal_proof_short_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", receipt.incident_id);

    return data;
  }

  async getReceipt(id: string): Promise<Receipt | null> {
    const { data, error } = await this.client.from("receipts").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  }

  async getReceiptByIncident(incidentId: string): Promise<Receipt | null> {
    const { data, error } = await this.client
      .from("receipts")
      .select("*")
      .eq("incident_id", incidentId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async createHandoffToken(token: HandoffToken): Promise<HandoffToken> {
    // Only persist fields present in schema (exclude raw_token_display)
    const recordToPersist = {
      id: token.id,
      incident_id: token.incident_id,
      receipt_id: token.receipt_id,
      receipt_version: token.receipt_version,
      token_hash: token.token_hash,
      expires_at: token.expires_at,
      created_at: token.created_at,
    };

    const { data, error } = await this.client.from("handoff_tokens").insert(recordToPersist).select().single();
    if (error) throw error;

    await this.client
      .from("incidents")
      .update({ handoff_token_id: token.id, updated_at: new Date().toISOString() })
      .eq("id", token.incident_id);

    return { ...data, raw_token_display: token.raw_token_display };
  }

  async getHandoffTokenByHash(tokenHash: string): Promise<HandoffToken | null> {
    const { data, error } = await this.client
      .from("handoff_tokens")
      .select("*")
      .eq("token_hash", tokenHash)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async getHandoffTokenByIncident(incidentId: string): Promise<HandoffToken | null> {
    const { data, error } = await this.client
      .from("handoff_tokens")
      .select("*")
      .eq("incident_id", incidentId)
      .order("receipt_version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async acknowledgeHandoff(
    tokenHash: string,
    ack: { acknowledged_at: string; client_ip_hash?: string; user_agent?: string }
  ): Promise<{ success: boolean; token?: HandoffToken; receipt?: Receipt }> {
    const token = await this.getHandoffTokenByHash(tokenHash);
    if (!token) return { success: false };

    if (new Date(token.expires_at) < new Date(ack.acknowledged_at)) {
      return { success: false };
    }

    if (token.acknowledged_at) {
      const receipt = await this.getReceipt(token.receipt_id);
      return { success: true, token, receipt: receipt || undefined };
    }

    await this.client
      .from("handoff_tokens")
      .update({ acknowledged_at: ack.acknowledged_at })
      .eq("id", token.id);

    await this.client.from("handoff_acknowledgments").insert({
      id: `ack_${token.id}`,
      token_id: token.id,
      acknowledged_at: ack.acknowledged_at,
      client_ip_hash: ack.client_ip_hash,
      user_agent: ack.user_agent,
    });

    await this.client
      .from("incidents")
      .update({ status: "driver_received", updated_at: new Date().toISOString() })
      .eq("id", token.incident_id);

    // Update CausalProof chain if present
    const existingProof = await this.getCausalProof(token.incident_id, token.receipt_version);
    if (existingProof) {
      existingProof.canonical_payload.acknowledged_at = ack.acknowledged_at;
      const ackLink = existingProof.chain.find((l) => l.step === "driver_received");
      if (ackLink) {
        ackLink.status = "valid";
        ackLink.fact = `Acknowledged by driver at ${ack.acknowledged_at}`;
      }
      await this.saveCausalProof(existingProof);
    }

    const receipt = await this.getReceipt(token.receipt_id);
    return {
      success: true,
      token: { ...token, acknowledged_at: ack.acknowledged_at },
      receipt: receipt || undefined,
    };
  }

  async saveCausalProof(proof: CausalProof): Promise<CausalProof> {
    const { data, error } = await this.client
      .from("causal_proofs")
      .upsert({
        id: proof.id,
        incident_id: proof.incident_id,
        receipt_version: proof.receipt_version,
        proof_hash: proof.proof_hash,
        short_id: proof.short_id,
        canonical_payload: proof.canonical_payload,
        chain: proof.chain,
        status: proof.status,
        created_at: proof.created_at,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getCausalProof(incidentId: string, version?: number): Promise<CausalProof | null> {
    let query = this.client
      .from("causal_proofs")
      .select("*")
      .eq("incident_id", incidentId);

    if (version !== undefined) {
      query = query.eq("receipt_version", version);
    } else {
      query = query.order("receipt_version", { ascending: false }).limit(1);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
  }

  async recordAuditEvent(event: Omit<AuditEvent, "id" | "created_at">): Promise<AuditEvent> {
    const fullEvent = {
      ...event,
      id: `audit_${event.incident_id}_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await this.client.from("audit_events").insert(fullEvent).select().single();
    if (error) throw error;
    return data;
  }

  async getAuditEvents(incidentId: string): Promise<AuditEvent[]> {
    const { data, error } = await this.client
      .from("audit_events")
      .select("*")
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  }
}
