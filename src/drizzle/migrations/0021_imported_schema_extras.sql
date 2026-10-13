alter table public.participants
  add column if not exists completion_notes text,
  add column if not exists last_contact_date date,
  add column if not exists non_completion_reason text;

alter table public.demographics
  add column if not exists address text, add column if not exists admission_date date,
  add column if not exists alt_contact_number text, add column if not exists bed_number text,
  add column if not exists caregiver_bp text, add column if not exists caregiver_contact text,
  add column if not exists caregiver_ecg_notes text, add column if not exists caregiver_height_cm numeric,
  add column if not exists caregiver_name text, add column if not exists caregiver_relationship text,
  add column if not exists caregiver_weight_kg numeric, add column if not exists city text,
  add column if not exists contact_number text, add column if not exists discharge_date date,
  add column if not exists district text, add column if not exists habits jsonb not null default '{}'::jsonb,
  add column if not exists ip_number text, add column if not exists op_number text,
  add column if not exists patient_type text, add column if not exists postal_code text,
  add column if not exists ward_unit text;

alter table public.clinical_data
  add column if not exists bp_diastolic integer, add column if not exists bp_systolic integer,
  add column if not exists diagnosis_date date, add column if not exists examination jsonb not null default '{}'::jsonb,
  add column if not exists family_history text, add column if not exists final_diagnosis text,
  add column if not exists history_present_illness text, add column if not exists pain_distribution text,
  add column if not exists pain_onset_date date, add column if not exists pain_site text,
  add column if not exists past_medical_history text, add column if not exists past_surgical_history text,
  add column if not exists presenting_complaints text, add column if not exists provisional_diagnosis text,
  add column if not exists pulse_rate integer, add column if not exists respiratory_rate integer,
  add column if not exists spo2 numeric, add column if not exists temperature_c numeric,
  add column if not exists treating_neurologist text;

alter table public.counselling_sessions add column if not exists recipient text;

alter table public.follow_ups
  add column if not exists adherence_notes text, add column if not exists admission_date date,
  add column if not exists admission_details text, add column if not exists admission_er text,
  add column if not exists missed_dose_details text, add column if not exists missed_dose_reason text,
  add column if not exists missed_doses text;

alter table public.medications
  add column if not exists brand_name text, add column if not exists category text,
  add column if not exists dose_unit text, add column if not exists dosing_schedule text,
  add column if not exists for_neuropathic_pain boolean, add column if not exists generic_name text,
  add column if not exists non_pharm_measures text;

create table public.adr_reports (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  medication_id uuid references public.medications(id) on delete set null,
  milestone public.study_milestone,
  kind text not null default 'adr',
  reaction_description text not null,
  suspected_medicine text, onset_period text, severity text, outcome text,
  reported_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger adr_reports_touch before update on public.adr_reports for each row execute function public.touch_updated_at();

create table public.drp_visit_outcomes (
  id uuid primary key default gen_random_uuid(),
  drp_id uuid not null references public.drps(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  milestone public.study_milestone not null,
  visit_status text not null,
  pcne_outcome_code text, notes text,
  recorded_by uuid,
  recorded_at timestamptz not null default now()
);

create table public.laboratory_investigations (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  category text not null,
  investigation_name text not null,
  investigation_date date, result text, unit text, reference_range text, notes text,
  recorded_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger laboratory_investigations_touch before update on public.laboratory_investigations for each row execute function public.touch_updated_at();

create table public.medication_changes (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  medication_id uuid references public.medications(id) on delete set null,
  milestone public.study_milestone not null,
  medication_name text not null,
  change_date date, change_description text, previous_dose text, new_dose text, reason text,
  recorded_by uuid,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['adr_reports','drp_visit_outcomes','laboratory_investigations','medication_changes'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format($f$create policy "%1$s_staff_select" on public.%1$I for select to authenticated using (public.is_research_staff(auth.uid()))$f$, t);
    execute format($f$create policy "%1$s_staff_insert" on public.%1$I for insert to authenticated with check (public.is_research_staff(auth.uid()))$f$, t);
    execute format($f$create policy "%1$s_staff_update" on public.%1$I for update to authenticated using (public.is_research_staff(auth.uid())) with check (public.is_research_staff(auth.uid()))$f$, t);
    execute format($f$create policy "%1$s_staff_delete" on public.%1$I for delete to authenticated using (public.is_research_staff(auth.uid()))$f$, t);
  end loop;
end $$;