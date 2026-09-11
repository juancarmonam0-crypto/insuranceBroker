create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_agency_member(target_agency_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.agency_users
    where agency_users.agency_id = target_agency_id
      and agency_users.user_id = auth.uid()
  );
$$;

create table if not exists public.agencies (
  id text primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.agency_users (
  id uuid primary key default gen_random_uuid(),
  agency_id text not null references public.agencies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (agency_id, user_id)
);

create table if not exists public.customers (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  type text not null,
  display_name text not null,
  email text,
  phone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.businesses (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  customer_id text not null references public.customers(id) on delete cascade,
  legal_name text not null,
  dba_name text,
  entity_type text not null,
  state_of_formation text,
  annual_revenue numeric,
  naics_code text,
  employee_count integer,
  years_in_business integer,
  fein text,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (customer_id)
);

create table if not exists public.people (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  customer_id text not null references public.customers(id) on delete cascade,
  first_name text,
  last_name text,
  dob date,
  role text,
  email text,
  phone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.locations (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  customer_id text not null references public.customers(id) on delete cascade,
  label text,
  address_line_1 text,
  city text,
  state text,
  postal_code text,
  occupancy text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vehicles (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  customer_id text not null references public.customers(id) on delete cascade,
  year integer,
  make text,
  model text,
  vin text,
  usage text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_policies (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  customer_id text not null references public.customers(id) on delete cascade,
  carrier_name text,
  effective_date date,
  expiration_date date,
  limits text,
  premium numeric,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (customer_id)
);

create table if not exists public.loss_history (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  customer_id text not null references public.customers(id) on delete cascade,
  loss_date date,
  description text,
  amount numeric,
  status text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.applications (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  customer_id text not null references public.customers(id) on delete restrict,
  definition_id text not null,
  definition_version integer not null,
  line_of_business text not null,
  status text not null,
  customer_name text,
  completion integer not null default 0,
  missing_fields_json jsonb not null default '[]'::jsonb,
  customer_confirmed boolean not null default false,
  broker_verified boolean not null default false,
  broker_notes_json jsonb not null default '[]'::jsonb,
  generated_at timestamptz,
  profile_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.application_field_states (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  application_id text not null references public.applications(id) on delete cascade,
  field_key text not null,
  value_json jsonb,
  selected_source text,
  customer_confirmed boolean not null default false,
  broker_verified boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (application_id, field_key)
);

create table if not exists public.field_provenance (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  application_id text not null references public.applications(id) on delete cascade,
  field_key text not null,
  value_json jsonb not null,
  source_type text not null,
  source_reference text,
  confidence numeric,
  created_at timestamptz not null default timezone('utc', now()),
  metadata_json jsonb not null default '{}'::jsonb
);

create table if not exists public.application_conflicts (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  application_id text not null references public.applications(id) on delete cascade,
  field_key text not null,
  conflict_type text,
  blocking boolean not null default true,
  status text not null,
  payload_json jsonb not null default '{}'::jsonb,
  resolution_action text,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.documents (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  customer_id text not null references public.customers(id) on delete cascade,
  application_id text references public.applications(id) on delete set null,
  storage_path text not null,
  filename text not null,
  mime_type text,
  document_type text,
  status text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.application_snapshots (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  application_id text not null references public.applications(id) on delete cascade,
  application_definition_id text not null,
  application_definition_version integer not null,
  snapshot_json jsonb not null,
  snapshot_hash text not null,
  created_at timestamptz not null default timezone('utc', now()),
  created_by text not null
);

create index if not exists idx_customers_agency_id on public.customers (agency_id);
create index if not exists idx_people_customer_id on public.people (customer_id);
create index if not exists idx_locations_customer_id on public.locations (customer_id);
create index if not exists idx_vehicles_customer_id on public.vehicles (customer_id);
create index if not exists idx_loss_history_customer_id on public.loss_history (customer_id);
create index if not exists idx_documents_agency_application on public.documents (agency_id, application_id);
create index if not exists idx_applications_agency_customer on public.applications (agency_id, customer_id);
create index if not exists idx_field_states_app_field on public.application_field_states (application_id, field_key);
create index if not exists idx_field_provenance_app_field on public.field_provenance (application_id, field_key, created_at desc);
create index if not exists idx_application_conflicts_app_field on public.application_conflicts (application_id, field_key);
create index if not exists idx_application_snapshots_app_created on public.application_snapshots (application_id, created_at desc);

create or replace function public.prevent_snapshot_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'application_snapshots are immutable';
end;
$$;

create or replace trigger set_agencies_updated_at
before update on public.agencies
for each row execute function public.set_updated_at();

create or replace trigger set_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create or replace trigger set_businesses_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

create or replace trigger set_people_updated_at
before update on public.people
for each row execute function public.set_updated_at();

create or replace trigger set_locations_updated_at
before update on public.locations
for each row execute function public.set_updated_at();

create or replace trigger set_vehicles_updated_at
before update on public.vehicles
for each row execute function public.set_updated_at();

create or replace trigger set_customer_policies_updated_at
before update on public.customer_policies
for each row execute function public.set_updated_at();

create or replace trigger set_loss_history_updated_at
before update on public.loss_history
for each row execute function public.set_updated_at();

create or replace trigger set_applications_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

create or replace trigger prevent_application_snapshots_update
before update or delete on public.application_snapshots
for each row execute function public.prevent_snapshot_mutation();

alter table public.agencies enable row level security;
alter table public.agency_users enable row level security;
alter table public.customers enable row level security;
alter table public.businesses enable row level security;
alter table public.people enable row level security;
alter table public.locations enable row level security;
alter table public.vehicles enable row level security;
alter table public.customer_policies enable row level security;
alter table public.loss_history enable row level security;
alter table public.applications enable row level security;
alter table public.application_field_states enable row level security;
alter table public.field_provenance enable row level security;
alter table public.application_conflicts enable row level security;
alter table public.documents enable row level security;
alter table public.application_snapshots enable row level security;

create policy "agency members read agencies"
on public.agencies for select
using (public.is_agency_member(id));

create policy "agency members read their membership"
on public.agency_users for select
using (public.is_agency_member(agency_id));

create policy "agency members manage customers"
on public.customers for all
using (public.is_agency_member(agency_id))
with check (public.is_agency_member(agency_id));

create policy "agency members manage businesses"
on public.businesses for all
using (public.is_agency_member(agency_id))
with check (public.is_agency_member(agency_id));

create policy "agency members manage people"
on public.people for all
using (public.is_agency_member(agency_id))
with check (public.is_agency_member(agency_id));

create policy "agency members manage locations"
on public.locations for all
using (public.is_agency_member(agency_id))
with check (public.is_agency_member(agency_id));

create policy "agency members manage vehicles"
on public.vehicles for all
using (public.is_agency_member(agency_id))
with check (public.is_agency_member(agency_id));

create policy "agency members manage customer policies"
on public.customer_policies for all
using (public.is_agency_member(agency_id))
with check (public.is_agency_member(agency_id));

create policy "agency members manage loss history"
on public.loss_history for all
using (public.is_agency_member(agency_id))
with check (public.is_agency_member(agency_id));

create policy "agency members manage applications"
on public.applications for all
using (public.is_agency_member(agency_id))
with check (public.is_agency_member(agency_id));

create policy "agency members manage application field states"
on public.application_field_states for all
using (public.is_agency_member(agency_id))
with check (public.is_agency_member(agency_id));

create policy "agency members manage field provenance"
on public.field_provenance for all
using (public.is_agency_member(agency_id))
with check (public.is_agency_member(agency_id));

create policy "agency members manage application conflicts"
on public.application_conflicts for all
using (public.is_agency_member(agency_id))
with check (public.is_agency_member(agency_id));

create policy "agency members manage documents"
on public.documents for all
using (public.is_agency_member(agency_id))
with check (public.is_agency_member(agency_id));

create policy "agency members insert and read snapshots"
on public.application_snapshots for select
using (public.is_agency_member(agency_id));

create policy "agency members insert snapshots"
on public.application_snapshots for insert
with check (public.is_agency_member(agency_id));

insert into storage.buckets (id, name, public)
values ('insurance-documents', 'insurance-documents', false)
on conflict (id) do nothing;

create policy "agency members read private insurance documents"
on storage.objects for select
using (
  bucket_id = 'insurance-documents'
  and public.is_agency_member((storage.foldername(name))[1])
);

create policy "agency members upload private insurance documents"
on storage.objects for insert
with check (
  bucket_id = 'insurance-documents'
  and public.is_agency_member((storage.foldername(name))[1])
);

create policy "agency members update private insurance documents"
on storage.objects for update
using (
  bucket_id = 'insurance-documents'
  and public.is_agency_member((storage.foldername(name))[1])
)
with check (
  bucket_id = 'insurance-documents'
  and public.is_agency_member((storage.foldername(name))[1])
);
