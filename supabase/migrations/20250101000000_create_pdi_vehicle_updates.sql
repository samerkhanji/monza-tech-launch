-- PDI checklists unified table
create table if not exists public.pdi_checklists (
  id uuid primary key default gen_random_uuid(),
  vin text not null,
  model text not null,
  outlet_name text not null,
  outlet_number text not null,
  estimated_delivery_date date,
  manufacturing_date date,
  range_extender_no text,
  battery_no text,
  front_motor_no text,
  rear_motor_no text,
  market_quality_opt_out boolean default false,
  customer_requirements_mounting boolean default false,
  customer_requirements_other text,
  activity_no text,
  sections jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Software vehicle updates
create table if not exists public.vehicle_updates (
  id uuid primary key default gen_random_uuid(),
  car_vin text not null,
  technician_id uuid references auth.users(id),
  new_version text not null,
  previous_version text,
  status text not null default 'scheduled',
  started_at timestamptz default now(),
  completed_at timestamptz,
  notes text,
  constraint version_semver check (new_version ~ '^[0-9]+\.[0-9]+\.[0-9]+$')
);

comment on table public.pdi_checklists is 'Unified PDI schema used by web form and PDF print';
comment on table public.vehicle_updates is 'Records of IT software updates per vehicle';


