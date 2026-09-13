-- DwellGuard Schema Migration
-- Minimal 10 persisted records with atomic procedures for authority freeze, budget reservation, and fenced leasing.

create table if not exists incidents (
  id text primary key,
  load_ref text not null,
  carrier text not null,
  origin text not null,
  destination text not null,
  dock_name text not null,
  dock_contact_name text not null,
  dock_phone text not null,
  driver_contact_name text not null,
  driver_phone text not null,
  original_appointment timestamptz not null,
  updated_eta timestamptz not null,
  status text not null,
  authority_version integer not null default 0,
  state_revision integer not null default 0,
  task_budget_remaining integer not null default 2,
  driver_calle_call_id text,
  dock_calle_call_id text,
  confirmed_receipt_id text,
  handoff_token_id text,
  resolution_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists authority_versions (
  id text primary key,
  incident_id text not null references incidents(id) on delete cascade,
  version integer not null,
  earliest_time timestamptz not null,
  latest_time timestamptz not null,
  timezone text not null,
  fee_ceiling numeric not null default 0,
  currency text not null default 'USD',
  budget integer not null default 2,
  allow_selection_inside_interval boolean not null default true,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint unique_incident_authority_version unique (incident_id, version)
);

create table if not exists call_intents (
  id text primary key,
  incident_id text not null references incidents(id) on delete cascade,
  authority_version integer not null,
  call_type text not null,
  idempotency_key text not null unique,
  payload jsonb not null,
  status text not null,
  calle_call_id text,
  created_at timestamptz not null default now()
);

create table if not exists call_snapshots (
  id text primary key,
  intent_id text not null references call_intents(id) on delete cascade,
  calle_call_id text not null,
  status text not null,
  request_dump jsonb not null,
  response_dump jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists observations (
  id text primary key,
  incident_id text not null references incidents(id) on delete cascade,
  calle_call_id text not null,
  speaker_role text not null,
  verified_interval_start timestamptz,
  verified_interval_end timestamptz,
  selection_permitted boolean,
  confirmed_time timestamptz,
  door text,
  fee_amount numeric,
  fee_currency text,
  conditions text,
  raw_transcript_snippet text,
  evidence_text jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists workflow_jobs (
  id text primary key,
  incident_id text not null references incidents(id) on delete cascade,
  task_type text not null,
  status text not null,
  lease_owner text,
  lease_expires_at timestamptz,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists receipts (
  id text primary key,
  incident_id text not null references incidents(id) on delete cascade,
  version integer not null,
  load_ref text not null,
  confirmed_time timestamptz not null,
  timezone text not null,
  dock_name text not null,
  door text,
  fee_amount numeric not null default 0,
  fee_currency text not null default 'USD',
  confirmation_basis text not null,
  created_at timestamptz not null default now(),
  constraint unique_incident_receipt_version unique (incident_id, version)
);

create table if not exists handoff_tokens (
  id text primary key,
  incident_id text not null references incidents(id) on delete cascade,
  receipt_id text not null references receipts(id) on delete cascade,
  receipt_version integer not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists handoff_acknowledgments (
  id text primary key,
  token_id text not null references handoff_tokens(id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  client_ip_hash text,
  user_agent text
);

create table if not exists audit_events (
  id text primary key,
  incident_id text not null references incidents(id) on delete cascade,
  authority_version integer not null,
  state_revision integer not null,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Atomic two-task budget reservation
create or replace function reserve_call_budget(p_incident_id text, p_count integer)
returns table (success boolean, remaining integer) as $$
declare
  cur_remaining integer;
begin
  select task_budget_remaining into cur_remaining
  from incidents
  where id = p_incident_id
  for update;

  if not found then
    return query select false, 0;
    return;
  end if;

  if cur_remaining >= p_count then
    update incidents
    set task_budget_remaining = task_budget_remaining - p_count,
        updated_at = now()
    where id = p_incident_id;

    return query select true, cur_remaining - p_count;
  else
    return query select false, cur_remaining;
  end if;
end;
$$ language plpgsql;
