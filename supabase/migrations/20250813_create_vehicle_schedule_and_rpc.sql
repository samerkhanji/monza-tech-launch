-- Ensure UUID generation is available
create extension if not exists pgcrypto;

-- Minimal schedule_jobs table for scheduling jobs (kept simple for Test Drive)
create table if not exists public.schedule_jobs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null,
  title text not null,
  reason text,
  priority int default 2 check (priority between 1 and 5),
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  assignee_user_id uuid,
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELED')),
  vehicle_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists schedule_jobs_vehicle_id_idx on public.schedule_jobs(vehicle_id);
create index if not exists schedule_jobs_status_idx on public.schedule_jobs(status);

-- Snapshot trigger: copy current vehicle row into job snapshot on insert (best-effort)
create or replace function public.fn_schedule_job_snapshot()
returns trigger language plpgsql as $$
begin
  begin
    select to_jsonb(v.*) into new.vehicle_snapshot
    from public.vehicles v where v.id = new.vehicle_id;
  exception when others then
    -- ignore snapshot failure
    new.vehicle_snapshot := '{}'::jsonb;
  end;
  new.updated_at := now();
  return new;
end;$$;

drop trigger if exists trg_schedule_job_snapshot on public.schedule_jobs;
create trigger trg_schedule_job_snapshot
before insert on public.schedule_jobs
for each row execute function public.fn_schedule_job_snapshot();

-- RPC: move vehicle to schedule (used by NewTestDrivePage)
create or replace function public.rpc_vehicle_move_to_schedule(
  p_vehicle_id uuid,
  p_title text,
  p_reason text,
  p_priority int,
  p_start timestamptz,
  p_end timestamptz,
  p_assignee_user_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_job_id uuid;
begin
  insert into public.schedule_jobs(
    vehicle_id, title, reason, priority, scheduled_start, scheduled_end, assignee_user_id
  ) values (
    p_vehicle_id, coalesce(p_title,'Job'), p_reason, coalesce(p_priority,2), p_start, p_end, p_assignee_user_id
  ) returning id into v_job_id;

  -- Optional: reflect that vehicle is being worked on (best-effort; ignore if vehicles table differs)
  begin
    update public.vehicles
      set status = coalesce(status, 'In Service'),
          updated_at = now()
      where id = p_vehicle_id;
  exception when others then
    -- ignore if vehicles table/columns differ in this project
    null;
  end;

  return v_job_id;
end;$$;

-- RLS: allow basic access in dev (adjust for prod)
alter table public.schedule_jobs enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'schedule_jobs' and policyname = 'dev all'
  ) then
    create policy "dev all" on public.schedule_jobs for all using (true) with check (true);
  end if;
end $$;


