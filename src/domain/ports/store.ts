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
} from "../types";

export interface Store {
  // Incidents
  getIncident(id: string): Promise<Incident | null>;
  listIncidents(): Promise<Incident[]>;
  createIncident(incident: Incident): Promise<Incident>;
  updateIncident(incident: Incident): Promise<Incident>;

  // Authority (Immutable versioning)
  freezeAuthority(
    incidentId: string,
    authority: Omit<AuthorityVersion, "id" | "incident_id" | "version" | "created_at">
  ): Promise<AuthorityVersion>;
  getLatestAuthority(incidentId: string): Promise<AuthorityVersion | null>;
  getAuthorityVersion(incidentId: string, version: number): Promise<AuthorityVersion | null>;

  // Two-task atomic budget reservation
  reserveCallBudget(incidentId: string, count: number): Promise<{ success: boolean; remaining: number }>;

  // Call Intents & Snapshots (Idempotency)
  saveCallIntent(intent: CallIntent): Promise<CallIntent>;
  getCallIntent(id: string): Promise<CallIntent | null>;
  getCallIntentByIdempotencyKey(key: string): Promise<CallIntent | null>;
  getCallIntentByCalleCallId(calleCallId: string): Promise<CallIntent | null>;
  saveCallSnapshot(snapshot: CallSnapshot): Promise<CallSnapshot>;

  // Observations
  saveObservation(observation: Observation): Promise<Observation>;
  getObservations(incidentId: string): Promise<Observation[]>;

  // Workflow Jobs (Fenced Lease)
  claimJob(
    jobId: string,
    workerId: string,
    leaseDurationMs: number
  ): Promise<{ claimed: boolean; job?: WorkflowJob }>;
  completeJob(jobId: string): Promise<void>;

  // Receipts (Finalization)
  finalizeReceipt(receipt: Receipt): Promise<Receipt>;
  getReceipt(id: string): Promise<Receipt | null>;
  getReceiptByIncident(incidentId: string): Promise<Receipt | null>;

  // Driver Handoff Tokens
  createHandoffToken(token: HandoffToken): Promise<HandoffToken>;
  getHandoffTokenByHash(tokenHash: string): Promise<HandoffToken | null>;
  getHandoffTokenByIncident(incidentId: string): Promise<HandoffToken | null>;
  acknowledgeHandoff(
    tokenHash: string,
    ack: { acknowledged_at: string; client_ip_hash?: string; user_agent?: string }
  ): Promise<{ success: boolean; token?: HandoffToken; receipt?: Receipt }>;

  // Causal Appointment Proofs
  saveCausalProof(proof: CausalProof): Promise<CausalProof>;
  getCausalProof(incidentId: string, version?: number): Promise<CausalProof | null>;

  // Audit Events
  recordAuditEvent(event: Omit<AuditEvent, "id" | "created_at">): Promise<AuditEvent>;
  getAuditEvents(incidentId: string): Promise<AuditEvent[]>;
}
