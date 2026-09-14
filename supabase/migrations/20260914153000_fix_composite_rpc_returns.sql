-- Fix composite-return RPCs used by the production Supabase store.
-- A single composite OUT parameter must be assigned before RETURN NEXT;
-- RETURN QUERY SELECT row_variable expands the row and fails with 42804.

create or replace function public.freeze_authority_version(
  p_incident_id text,
  p_earliest timestamptz,
  p_latest timestamptz,
  p_timezone text,
  p_fee_ceiling numeric,
  p_currency text,
  p_budget integer,
  p_allow_selection boolean,
  p_expires_at timestamptz
)
returns table (auth_record public.authority_versions)
language plpgsql
security invoker
set search_path = public
as $function$
declare
  next_v integer;
  res public.authority_versions%rowtype;
begin
  perform 1 from public.incidents where id = p_incident_id for update;
  if not found then
    raise exception 'Incident % does not exist', p_incident_id;
  end if;

  select coalesce(max(version), 0) + 1 into next_v
  from public.authority_versions
  where incident_id = p_incident_id;

  insert into public.authority_versions (
    id, incident_id, version, earliest_time, latest_time, timezone,
    fee_ceiling, currency, budget, allow_selection_inside_interval, expires_at
  ) values (
    'auth_' || p_incident_id || '_v' || next_v,
    p_incident_id, next_v, p_earliest, p_latest, p_timezone,
    p_fee_ceiling, p_currency, p_budget, p_allow_selection, p_expires_at
  ) returning * into res;

  update public.incidents
  set authority_version = next_v,
      status = 'authorized',
      state_revision = state_revision + 1,
      updated_at = now()
  where id = p_incident_id;

  auth_record := res;
  return next;
end;
$function$;

create or replace function public.claim_workflow_job(
  p_job_id text,
  p_worker_id text,
  p_lease_ms integer
)
returns table (claimed boolean, job_record public.workflow_jobs)
language plpgsql
security invoker
set search_path = public
as $function$
declare
  r public.workflow_jobs%rowtype;
begin
  select * into r
  from public.workflow_jobs
  where id = p_job_id
  for update;

  if not found then
    claimed := false;
    job_record := null;
    return next;
    return;
  end if;

  if r.status != 'running' or r.lease_expires_at is null or r.lease_expires_at < now() then
    update public.workflow_jobs
    set lease_owner = p_worker_id,
        lease_expires_at = now() + (p_lease_ms || ' milliseconds')::interval,
        status = 'running',
        attempts = attempts + 1
    where id = p_job_id
    returning * into r;

    claimed := true;
    job_record := r;
  else
    claimed := false;
    job_record := r;
  end if;

  return next;
end;
$function$;
