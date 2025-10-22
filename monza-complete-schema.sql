-- =============================================
-- MONZA TECH - COMPLETE DATABASE SCHEMA
-- =============================================
-- This file contains the complete, reliable schema for Monza TECH
-- Run this in Supabase SQL Editor to set up the entire database

-- 1. CARS TABLE (Single source of truth)
-- =============================================
create table if not exists public.cars (
  id bigserial primary key,
  vin text unique not null,
  model text not null,
  category text,                -- SUV, Sedan, etc.
  year int,
  color text,
  interior_color text,
  battery_range_capacity text,  -- e.g. "106 kWh" or "EREV 1.5T + 43kWh"
  km_driven numeric,
  price numeric,
  location text check (location in ('FLOOR_1','FLOOR_2','GARAGE','INVENTORY','ORDERED')) default 'INVENTORY',
  status text,                  -- e.g. "In Showroom", "Under Repair", "Reserved", etc.
  software_model text,          -- e.g. "E-Horizon v2.1"
  customs_status text,          -- e.g. "Cleared", "Pending", "Duty Paid", etc.
  warranty_start date,
  warranty_end date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  version int default 1 not null
);

-- Touch function for updated_at and version tracking
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.version := coalesce(old.version, 1) + 1;
  return new;
end $$;

-- Trigger for cars table
drop trigger if exists trg_cars_touch on public.cars;
create trigger trg_cars_touch
before update on public.cars
for each row execute function public.touch_updated_at();

-- Warranty life computed view
create or replace view public.car_warranty_life as
select
  id as car_id,
  warranty_start,
  warranty_end,
  case
    when warranty_end is null then null
    else (warranty_end::date - greatest(now()::date, warranty_start::date))::int
  end as days_remaining
from public.cars;

-- 2. MODULE TABLES (Normalized, with history)
-- =============================================

-- Messages & Requests (threaded, fileable, preservable)
create table if not exists public.threads (
  id bigserial primary key,
  car_id bigint references public.cars(id) on delete set null,
  kind text check (kind in ('MESSAGE','REQUEST')) not null,
  title text not null,
  status text default 'OPEN',   -- OPEN, IN_PROGRESS, DONE, CANCELED
  priority text,                -- LOW, MEDIUM, HIGH, URGENT
  created_by uuid,              -- auth.uid()
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.thread_messages (
  id bigserial primary key,
  thread_id bigint references public.threads(id) on delete cascade,
  body text not null,
  attachments jsonb default '[]'::jsonb,
  author uuid,
  created_at timestamptz default now()
);

-- PDI (latest + full history)
create table if not exists public.pdi_inspections (
  id bigserial primary key,
  car_id bigint references public.cars(id) on delete cascade,
  data jsonb not null,          -- structured PDI fields
  status text default 'PENDING',-- PENDING, PASSED, FAILED
  inspected_by uuid,
  created_at timestamptz default now()
);

-- Fast "latest PDI" view
create or replace view public.pdi_latest as
select distinct on (car_id)
  car_id, id as pdi_id, data, status, created_at
from public.pdi_inspections
order by car_id, created_at desc;

-- Test Drive (bookings + outcomes)
create table if not exists public.test_drives (
  id bigserial primary key,
  car_id bigint references public.cars(id) on delete cascade,
  customer_name text,
  phone text,
  scheduled_at timestamptz,
  result text,                  -- e.g. "Completed", "No-show", "Rescheduled"
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Customs / Software model snapshots (history-friendly)
create table if not exists public.car_software_logs (
  id bigserial primary key,
  car_id bigint references public.cars(id) on delete cascade,
  software_model text not null,
  notes text,
  created_at timestamptz default now(),
  created_by uuid
);

create table if not exists public.car_customs_logs (
  id bigserial primary key,
  car_id bigint references public.cars(id) on delete cascade,
  customs_status text not null,
  reference_doc text,
  created_at timestamptz default now(),
  created_by uuid
);

-- Financials (edits must persist)
create table if not exists public.financial_entries (
  id bigserial primary key,
  car_id bigint references public.cars(id) on delete set null,
  kind text,                     -- e.g. "Sale", "Deposit", "Duty", "RepairCost"
  amount numeric not null,
  currency text default 'USD',
  meta jsonb default '{}'::jsonb, -- any form fields
  created_at timestamptz default now(),
  created_by uuid
);

-- Marketing / CRM
create table if not exists public.crm_contacts (
  id bigserial primary key,
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.crm_interactions (
  id bigserial primary key,
  contact_id bigint references public.crm_contacts(id) on delete cascade,
  car_id bigint references public.cars(id) on delete set null,
  channel text,                  -- WhatsApp, Call, Instagram, Walk-in...
  summary text,
  next_action_at timestamptz,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.marketing_activities (
  id bigserial primary key,
  title text not null,
  channel text,                  -- IG, FB, TikTok, Email, PR Drive...
  budget numeric,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Business Calendar (internal)
create table if not exists public.business_calendar (
  id bigserial primary key,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  meta jsonb default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz default now()
);

-- 3. UNIVERSAL CHANGE LOG (Auto history for any table)
-- =============================================
create table if not exists public.audit_log (
  id bigserial primary key,
  table_name text not null,
  row_id text not null,
  action text check (action in ('INSERT','UPDATE','DELETE')) not null,
  old_data jsonb,
  new_data jsonb,
  actor uuid,
  at timestamptz default now()
);

create or replace function public.log_change()
returns trigger language plpgsql as $$
begin
  insert into public.audit_log(table_name, row_id, action, old_data, new_data, actor)
  values (tg_table_name, coalesce(new.id, old.id)::text, tg_op,
          to_jsonb(old), to_jsonb(new), auth.uid());
  return coalesce(new, old);
end $$;

-- Attach audit triggers to critical tables
do $$ declare t text;
begin
  foreach t in array array[
    'public.cars',
    'public.pdi_inspections',
    'public.test_drives',
    'public.threads',
    'public.thread_messages',
    'public.financial_entries',
    'public.crm_contacts',
    'public.crm_interactions',
    'public.marketing_activities',
    'public.business_calendar',
    'public.car_software_logs',
    'public.car_customs_logs'
  ]
  loop
    execute format('drop trigger if exists trg_audit_%1$s on %1$s', split_part(t,'.',2));
    execute format(
      'create trigger trg_audit_%1$s after insert or update or delete on %2$s
       for each row execute function public.log_change()',
      split_part(t,'.',2), t
    );
  end loop;
end $$;

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
alter table public.cars enable row level security;
alter table public.threads enable row level security;
alter table public.thread_messages enable row level security;
alter table public.pdi_inspections enable row level security;
alter table public.test_drives enable row level security;
alter table public.car_software_logs enable row level security;
alter table public.car_customs_logs enable row level security;
alter table public.financial_entries enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_interactions enable row level security;
alter table public.marketing_activities enable row level security;
alter table public.business_calendar enable row level security;

-- Cars policies
create policy "cars_read_all" on public.cars
for select using (auth.role() = 'authenticated');

create policy "cars_write_roles" on public.cars
for insert with check (auth.role() = 'authenticated');

create policy "cars_update_roles" on public.cars
for update using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Threads policies
create policy "threads_read_all" on public.threads
for select using (auth.role() = 'authenticated');

create policy "threads_write_roles" on public.threads
for all using (auth.role() = 'authenticated');

-- Thread messages policies
create policy "thread_messages_read_all" on public.thread_messages
for select using (auth.role() = 'authenticated');

create policy "thread_messages_write_roles" on public.thread_messages
for all using (auth.role() = 'authenticated');

-- PDI policies
create policy "pdi_read_all" on public.pdi_inspections
for select using (auth.role() = 'authenticated');

create policy "pdi_write_roles" on public.pdi_inspections
for all using (auth.role() = 'authenticated');

-- Test drives policies
create policy "test_drives_read_all" on public.test_drives
for select using (auth.role() = 'authenticated');

create policy "test_drives_write_roles" on public.test_drives
for all using (auth.role() = 'authenticated');

-- Financial entries policies
create policy "financial_read_all" on public.financial_entries
for select using (auth.role() = 'authenticated');

create policy "financial_write_roles" on public.financial_entries
for all using (auth.role() = 'authenticated');

-- CRM policies
create policy "crm_contacts_read_all" on public.crm_contacts
for select using (auth.role() = 'authenticated');

create policy "crm_contacts_write_roles" on public.crm_contacts
for all using (auth.role() = 'authenticated');

create policy "crm_interactions_read_all" on public.crm_interactions
for select using (auth.role() = 'authenticated');

create policy "crm_interactions_write_roles" on public.crm_interactions
for all using (auth.role() = 'authenticated');

-- Marketing activities policies
create policy "marketing_read_all" on public.marketing_activities
for select using (auth.role() = 'authenticated');

create policy "marketing_write_roles" on public.marketing_activities
for all using (auth.role() = 'authenticated');

-- Business calendar policies
create policy "calendar_read_all" on public.business_calendar
for select using (auth.role() = 'authenticated');

create policy "calendar_write_roles" on public.business_calendar
for all using (auth.role() = 'authenticated');

-- 5. USEFUL INDEXES FOR PERFORMANCE
-- =============================================
create index if not exists idx_cars_location on public.cars(location);
create index if not exists idx_cars_vin on public.cars(vin);
create index if not exists idx_cars_model on public.cars(model);
create index if not exists idx_threads_car_id on public.threads(car_id);
create index if not exists idx_thread_messages_thread_id on public.thread_messages(thread_id);
create index if not exists idx_pdi_car_id on public.pdi_inspections(car_id);
create index if not exists idx_test_drives_car_id on public.test_drives(car_id);
create index if not exists idx_test_drives_scheduled_at on public.test_drives(scheduled_at);
create index if not exists idx_financial_car_id on public.financial_entries(car_id);
create index if not exists idx_crm_interactions_contact_id on public.crm_interactions(contact_id);
create index if not exists idx_crm_interactions_car_id on public.crm_interactions(car_id);
create index if not exists idx_audit_log_table_name on public.audit_log(table_name);
create index if not exists idx_audit_log_row_id on public.audit_log(row_id);

-- 6. SAMPLE DATA FOR TESTING
-- =============================================
insert into public.cars (vin, model, category, year, color, interior_color, battery_range_capacity, km_driven, price, location, status, software_model, customs_status, warranty_start, warranty_end) values
('VIN001', 'Model S', 'Sedan', 2023, 'White', 'Black', '106 kWh', 15000, 85000, 'FLOOR_1', 'In Showroom', 'E-Horizon v2.1', 'Cleared', '2023-01-01', '2026-01-01'),
('VIN002', 'Model X', 'SUV', 2023, 'Black', 'White', '106 kWh', 25000, 95000, 'FLOOR_2', 'In Showroom', 'E-Horizon v2.1', 'Cleared', '2023-02-01', '2026-02-01'),
('VIN003', 'Model Y', 'SUV', 2024, 'Blue', 'Black', '106 kWh', 5000, 75000, 'GARAGE', 'Under Repair', 'E-Horizon v2.2', 'Pending', '2024-01-01', '2027-01-01'),
('VIN004', 'Model 3', 'Sedan', 2024, 'Red', 'White', '106 kWh', 0, 65000, 'INVENTORY', 'Available', 'E-Horizon v2.2', 'Duty Paid', '2024-03-01', '2027-03-01'),
('VIN005', 'Cybertruck', 'Truck', 2024, 'Silver', 'Black', 'EREV 1.5T + 43kWh', 0, 120000, 'ORDERED', 'On Order', 'E-Horizon v2.3', 'Pending', null, null);

-- Sample PDI inspection
insert into public.pdi_inspections (car_id, data, status, inspected_by) values
(1, '{"exterior": "Pass", "interior": "Pass", "mechanical": "Pass", "electrical": "Pass", "notes": "All systems operational"}', 'PASSED', auth.uid());

-- Sample test drive
insert into public.test_drives (car_id, customer_name, phone, scheduled_at, result, notes) values
(1, 'John Doe', '+1234567890', now() + interval '1 day', 'Scheduled', 'Interested in Model S');

-- Sample financial entry
insert into public.financial_entries (car_id, kind, amount, currency, meta, created_by) values
(1, 'Sale', 85000, 'USD', '{"customer": "John Doe", "payment_method": "Bank Transfer"}', auth.uid());

-- Sample CRM contact
insert into public.crm_contacts (name, phone, email, notes) values
('John Doe', '+1234567890', 'john@example.com', 'Interested in Model S, scheduled test drive');

-- Sample CRM interaction
insert into public.crm_interactions (contact_id, car_id, channel, summary, next_action_at) values
(1, 1, 'Walk-in', 'Customer visited showroom, interested in Model S', now() + interval '2 days');

-- Sample marketing activity
insert into public.marketing_activities (title, channel, budget, meta) values
('Q1 2024 Campaign', 'Instagram', 5000, '{"target_audience": "25-45", "focus": "Electric vehicles"}');

-- Sample business calendar event
insert into public.business_calendar (title, starts_at, ends_at, location, meta, created_by) values
('Team Meeting', now() + interval '1 week', now() + interval '1 week' + interval '2 hours', 'Office', '{"agenda": "Q1 Review"}', auth.uid());

-- =============================================
-- SCHEMA SETUP COMPLETE
-- =============================================
-- Your Monza TECH database is now ready with:
-- ✅ Cars table with version control and audit trails
-- ✅ Module tables for PDI, Test Drives, Messages, Financials, CRM
-- ✅ Universal audit logging for all changes
-- ✅ Row Level Security policies
-- ✅ Performance indexes
-- ✅ Sample data for testing
-- ✅ Warranty life computation view
