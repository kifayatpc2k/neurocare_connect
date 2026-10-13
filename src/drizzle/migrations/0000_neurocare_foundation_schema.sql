-- ============ ENUMS ============
create type public.app_role as enum ('patient', 'researcher', 'admin');
create type public.study_group as enum ('control', 'intervention');
create type public.study_milestone as enum ('baseline', 'day_15', 'day_30');
create type public.milestone_status as enum ('pending', 'in_progress', 'completed');
create type public.participant_status as enum ('screening', 'enrolled', 'withdrawn', 'completed');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  preferred_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ============ ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_research_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('researcher','admin'))
$$;

create policy "user_roles_select_own" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "user_roles_select_staff" on public.user_roles for select to authenticated using (public.is_research_staff(auth.uid()));
create policy "profiles_select_staff" on public.profiles for select to authenticated using (public.is_research_staff(auth.uid()));

-- new user bootstrap
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, 'patient')
  on conflict (user_id, role) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- shared updated_at helper
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============ PARTICIPANTS ============
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  participant_code text not null unique,
  profile_id uuid references public.profiles(id) on delete set null,
  study_group public.study_group,
  status public.participant_status not null default 'screening',
  enrolled_at date,
  site text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger participants_touch before update on public.participants
  for each row execute function public.touch_updated_at();

-- ============ RANDOMIZATION ============
create table public.randomizations (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null unique references public.participants(id) on delete cascade,
  study_group public.study_group not null,
  method text,
  allocation_seq integer,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz not null default now()
);

-- ============ DEMOGRAPHICS ============
create table public.demographics (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null unique references public.participants(id) on delete cascade,
  age_years integer,
  sex text,
  height_cm numeric,
  weight_kg numeric,
  education_level text,
  occupation text,
  residence text,
  socioeconomic_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger demographics_touch before update on public.demographics
  for each row execute function public.touch_updated_at();

-- ============ CLINICAL DATA ============
create table public.clinical_data (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null unique references public.participants(id) on delete cascade,
  primary_diagnosis text,
  pain_duration_months integer,
  comorbidities text[],
  allergies text[],
  lifestyle_notes text,
  clinical_notes text,
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger clinical_data_touch before update on public.clinical_data
  for each row execute function public.touch_updated_at();

-- ============ MILESTONE TRACKING ============
create table public.participant_milestones (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  milestone public.study_milestone not null,
  status public.milestone_status not null default 'pending',
  due_date date,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (participant_id, milestone)
);
create trigger participant_milestones_touch before update on public.participant_milestones
  for each row execute function public.touch_updated_at();

-- ============ ASSESSMENTS ============
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  milestone public.study_milestone not null,
  instrument text not null,
  status public.milestone_status not null default 'pending',
  conducted_at timestamptz,
  conducted_by uuid references auth.users(id),
  responses jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id, milestone, instrument)
);
create trigger assessments_touch before update on public.assessments
  for each row execute function public.touch_updated_at();

create table public.dn4_assessments (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  assessment_id uuid references public.assessments(id) on delete set null,
  milestone public.study_milestone not null,
  responses jsonb not null default '{}'::jsonb,
  total_score integer,
  interpretation text,
  conducted_at timestamptz,
  conducted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (participant_id, milestone)
);

-- ============ MEDICATIONS ============
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  drug_name text not null,
  dose text,
  frequency text,
  route text,
  indication text,
  start_date date,
  stop_date date,
  is_current boolean not null default true,
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger medications_touch before update on public.medications
  for each row execute function public.touch_updated_at();

create table public.drug_interactions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  medication_a_id uuid references public.medications(id) on delete set null,
  medication_b_id uuid references public.medications(id) on delete set null,
  drug_a text,
  drug_b text,
  severity text,
  mechanism text,
  management text,
  source text,
  identified_at timestamptz not null default now()
);

-- ============ DRPs ============
create table public.drps (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  medication_id uuid references public.medications(id) on delete set null,
  milestone public.study_milestone,
  pcne_problem_code text,
  pcne_cause_code text,
  pcne_intervention_code text,
  pcne_outcome_code text,
  description text,
  status text not null default 'open',
  identified_by uuid references auth.users(id),
  identified_at timestamptz not null default now(),
  resolved_at timestamptz,
  updated_at timestamptz not null default now()
);
create trigger drps_touch before update on public.drps
  for each row execute function public.touch_updated_at();

-- ============ INTERVENTION ============
create table public.counselling_sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  milestone public.study_milestone,
  session_date date,
  duration_minutes integer,
  topics text[],
  materials_provided text[],
  notes text,
  delivered_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.physician_recommendations (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  drp_id uuid references public.drps(id) on delete cascade,
  recommendation text,
  communicated_at timestamptz,
  communication_mode text,
  acceptance_status text not null default 'pending',
  physician_response text,
  responded_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger physician_recommendations_touch before update on public.physician_recommendations
  for each row execute function public.touch_updated_at();

-- ============ FOLLOW-UPS ============
create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  milestone public.study_milestone not null,
  status public.milestone_status not null default 'pending',
  scheduled_for date,
  contacted_at timestamptz,
  contact_mode text,
  outcome text,
  notes text,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id, milestone)
);
create trigger follow_ups_touch before update on public.follow_ups
  for each row execute function public.touch_updated_at();

-- ============ ACTIVITY + AUDIT ============
create table public.activity_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  portal text not null,
  route text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  user_agent text
);
grant select, insert, update on public.activity_sessions to authenticated;
grant all on public.activity_sessions to service_role;
alter table public.activity_sessions enable row level security;
create policy "activity_own_insert" on public.activity_sessions for insert to authenticated with check (auth.uid() = user_id);
create policy "activity_own_select" on public.activity_sessions for select to authenticated using (auth.uid() = user_id or public.is_research_staff(auth.uid()));
create policy "activity_own_update" on public.activity_sessions for update to authenticated using (auth.uid() = user_id);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert on public.audit_events to authenticated;
grant all on public.audit_events to service_role;
alter table public.audit_events enable row level security;
create policy "audit_select_staff" on public.audit_events for select to authenticated using (public.is_research_staff(auth.uid()));
create policy "audit_insert_staff" on public.audit_events for insert to authenticated with check (public.is_research_staff(auth.uid()));

-- ============ RESEARCH-ONLY RLS FOR CLINICAL TABLES ============
do $$
declare t text;
begin
  foreach t in array array[
    'participants','randomizations','demographics','clinical_data','participant_milestones',
    'assessments','dn4_assessments','medications','drug_interactions','drps',
    'counselling_sessions','physician_recommendations','follow_ups'
  ] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format($f$create policy "%1$s_staff_select" on public.%1$I for select to authenticated using (public.is_research_staff(auth.uid()))$f$, t);
    execute format($f$create policy "%1$s_staff_insert" on public.%1$I for insert to authenticated with check (public.is_research_staff(auth.uid()))$f$, t);
    execute format($f$create policy "%1$s_staff_update" on public.%1$I for update to authenticated using (public.is_research_staff(auth.uid())) with check (public.is_research_staff(auth.uid()))$f$, t);
    execute format($f$create policy "%1$s_staff_delete" on public.%1$I for delete to authenticated using (public.is_research_staff(auth.uid()))$f$, t);
  end loop;
end $$;

create index on public.participants (study_group);
create index on public.participant_milestones (participant_id);
create index on public.assessments (participant_id);
create index on public.medications (participant_id);
create index on public.drps (participant_id);
create index on public.follow_ups (participant_id);