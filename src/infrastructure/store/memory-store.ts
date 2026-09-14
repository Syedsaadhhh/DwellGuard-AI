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
  HandoffAcknowledgment,
  AuditEvent,
  CausalProof,
} from "@/domain/types";

export class MemoryStore implements Store {
  private incidents = new Map<string, Incident>();
  private authorityVersions = new Map<string, AuthorityVersion[]>();
  private callIntents = new Map<string, CallIntent>();
  private callSnapshots = new Map<string, CallSnapshot>();
  private observations = new Map<string, Observation[]>();
  private workflowJobs = new Map<string, WorkflowJob>();
  private receipts = new Map<string, Receipt>();
  private handoffTokens = new Map<string, HandoffToken>(); // key is token_hash
  private handoffAcks = new Map<string, HandoffAcknowledgment>();
  private auditEvents = new Map<string, AuditEvent[]>();
  private causalProofs = new Map<string, CausalProof>(); // key is `${incident_id}_v${version}`

  constructor(seedDefault = true) {
    if (seedDefault) {
      this.seedInitialData();
    }
  }

  private seedInitialData() {
    // Primary at-risk load DG-2048
    const primary: Incident = {
      id: "inc_dg2048",
      load_ref: "DG-2048",
      carrier: "Apex Freight Express",
      origin: "Chicago, IL",
      destination: "Dayton, OH",
      dock_name: "Northline Receiving",
      dock_contact_name: "Receiving Coordinator Mary",
      dock_phone: "+19375550144",
      driver_contact_name: "Joe Vance",
      driver_phone: "+13125550189",
      original_appointment: "2026-09-14T10:30:00-04:00",
      updated_eta: "2026-09-14T11:20:00-04:00",
      status: "draft",
      authority_version: 0,
      state_revision: 1,
      task_budget_remaining: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.incidents.set(primary.id, primary);

    // 3 quiet supporting loads for shipment desk
    const supp1: Incident = {
      id: "inc_dg2045",
      load_ref: "DG-2045",
      carrier: "Great Lakes Express",
      origin: "Detroit, MI",
      destination: "Columbus, OH",
      dock_name: "Midwest Distribution Hub",
      dock_contact_name: "Dock Lead Frank",
      dock_phone: "+16145550122",
      driver_contact_name: "Marcus Hill",
      driver_phone: "+13135550177",
      original_appointment: "2026-09-14T09:00:00-04:00",
      updated_eta: "2026-09-14T08:52:00-04:00",
      status: "driver_received",
      authority_version: 1,
      state_revision: 4,
      task_budget_remaining: 2,
      causal_proof_short_id: "DG-PROOF-9F42A1B8",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
    };
    this.incidents.set(supp1.id, supp1);

    const supp2: Incident = {
      id: "inc_dg2049",
      load_ref: "DG-2049",
      carrier: "Crossroads Logistics",
      origin: "Indianapolis, IN",
      destination: "Toledo, OH",
      dock_name: "Buckeye Logistics Center",
      dock_contact_name: "Receiving Desk",
      dock_phone: "+14195550198",
      driver_contact_name: "Elena Rostova",
      driver_phone: "+13175550143",
      original_appointment: "2026-09-14T14:00:00-04:00",
      updated_eta: "2026-09-14T13:50:00-04:00",
      status: "draft",
      authority_version: 0,
      state_revision: 1,
      task_budget_remaining: 2,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 7200000).toISOString(),
    };
    this.incidents.set(supp2.id, supp2);

    const supp3: Incident = {
      id: "inc_dg2051",
      load_ref: "DG-2051",
      carrier: "Steel City Transport",
      origin: "Cleveland, OH",
      destination: "Cincinnati, OH",
      dock_name: "Tri-State Cold Storage",
      dock_contact_name: "Dispatch Desk",
      dock_phone: "+15135550181",
      driver_contact_name: "Dave Kowalski",
      driver_phone: "+12165550119",
      original_appointment: "2026-09-14T16:30:00-04:00",
      updated_eta: "2026-09-14T16:25:00-04:00",
      status: "draft",
      authority_version: 0,
      state_revision: 1,
      task_budget_remaining: 2,
      created_at: new Date(Date.now() - 10800000).toISOString(),
      updated_at: new Date(Date.now() - 10800000).toISOString(),
    };
    this.incidents.set(supp3.id, supp3);
  }

  async getIncident(id: string): Promise<Incident | null> {
    const inc = this.incidents.get(id);
    return inc ? { ...inc } : null;
  }

  async listIncidents(): Promise<Incident[]> {
    return Array.from(this.incidents.values()).map((inc) => ({ ...inc }));
  }

  async createIncident(incident: Incident): Promise<Incident> {
    this.incidents.set(incident.id, { ...incident });
    return { ...incident };
  }

  async updateIncident(incident: Incident): Promise<Incident> {
    const existing = this.incidents.get(incident.id);
    if (!existing) {
      throw new Error(`Incident ${incident.id} not found`);
    }
    const updated = {
      ...incident,
      state_revision: existing.state_revision + 1,
      updated_at: new Date().toISOString(),
    };
    this.incidents.set(incident.id, updated);
    return { ...updated };
  }

  async freezeAuthority(
    incidentId: string,
    authority: Omit<AuthorityVersion, "id" | "incident_id" | "version" | "created_at">
  ): Promise<AuthorityVersion> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const versions = this.authorityVersions.get(incidentId) || [];
    const newVersionNum = versions.length + 1;
    const authRecord: AuthorityVersion = {
      ...authority,
      id: `auth_${incidentId}_v${newVersionNum}`,
      incident_id: incidentId,
      version: newVersionNum,
      created_at: new Date().toISOString(),
    };

    versions.push(authRecord);
    this.authorityVersions.set(incidentId, versions);

    // Update incident authority_version and transition status to authorized
    incident.authority_version = newVersionNum;
    incident.status = "authorized";
    incident.state_revision += 1;
    incident.updated_at = new Date().toISOString();

    return { ...authRecord };
  }

  async getLatestAuthority(incidentId: string): Promise<AuthorityVersion | null> {
    const versions = this.authorityVersions.get(incidentId);
    if (!versions || versions.length === 0) return null;
    return { ...versions[versions.length - 1] };
  }

  async getAuthorityVersion(incidentId: string, version: number): Promise<AuthorityVersion | null> {
    const versions = this.authorityVersions.get(incidentId);
    if (!versions) return null;
    const match = versions.find((v) => v.version === version);
    return match ? { ...match } : null;
  }

  async reserveCallBudget(
    incidentId: string,
    count: number
  ): Promise<{ success: boolean; remaining: number }> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return { success: false, remaining: 0 };
    }
    if (incident.task_budget_remaining === undefined) {
      incident.task_budget_remaining = 2;
    }
    if (incident.task_budget_remaining >= count) {
      incident.task_budget_remaining -= count;
      incident.updated_at = new Date().toISOString();
      return { success: true, remaining: incident.task_budget_remaining };
    }
    return { success: false, remaining: incident.task_budget_remaining };
  }

  async saveCallIntent(intent: CallIntent): Promise<CallIntent> {
    for (const [id, existing] of this.callIntents.entries()) {
      if (existing.id === intent.id || existing.idempotency_key === intent.idempotency_key) {
        const merged = { ...existing, ...intent };
        this.callIntents.set(id, merged);
        return { ...merged };
      }
    }
    this.callIntents.set(intent.id, { ...intent });
    return { ...intent };
  }

  async getCallIntent(id: string): Promise<CallIntent | null> {
    const intent = this.callIntents.get(id);
    return intent ? { ...intent } : null;
  }

  async getCallIntentByIdempotencyKey(key: string): Promise<CallIntent | null> {
    for (const intent of this.callIntents.values()) {
      if (intent.idempotency_key === key) {
        return { ...intent };
      }
    }
    return null;
  }

  async getCallIntentByCalleCallId(calleCallId: string): Promise<CallIntent | null> {
    for (const intent of this.callIntents.values()) {
      if (intent.calle_call_id === calleCallId) {
        return { ...intent };
      }
    }
    return null;
  }

  async saveCallSnapshot(snapshot: CallSnapshot): Promise<CallSnapshot> {
    this.callSnapshots.set(snapshot.id, { ...snapshot });
    return { ...snapshot };
  }

  async saveObservation(observation: Observation): Promise<Observation> {
    const list = this.observations.get(observation.incident_id) || [];
    // Deduplicate by calle_call_id and speaker_role
    const existingIdx = list.findIndex(
      (o) => o.calle_call_id === observation.calle_call_id && o.speaker_role === observation.speaker_role
    );
    if (existingIdx >= 0) {
      list[existingIdx] = { ...observation };
    } else {
      list.push({ ...observation });
    }
    this.observations.set(observation.incident_id, list);
    return { ...observation };
  }

  async getObservations(incidentId: string): Promise<Observation[]> {
    const list = this.observations.get(incidentId) || [];
    return list.map((obs) => ({ ...obs }));
  }

  async claimJob(
    jobId: string,
    workerId: string,
    leaseDurationMs: number
  ): Promise<{ claimed: boolean; job?: WorkflowJob }> {
    let job = this.workflowJobs.get(jobId);
    const now = new Date();
    if (!job) {
      // Auto-create job record if missing for fenced leasing
      job = {
        id: jobId,
        incident_id: jobId.split("_")[1] || "unknown",
        task_type: "advance",
        status: "pending",
        attempts: 0,
        created_at: now.toISOString(),
      };
      this.workflowJobs.set(jobId, job);
    }

    if (
      job.status === "running" &&
      job.lease_expires_at &&
      new Date(job.lease_expires_at) > now
    ) {
      return { claimed: false };
    }
    job.lease_owner = workerId;
    job.lease_expires_at = new Date(now.getTime() + leaseDurationMs).toISOString();
    job.status = "running";
    job.attempts += 1;
    return { claimed: true, job: { ...job } };
  }

  async completeJob(jobId: string): Promise<void> {
    const job = this.workflowJobs.get(jobId);
    if (job) {
      job.status = "completed";
      job.lease_owner = undefined;
      job.lease_expires_at = undefined;
    }
  }

  async finalizeReceipt(receipt: Receipt): Promise<Receipt> {
    this.receipts.set(receipt.id, { ...receipt });
    const incident = this.incidents.get(receipt.incident_id);
    if (incident) {
      incident.status = "plan_confirmed";
      incident.confirmed_receipt_id = receipt.id;
      incident.causal_proof_id = receipt.causal_proof_id;
      incident.causal_proof_short_id = receipt.causal_proof_short_id;
      incident.state_revision += 1;
      incident.updated_at = new Date().toISOString();
    }
    return { ...receipt };
  }

  async getReceipt(id: string): Promise<Receipt | null> {
    const receipt = this.receipts.get(id);
    return receipt ? { ...receipt } : null;
  }

  async getReceiptByIncident(incidentId: string): Promise<Receipt | null> {
    const matching: Receipt[] = [];
    for (const r of this.receipts.values()) {
      if (r.incident_id === incidentId) matching.push({ ...r });
    }
    if (matching.length === 0) return null;
    matching.sort((a, b) => b.version - a.version);
    return matching[0];
  }

  async createHandoffToken(token: HandoffToken): Promise<HandoffToken> {
    this.handoffTokens.set(token.token_hash, { ...token });
    const incident = this.incidents.get(token.incident_id);
    if (incident) {
      incident.handoff_token_id = token.id;
      incident.updated_at = new Date().toISOString();
    }
    return { ...token };
  }

  async getHandoffTokenByHash(tokenHash: string): Promise<HandoffToken | null> {
    const token = this.handoffTokens.get(tokenHash);
    return token ? { ...token } : null;
  }

  async getHandoffTokenByIncident(incidentId: string): Promise<HandoffToken | null> {
    const matching: HandoffToken[] = [];
    for (const token of this.handoffTokens.values()) {
      if (token.incident_id === incidentId) matching.push({ ...token });
    }
    if (matching.length === 0) return null;
    matching.sort((a, b) => b.receipt_version - a.receipt_version);
    return matching[0];
  }

  async acknowledgeHandoff(
    tokenHash: string,
    ack: { acknowledged_at: string; client_ip_hash?: string; user_agent?: string }
  ): Promise<{ success: boolean; token?: HandoffToken; receipt?: Receipt }> {
    const token = this.handoffTokens.get(tokenHash);
    if (!token) {
      return { success: false };
    }

    // Check expiry
    if (new Date(token.expires_at) < new Date(ack.acknowledged_at)) {
      return { success: false };
    }

    // Idempotent: if already acknowledged, return success
    if (token.acknowledged_at) {
      const receipt = await this.getReceipt(token.receipt_id);
      return { success: true, token: { ...token }, receipt: receipt || undefined };
    }

    token.acknowledged_at = ack.acknowledged_at;

    const ackRecord: HandoffAcknowledgment = {
      id: `ack_${token.id}`,
      token_id: token.id,
      acknowledged_at: ack.acknowledged_at,
      client_ip_hash: ack.client_ip_hash,
      user_agent: ack.user_agent,
    };
    this.handoffAcks.set(ackRecord.id, ackRecord);

    const incident = this.incidents.get(token.incident_id);
    if (incident) {
      incident.status = "driver_received";
      incident.state_revision += 1;
      incident.updated_at = new Date().toISOString();
    }

    // Update CausalProof chain if present
    const proofKey = `${token.incident_id}_v${token.receipt_version}`;
    const proof = this.causalProofs.get(proofKey);
    if (proof) {
      const ackLink = proof.chain.find((l) => l.step === "driver_received");
      if (ackLink) {
        ackLink.status = "valid";
        ackLink.fact = `Acknowledged by driver at ${ack.acknowledged_at}`;
      }
    }

    const receipt = await this.getReceipt(token.receipt_id);
    return { success: true, token: { ...token }, receipt: receipt || undefined };
  }

  async saveCausalProof(proof: CausalProof): Promise<CausalProof> {
    const key = `${proof.incident_id}_v${proof.receipt_version}`;
    this.causalProofs.set(key, { ...proof });

    const incident = this.incidents.get(proof.incident_id);
    if (incident) {
      incident.causal_proof_id = proof.id;
      incident.causal_proof_short_id = proof.short_id;
    }

    return { ...proof };
  }

  async getCausalProof(incidentId: string, version?: number): Promise<CausalProof | null> {
    if (version !== undefined) {
      const proof = this.causalProofs.get(`${incidentId}_v${version}`);
      return proof ? { ...proof } : null;
    }
    // Latest version
    const matching: CausalProof[] = [];
    for (const p of this.causalProofs.values()) {
      if (p.incident_id === incidentId) matching.push({ ...p });
    }
    if (matching.length === 0) return null;
    matching.sort((a, b) => b.receipt_version - a.receipt_version);
    return matching[0];
  }

  async recordAuditEvent(event: Omit<AuditEvent, "id" | "created_at">): Promise<AuditEvent> {
    const list = this.auditEvents.get(event.incident_id) || [];
    const fullEvent: AuditEvent = {
      ...event,
      id: `audit_${event.incident_id}_${list.length + 1}_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    list.push(fullEvent);
    this.auditEvents.set(event.incident_id, list);
    return { ...fullEvent };
  }

  async getAuditEvents(incidentId: string): Promise<AuditEvent[]> {
    const list = this.auditEvents.get(incidentId) || [];
    return list.map((ev) => ({ ...ev }));
  }
}
