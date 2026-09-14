-- Keep database functions on a fixed schema path.
alter function public.reserve_call_budget(text, integer) set search_path = public;
alter function public.claim_workflow_job(text, text, integer) set search_path = public;
alter function public.freeze_authority_version(
  text, timestamptz, timestamptz, text, numeric, text, integer, boolean, timestamptz
) set search_path = public;

-- Cover each foreign key used during incident cleanup and workflow reads.
create index if not exists idx_audit_events_incident_id
  on public.audit_events(incident_id);
create index if not exists idx_call_intents_incident_id
  on public.call_intents(incident_id);
create index if not exists idx_call_snapshots_intent_id
  on public.call_snapshots(intent_id);
create index if not exists idx_handoff_acknowledgments_token_id
  on public.handoff_acknowledgments(token_id);
create index if not exists idx_handoff_tokens_incident_id
  on public.handoff_tokens(incident_id);
create index if not exists idx_handoff_tokens_receipt_id
  on public.handoff_tokens(receipt_id);
create index if not exists idx_observations_incident_id
  on public.observations(incident_id);
create index if not exists idx_workflow_jobs_incident_id
  on public.workflow_jobs(incident_id);

-- Support the recovery worker without scanning completed work.
create index if not exists idx_incidents_recovery_status
  on public.incidents(status, updated_at desc);
create index if not exists idx_workflow_jobs_claimable
  on public.workflow_jobs(status, lease_expires_at);
