/**
 * DwellGuard Core Domain Types
 * Matches the 10 minimal persisted records and business entities specified in DWELLGUARD_ANTIGRAVITY_MASTER.md.
 */

export type IncidentStatus =
  | "draft"
  | "authorized"
  | "driver_task_pending"
  | "driver_result_verified"
  | "dock_task_pending"
  | "plan_confirmed"
  | "driver_received"
  | "dispatcher_needed"
  | "stopped";

export type TruthfulOutcome =
  | "PLAN_CONFIRMED"
  | "DRIVER_RECEIVED"
  | "DISPATCHER_NEEDED";

export interface Incident {
  id: string;
  load_ref: string;
  carrier: string;
  origin: string;
  destination: string;
  dock_name: string;
  dock_contact_name: string;
  dock_phone: string;
  driver_contact_name: string;
  driver_phone: string;
  original_appointment: string; // ISO string with offset
  updated_eta: string;          // ISO string with offset
  status: IncidentStatus;
  authority_version: number;
  state_revision: number;
  task_budget_remaining: number; // Initially 2
  driver_calle_call_id?: string;
  dock_calle_call_id?: string;
  confirmed_receipt_id?: string;
  handoff_token_id?: string;
  resolution_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthorityVersion {
  id: string;
  incident_id: string;
  version: number;
  earliest_time: string; // ISO string with offset
  latest_time: string;   // ISO string with offset
  timezone: string;      // e.g. "America/New_York"
  fee_ceiling: number;   // e.g. 150
  currency: string;      // e.g. "USD"
  budget: number;        // Exactly 2
  allow_selection_inside_interval: boolean;
  expires_at: string;
  created_at: string;
}

export interface CallIntent {
  id: string;
  incident_id: string;
  authority_version: number;
  call_type: "driver" | "dock";
  idempotency_key: string;
  payload: Record<string, unknown>;
  status: "created" | "dispatched" | "completed" | "failed";
  calle_call_id?: string;
  created_at: string;
}

export interface CallSnapshot {
  id: string;
  intent_id: string;
  calle_call_id: string;
  status: string;
  request_dump: Record<string, unknown>;
  response_dump: Record<string, unknown>;
  created_at: string;
}

export interface Observation {
  id: string;
  incident_id: string;
  calle_call_id: string;
  speaker_role: "driver" | "dock";
  verified_interval_start?: string;
  verified_interval_end?: string;
  selection_permitted?: boolean;
  confirmed_time?: string;
  door?: string;
  fee_amount?: number;
  fee_currency?: string;
  conditions?: string;
  confirmation_basis?: string;
  raw_transcript_snippet?: string;
  evidence_text: string[];
  created_at: string;
}

export interface WorkflowJob {
  id: string;
  incident_id: string;
  task_type: "advance" | "driver_call" | "dock_call" | "reconcile";
  status: "pending" | "running" | "completed" | "failed";
  lease_owner?: string;
  lease_expires_at?: string;
  attempts: number;
  created_at: string;
}

export interface Receipt {
  id: string;
  incident_id: string;
  version: number;
  load_ref: string;
  confirmed_time: string;
  timezone: string;
  dock_name: string;
  door?: string;
  fee_amount: number;
  fee_currency: string;
  confirmation_basis: string;
  created_at: string;
}

export interface HandoffToken {
  id: string;
  incident_id: string;
  receipt_id: string;
  receipt_version: number;
  token_hash: string; // SHA-256 hex
  raw_token_display?: string; // Only stored in fixture mode / memory for test convenience
  expires_at: string;
  acknowledged_at?: string;
  created_at: string;
}

export interface HandoffAcknowledgment {
  id: string;
  token_id: string;
  acknowledged_at: string;
  client_ip_hash?: string;
  user_agent?: string;
}

export interface AuditEvent {
  id: string;
  incident_id: string;
  authority_version: number;
  state_revision: number;
  event_type: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface TimeInterval {
  start: string; // ISO
  end: string;   // ISO
  timezone: string;
}

export interface OverlapResult {
  hasOverlap: boolean;
  overlap?: TimeInterval;
  reason?: string;
  explanation: string;
}
