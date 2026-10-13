import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { isVisitOpen, noOpenVisitReason } from "@/lib/lifecycle";
const VISIT_NAMES = { baseline: "Baseline", day_15: "Day 15", day_30: "Day 30" } as const;
import { getResearchData, saveNrs, saveResearchRecord } from "@/lib/research-data.functions";
import type { Participant } from "@/lib/participants.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState, ErrorState } from "@/components/common/States";
import {
  DrpSection,
  Dn4Form,
  NepiqolForm,
  QuestionnaireResult,
} from "@/components/research/QuestionnaireForms";
import { PENDING_PROTOCOL, PCNE_OUTCOMES, codesOf } from "@/lib/instruments";

const PCNE_OUTCOME_CODES = codesOf(PCNE_OUTCOMES);
import { MILESTONE_LABELS } from "@/lib/study";

export type Visit = "baseline" | "day_15" | "day_30";
type Table =
  | "demographics"
  | "clinical_data"
  | "medications"
  | "drug_interactions"
  | "drps"
  | "counselling_sessions"
  | "physician_recommendations"
  | "follow_ups"
  | "laboratory_investigations"
  | "adr_reports"
  | "medication_changes"
  | "drp_visit_outcomes";
type Cell = string | number | boolean | null | string[] | Record<string, unknown>;
type Row = Record<string, Cell>;
type Field = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "boolean" | "list" | "select";
  required?: boolean;
  options?: string[];
};
type Config = {
  title: string;
  table: Table;
  fields: Field[];
  multiple?: boolean;
  /** Visual sub-groups (presentation only); keys must reference existing fields. */
  groups?: { title: string; keys: string[] }[];
};

const PENDING_SPEC: Partial<Record<string, string>> = {
  demographics: "Waiting for approved form specification",
  clinical: "Waiting for approved form specification",
  medications: "Waiting for approved form specification",
  counselling: "Waiting for approved counselling specification",
};

const configs: {
  [
    K in
      | "demographics"
      | "clinical"
      | "medications"
      | "interactions"
      | "counselling"
      | "recommendations"
      | "followup"
      | "laboratory"
      | "adrs"
      | "med_changes"
      | "drp_outcomes"
  ]: Config;
} = {
  demographics: {
    title: "Demographics",
    table: "demographics",
    fields: [
      { key: "age_years", label: "Age (years)", type: "number" },
      { key: "sex", label: "Sex", type: "select", options: ["Male", "Female", "Other"] },
      { key: "height_cm", label: "Height (cm)", type: "number" },
      { key: "weight_kg", label: "Weight (kg)", type: "number" },
      { key: "ip_number", label: "Hospital IP number" },
      { key: "op_number", label: "Hospital OP number" },
      { key: "patient_type", label: "Patient type", type: "select", options: ["IPD", "OPD"] },
      { key: "ward_unit", label: "Ward / unit (IPD only)" },
      { key: "bed_number", label: "Bed number (IPD only)" },
      { key: "admission_date", label: "Date of admission", type: "date" },
      { key: "discharge_date", label: "Date of discharge", type: "date" },
      { key: "contact_number", label: "Contact number" },
      { key: "alt_contact_number", label: "Alternate contact number" },
      { key: "address", label: "Address", type: "textarea" },
      { key: "city", label: "City / town" },
      { key: "district", label: "District" },
      { key: "state", label: "State" },
      { key: "postal_code", label: "Postal code" },
      { key: "preferred_language", label: "Preferred language" },
      { key: "education_level", label: "Education level" },
      { key: "occupation", label: "Occupation" },
      { key: "residence", label: "Residence" },
      { key: "socioeconomic_status", label: "Socioeconomic status" },
      { key: "caregiver_name", label: "Caregiver name" },
      { key: "caregiver_relationship", label: "Caregiver relationship" },
      { key: "caregiver_contact", label: "Caregiver contact" },
      { key: "caregiver_height_cm", label: "Caregiver height (cm)", type: "number" },
      { key: "caregiver_weight_kg", label: "Caregiver weight (kg)", type: "number" },
      { key: "caregiver_bp", label: "Caregiver blood pressure" },
      { key: "caregiver_ecg_notes", label: "Caregiver ECG notes", type: "textarea" },
    ],
    groups: [
      { title: "Participant details", keys: ["age_years", "sex", "height_cm", "weight_kg"] },
      {
        title: "Hospital and admission details",
        keys: ["ip_number", "op_number", "patient_type", "ward_unit", "bed_number", "admission_date", "discharge_date"],
      },
      {
        title: "Contact and address",
        keys: ["contact_number", "alt_contact_number", "address", "city", "district", "state", "postal_code"],
      },
      {
        title: "Education, occupation and language",
        keys: ["preferred_language", "education_level", "occupation", "residence", "socioeconomic_status"],
      },
      {
        title: "Caregiver information",
        keys: ["caregiver_name", "caregiver_relationship", "caregiver_contact", "caregiver_height_cm", "caregiver_weight_kg", "caregiver_bp", "caregiver_ecg_notes"],
      },
    ],
  },
  clinical: {
    title: "Clinical data",
    table: "clinical_data",
    fields: [
      { key: "treating_neurologist", label: "Treating neurologist" },
      { key: "primary_diagnosis", label: "Primary diagnosis" },
      { key: "provisional_diagnosis", label: "Provisional diagnosis" },
      { key: "final_diagnosis", label: "Final diagnosis" },
      { key: "diagnosis_date", label: "Diagnosis date", type: "date" },
      { key: "pain_site", label: "Pain site" },
      { key: "pain_distribution", label: "Pain distribution" },
      { key: "pain_duration_months", label: "Pain duration (months)", type: "number" },
      { key: "pain_onset_date", label: "Pain onset date", type: "date" },
      { key: "presenting_complaints", label: "Presenting complaints", type: "textarea" },
      { key: "history_present_illness", label: "History of present illness", type: "textarea" },
      { key: "past_medical_history", label: "Past medical history", type: "textarea" },
      { key: "past_surgical_history", label: "Past surgical history", type: "textarea" },
      { key: "family_history", label: "Family history", type: "textarea" },
      { key: "comorbidities", label: "Comorbidities (one per line)", type: "list" },
      { key: "allergies", label: "Allergies (one per line)", type: "list" },
      { key: "bp_systolic", label: "BP systolic (mmHg)", type: "number" },
      { key: "bp_diastolic", label: "BP diastolic (mmHg)", type: "number" },
      { key: "pulse_rate", label: "Pulse rate (/min)", type: "number" },
      { key: "temperature_c", label: "Temperature (°C)", type: "number" },
      { key: "respiratory_rate", label: "Respiratory rate (/min)", type: "number" },
      { key: "spo2", label: "SpO₂ (%)", type: "number" },
      { key: "clinical_notes", label: "Clinical notes", type: "textarea" },
    ],
    groups: [
      {
        title: "Treating clinician and diagnosis",
        keys: ["treating_neurologist", "primary_diagnosis", "provisional_diagnosis", "final_diagnosis", "diagnosis_date"],
      },
      {
        title: "Pain history",
        keys: ["pain_site", "pain_distribution", "pain_duration_months", "pain_onset_date", "presenting_complaints", "history_present_illness"],
      },
      {
        title: "Medical history, comorbidities and allergies",
        keys: ["past_medical_history", "past_surgical_history", "family_history", "comorbidities", "allergies"],
      },
      {
        title: "Vital signs",
        keys: ["bp_systolic", "bp_diastolic", "pulse_rate", "temperature_c", "respiratory_rate", "spo2"],
      },
      { title: "Clinical notes", keys: ["clinical_notes"] },
    ],
  },
  medications: {
    title: "Medication review",
    table: "medications",
    multiple: true,
    fields: [
      { key: "drug_name", label: "Medication name", required: true },
      { key: "brand_name", label: "Brand name" },
      { key: "generic_name", label: "Generic name" },
      { key: "category", label: "Category", type: "select", options: ["prescribed", "otc", "self_medication", "herbal_traditional", "other"] },
      { key: "dose", label: "Dose" },
      { key: "dose_unit", label: "Dose unit" },
      { key: "frequency", label: "Frequency" },
      { key: "dosing_schedule", label: "Dosing schedule" },
      { key: "route", label: "Route" },
      { key: "indication", label: "Indication" },
      { key: "for_neuropathic_pain", label: "For neuropathic pain", type: "boolean" },
      { key: "start_date", label: "Start date", type: "date" },
      { key: "stop_date", label: "Stop date", type: "date" },
      { key: "is_current", label: "Current medication", type: "boolean" },
      { key: "non_pharm_measures", label: "Non-pharmacological pain measures", type: "textarea" },
    ],
    groups: [
      { title: "Medication", keys: ["drug_name", "brand_name", "generic_name", "category"] },
      { title: "Dosing", keys: ["dose", "dose_unit", "frequency", "dosing_schedule", "route"] },
      {
        title: "Use and status",
        keys: ["indication", "for_neuropathic_pain", "start_date", "stop_date", "is_current", "non_pharm_measures"],
      },
    ],
  },
  laboratory: {
    title: "Laboratory & investigations",
    table: "laboratory_investigations",
    multiple: true,
    fields: [
      { key: "category", label: "Category", type: "select", required: true, options: ["renal", "liver", "glucose", "ecg", "xray", "ct_usg", "mri", "culture_sensitivity", "biopsy", "other"] },
      { key: "investigation_name", label: "Investigation name", required: true },
      { key: "result", label: "Result" },
      { key: "unit", label: "Unit" },
      { key: "reference_range", label: "Reference range (as reported by the laboratory)" },
      { key: "investigation_date", label: "Investigation date", type: "date" },
      { key: "notes", label: "Findings / notes", type: "textarea" },
    ],
    groups: [
      {
        title: "Investigation",
        keys: ["category", "investigation_name", "result", "unit", "reference_range", "investigation_date", "notes"],
      },
    ],
  },
  adrs: {
    title: "Adverse drug reactions",
    table: "adr_reports",
    multiple: true,
    fields: [
      { key: "kind", label: "When reported" },
      { key: "suspected_medicine", label: "Suspected medication" },
      { key: "suspected_medicine_notes", label: "Suspected medicine notes", type: "textarea" },
      { key: "allergic_reaction", label: "Allergic drug reaction", type: "textarea" },
      { key: "reaction_description", label: "Reaction description", type: "textarea", required: true },
      { key: "symptomatic_relief", label: "Symptomatic relief / treatment", type: "textarea" },
      { key: "onset_period", label: "Date / period (if known)" },
      { key: "severity", label: "Severity / clinical details", type: "textarea" },
      { key: "outcome", label: "Outcome (if known)", type: "textarea" },
    ],
    groups: [
      {
        title: "Reaction details",
        keys: ["kind", "suspected_medicine", "suspected_medicine_notes", "allergic_reaction", "reaction_description", "symptomatic_relief", "onset_period", "severity", "outcome"],
      },
    ],
  },
  med_changes: {
    title: "Medication changes since previous visit",
    table: "medication_changes",
    multiple: true,
    fields: [
      { key: "medication_name", label: "Medication name", type: "textarea", required: true },
      { key: "previous_regimen", label: "Previous medication or regimen", type: "textarea" },
      { key: "new_regimen", label: "New medication or regimen", type: "textarea" },
      { key: "previous_dose", label: "Previous dose", type: "textarea" },
      { key: "new_dose", label: "New dose", type: "textarea" },
      { key: "frequency_change", label: "Frequency change", type: "textarea" },
      { key: "route_change", label: "Route change", type: "textarea" },
      { key: "modification_details", label: "Start, stop or modification details", type: "textarea" },
      { key: "change_description", label: "Change description", type: "textarea" },
      { key: "reason", label: "Reason for change", type: "textarea" },
      { key: "change_date", label: "Change date (if known)", type: "date" },
      { key: "change_period", label: "Approximate period (if date unknown)", type: "textarea" },
      { key: "researcher_notes", label: "Researcher notes", type: "textarea" },
      { key: "additional_details", label: "Additional details", type: "textarea" },
    ],
    groups: [
      { title: "Medication", keys: ["medication_name", "previous_regimen", "new_regimen"] },
      { title: "Change details", keys: ["previous_dose", "new_dose", "frequency_change", "route_change", "modification_details", "change_description", "reason", "change_date", "change_period"] },
      { title: "Notes", keys: ["researcher_notes", "additional_details"] },
    ],
  },
  drp_outcomes: {
    title: "DRP status at this visit",
    table: "drp_visit_outcomes",
    multiple: true,
    fields: [
      { key: "drp_id", label: "DRP", type: "select", required: true },
      { key: "visit_status", label: "Status at this visit", type: "select", required: true, options: ["new", "continuing", "resolved", "unresolved", "not_assessed"] },
      { key: "pcne_outcome_code", label: "PCNE outcome code", type: "select", options: PCNE_OUTCOME_CODES },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    groups: [
      { title: "Visit outcome", keys: ["drp_id", "visit_status", "pcne_outcome_code", "notes"] },
    ],
  },
  interactions: {
    title: "Drug–drug interactions",
    table: "drug_interactions",
    multiple: true,
    fields: [
      { key: "drug_a", label: "First medication", required: true },
      { key: "drug_b", label: "Second medication", required: true },
      { key: "severity", label: "Clinical relevance / severity (study documentation)", type: "textarea" },
      { key: "mechanism", label: "Interaction description", type: "textarea" },
      { key: "management", label: "Action / documentation", type: "textarea" },
      { key: "documentation_notes", label: "Notes", type: "textarea" },
    ],
    groups: [
      {
        title: "Interaction details",
        keys: ["drug_a", "drug_b", "severity", "mechanism", "management", "documentation_notes"],
      },
    ],
  },
  counselling: {
    title: "Counselling session",
    table: "counselling_sessions",
    multiple: true,
    fields: [
      { key: "session_date", label: "Session date", type: "date", required: true },
      { key: "duration_minutes", label: "Duration (minutes)", type: "number" },
      { key: "recipient", label: "Counselling given to", type: "select", options: ["patient", "caregiver", "both"] },
      { key: "topics", label: "Additional topics covered (one per line)", type: "list" },
      { key: "materials_provided", label: "Materials provided (one per line)", type: "list" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    groups: [
      { title: "Session details", keys: ["session_date", "duration_minutes", "recipient"] },
      { title: "Topics, materials and notes", keys: ["topics", "materials_provided", "notes"] },
    ],
  },
  recommendations: {
    title: "Physician communication",
    table: "physician_recommendations",
    multiple: true,
    fields: [
      { key: "drp_id", label: "Associated DRP", type: "select", required: true },
      { key: "recommendation", label: "Recommendation / action", type: "textarea", required: true },
      { key: "communicated_at", label: "Communication date", type: "date" },
      { key: "communication_mode", label: "Communication mode" },
      {
        key: "acceptance_status",
        label: "Physician acceptance",
        type: "select",
        options: ["pending", "accepted", "not_accepted"],
      },
      { key: "physician_response", label: "Physician response / notes", type: "textarea" },
      { key: "responded_at", label: "Response date", type: "date" },
    ],
    groups: [
      {
        title: "Communication",
        keys: ["drp_id", "recommendation", "communicated_at", "communication_mode"],
      },
      {
        title: "Physician response",
        keys: ["acceptance_status", "physician_response", "responded_at"],
      },
    ],
  },
  followup: {
    title: "Follow-up information",
    table: "follow_ups",
    fields: [
      { key: "scheduled_for", label: "Scheduled date", type: "date" },
      { key: "contacted_at", label: "Actual follow-up date", type: "date" },
      { key: "contact_mode", label: "Contact mode", type: "select", options: ["phone", "in_person"] },
      { key: "outcome", label: "Follow-up information", type: "textarea" },
      { key: "missed_doses", label: "Missed doses in the last 7 days", type: "select", options: ["yes", "no", "unknown"] },
      { key: "missed_dose_details", label: "Number / description of missed doses" },
      { key: "missed_dose_reason", label: "Reason for missed doses" },
      { key: "adherence_notes", label: "Adherence notes", type: "textarea" },
      { key: "admission_er", label: "Hospital admission or ER visit since previous assessment", type: "select", options: ["yes", "no", "unknown"] },
      { key: "admission_date", label: "Admission date / period", type: "date" },
      { key: "admission_details", label: "Admission reason / outcome details", type: "textarea" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    groups: [
      { title: "Follow-up visit", keys: ["scheduled_for", "contacted_at", "contact_mode", "outcome"] },
      {
        title: "Adherence",
        keys: ["missed_doses", "missed_dose_details", "missed_dose_reason", "adherence_notes"],
      },
      {
        title: "Hospital admission or emergency visit",
        keys: ["admission_er", "admission_date", "admission_details"],
      },
      { title: "Notes", keys: ["notes"] },
    ],
  },
};

/** The five approved counselling checklist topics, each with independent Covered and Teach-back controls. */
export const COUNSELLING_TOPICS = [
  { key: "medication_use", label: "Appropriate medication use" },
  { key: "dosing_adherence", label: "Dosing schedule and adherence" },
  { key: "therapeutic_effect", label: "Expected therapeutic effect and onset" },
  { key: "reporting_adverse_effects", label: "Reporting adverse effects" },
  { key: "reporting_worsening_pain", label: "Reporting persistent or worsening pain" },
] as const;

export const LIFESTYLE_HABITS = [
  { key: "nicotine", label: "Nicotine use" },
  { key: "caffeine", label: "Caffeine consumption" },
  { key: "alcohol", label: "Alcohol use" },
  { key: "tobacco", label: "Tobacco use" },
  { key: "gutkha", label: "Gutkha use" },
] as const;

export const EXAM_SYSTEMS = [
  { key: "general", label: "General examination" },
  { key: "cns", label: "Central nervous system (CNS)" },
  { key: "pa", label: "Per abdomen (PA)" },
  { key: "cvs", label: "Cardiovascular system (CVS)" },
  { key: "rs", label: "Respiratory system (RS)" },
  { key: "gu", label: "Genitourinary system (GU)" },
  { key: "heent", label: "HEENT" },
  { key: "extremities", label: "Extremities" },
  { key: "other", label: "Other findings" },
] as const;

export function useStudyData(id: string) {
  const fetch = useServerFn(getResearchData);
  return useQuery({
    queryKey: ["study-data", id],
    queryFn: () => fetch({ data: { participantId: id } }),
    retry: false,
  });
}

function useStudySave(id: string) {
  const client = useQueryClient();
  const save = useServerFn(saveResearchRecord);
  return useMutation({
    mutationFn: (input: { table: Table; recordId?: string; values: unknown }) =>
      save({ data: { participantId: id, ...input } }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["study-data", id] });
      toast.success("Record saved.");
    },
    onError: (error) => {
      console.error("Study record save failed", error);
      toast.error(error instanceof Error ? error.message : "Save failed.");
    },
  });
}

function initial(config: Config, visit?: Visit): Row {
  const values: Row = {};
  for (const f of config.fields)
    values[f.key] =
      f.type === "boolean" ? true : f.type === "list" ? [] : f.type === "number" ? null : "";
  if (config.table === "counselling_sessions") {
    values["milestone"] = visit ?? null;
    values["checklist"] = {};
  }
  if (config.table === "demographics") values["habits"] = {};
  if (config.table === "clinical_data") values["examination"] = {};
  if (config.table === "drug_interactions") values["milestone"] = visit ?? null;
  if (config.table === "medication_changes" || config.table === "drp_visit_outcomes")
    values["milestone"] = visit ?? "day_15";
  if (config.table === "adr_reports") values["milestone"] = visit ?? null;
  if (config.table === "follow_ups") {
    values["milestone"] = visit ?? "day_15";
    values["status"] = "in_progress";
  }
  if (config.table === "physician_recommendations") values["acceptance_status"] = "pending";
  return values;
}
function asForm(row: Row, config: Config): Row {
  return Object.fromEntries(
    config.fields
      .map((f) => [f.key, row[f.key] ?? (f.type === "number" ? null : f.type === "list" ? [] : "")])
      .concat(Object.entries(row).filter(([key]) => !config.fields.some((f) => f.key === key))),
  ) as Row;
}
function labelFor(row: Row, config: Config) {
  return String(row[config.fields[0]?.key ?? "id"] ?? row["id"] ?? "Record");
}
export function ResearchRecordForm({
  participant,
  section,
  visit,
  openOnly = false,
}: {
  participant: Participant;
  section: keyof typeof configs | "drps";
  visit?: Visit | undefined;
  /** Medication review / DRP tab: `visit` is the currently open visit (or none); records are not filtered by it. */
  openOnly?: boolean;
}) {
  if (section === "drps")
    return <DrpRecords participant={participant} visit={visit ?? null} showAll={openOnly} />;
  return <GenericRecordForm participant={participant} section={section} visit={visit} openOnly={openOnly} />;
}

function DrpRecords({ participant, visit, showAll }: { participant: Participant; visit: Visit | null; showAll: boolean }) {
  const { data, isPending, error, refetch } = useStudyData(participant.id);
  if (!participant.enrolmentConfirmed)
    return <p className="text-sm text-muted-foreground">Complete enrolment first.</p>;
  if (isPending) return <LoadingState label="Loading drug-related problems" />;
  if (error) return <ErrorState description={error.message} onRetry={() => void refetch()} />;
  return (
    <DrpSection
      participantId={participant.id}
      visit={visit}
      rows={(data?.records["drps"] ?? []) as Row[]}
      intervention={participant.studyGroup === "intervention"}
      showAll={showAll}
    />
  );
}

type HabitValue = { status?: string | null; details?: string | null };
type ChecklistValue = { covered?: boolean; teach_back?: boolean };

/** Normalizes a checklist entry: legacy booleans mean covered with no teach-back. */
export function normalizeChecklistEntry(raw: ChecklistValue | boolean | undefined): ChecklistValue {
  return typeof raw === "boolean" ? { covered: raw, teach_back: false } : (raw ?? {});
}

function bmi(heightCm: unknown, weightKg: unknown): string | null {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) return null;
  const m = h / 100;
  return (w / (m * m)).toFixed(1);
}

function HabitsEditor({
  value,
  onChange,
}: {
  value: Record<string, HabitValue>;
  onChange: (v: Record<string, HabitValue>) => void;
}) {
  return (
    <fieldset className="space-y-3 sm:col-span-2">
      <legend className="text-sm font-medium">Lifestyle and habits</legend>
      <p className="text-xs text-muted-foreground">
        Choose Yes or No for each habit; when Yes, record the frequency or pattern. Leave
        unselected when not recorded — a blank answer is never treated as No.
      </p>
      {LIFESTYLE_HABITS.map((habit) => {
        const entry = value[habit.key] ?? {};
        return (
          <div key={habit.key} className="inset-tile space-y-2 rounded-lg p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-medium">{habit.label}</span>
              <div role="radiogroup" aria-label={habit.label} className="flex gap-2">
                {(["yes", "no", "unknown"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={entry.status === opt}
                    onClick={() =>
                      onChange({
                        ...value,
                        [habit.key]: { ...entry, status: entry.status === opt ? null : opt },
                      })
                    }
                    className={`rounded-lg border px-3 py-1 text-xs font-semibold uppercase transition-colors ${entry.status === opt ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            {entry.status === "yes" ? (
              <Input
                aria-label={`${habit.label} frequency or details`}
                placeholder="Frequency / quantity / pattern"
                value={entry.details ?? ""}
                onChange={(e) =>
                  onChange({ ...value, [habit.key]: { ...entry, details: e.target.value } })
                }
              />
            ) : null}
          </div>
        );
      })}
    </fieldset>
  );
}

function ExaminationEditor({
  value,
  onChange,
}: {
  value: Record<string, string | null>;
  onChange: (v: Record<string, string | null>) => void;
}) {
  return (
    <fieldset className="space-y-3 sm:col-span-2">
      <legend className="text-sm font-medium">Physical and systemic examination</legend>
      <p className="text-xs text-muted-foreground">
        Record documented findings only — fields left blank mean not examined, not normal.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {EXAM_SYSTEMS.map((sys) => (
          <div key={sys.key} className="space-y-1">
            <Label htmlFor={`exam-${sys.key}`}>{sys.label}</Label>
            <Textarea
              id={`exam-${sys.key}`}
              rows={2}
              value={value[sys.key] ?? ""}
              onChange={(e) => onChange({ ...value, [sys.key]: e.target.value || null })}
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}

function CounsellingChecklist({
  value,
  onChange,
}: {
  value: Record<string, ChecklistValue | boolean>;
  onChange: (v: Record<string, ChecklistValue>) => void;
}) {
  return (
    <fieldset className="space-y-3 sm:col-span-2">
      <legend className="text-sm font-medium">Counselling checklist</legend>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Topic</th>
              <th className="w-28 py-2 pr-3 text-center font-medium">Covered</th>
              <th className="w-36 py-2 text-center font-medium">Teach-back completed</th>
            </tr>
          </thead>
          <tbody>
            {COUNSELLING_TOPICS.map((topic) => {
              const raw = value[topic.key];
              const entry: ChecklistValue = normalizeChecklistEntry(raw);
              const set = (patch: Partial<ChecklistValue>) =>
                onChange({
                  ...Object.fromEntries(
                    Object.entries(value).map(([k, v]) => [k, normalizeChecklistEntry(v)]),
                  ),
                  [topic.key]: { covered: false, teach_back: false, ...entry, ...patch },
                });
              return (
                <tr key={topic.key} className="border-t border-border">
                  <td className="py-2.5 pr-3 align-middle">{topic.label}</td>
                  <td className="py-2.5 pr-3 text-center align-middle">
                    <input
                      type="checkbox"
                      aria-label={`${topic.label} — covered`}
                      className="size-4 align-middle accent-primary"
                      checked={Boolean(entry.covered)}
                      onChange={(e) => set({ covered: e.target.checked })}
                    />
                  </td>
                  <td className="py-2.5 text-center align-middle">
                    <input
                      type="checkbox"
                      aria-label={`${topic.label} — teach-back completed`}
                      className="size-4 align-middle accent-primary"
                      checked={Boolean(entry.teach_back)}
                      onChange={(e) => set({ teach_back: e.target.checked })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </fieldset>
  );
}

function GenericRecordForm({
  participant,
  section,
  visit,
  openOnly = false,
}: {
  participant: Participant;
  section: keyof typeof configs;
  visit?: Visit | undefined;
  openOnly?: boolean;
}) {
  const config = configs[section];
  const { data, isPending, error, refetch } = useStudyData(participant.id);
  const save = useStudySave(participant.id);
  const rows = (data?.records[config.table] ?? []) as Row[];
  const visible =
    visit && (["counselling", "followup", "med_changes", "drp_outcomes"].includes(section) || (section === "interactions" && !openOnly))
      ? rows.filter((r) => r["milestone"] === visit)
      : rows;
  const [editing, setEditing] = useState<string | null>(null);
  const [values, setValues] = useState<Row>(() => initial(config, visit));
  const single = !config.multiple;
  const current = single ? visible[0] : visible.find((r) => r["id"] === editing);
  useEffect(() => {
    if (single && current && !editing) setValues(asForm(current, config));
  }, [data, section, editing]);
  if (!participant.enrolmentConfirmed)
    return <p className="text-sm text-muted-foreground">Complete enrolment first.</p>;
  if (isPending) return <LoadingState label={`Loading ${config.title}`} />;
  if (error) return <ErrorState description={error.message} onRetry={() => void refetch()} />;
  if (
    (section === "counselling" || section === "recommendations") &&
    participant.studyGroup !== "intervention"
  )
    return (
      <p className="text-sm text-muted-foreground">
        Only intervention participants have this record.
      </p>
    );
  const drps = (data?.records["drps"] ?? []) as Row[];
  const isInteractions = config.table === "drug_interactions";
  // Interactions: never locked. A new record joins the open visit if one is open, otherwise it is saved
  // "outside scheduled visit" (null). An edit keeps the record's own context.
  const editingRow = editing ? rows.find((r) => r["id"] === editing) : undefined;
  const interactionVisit: Visit | null = isInteractions
    ? editing
      ? ((editingRow?.["milestone"] as Visit | null | undefined) ?? null)
      : visit && isVisitOpen(participant, visit)
        ? visit
        : null
    : null;
  const interactionLock: string | null = null;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (interactionLock) {
      toast.error(interactionLock);
      return;
    }
    const payload: Record<string, unknown> = {};
    for (const f of config.fields) {
      const v = values[f.key];
      payload[f.key] =
        f.type === "number"
          ? v === "" || v === null
            ? null
            : Number(v)
          : f.type === "list"
            ? Array.isArray(v)
              ? v
              : String(v ?? "")
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean)
            : f.type === "boolean"
              ? Boolean(v)
              : typeof v === "string"
                ? v.trim() || null
                : v;
      if (f.required && (payload[f.key] === null || payload[f.key] === "")) {
        toast.error(`${f.label} is required.`);
        return;
      }
    }
    if (config.table === "counselling_sessions") {
      payload["milestone"] = visit ?? null;
      payload["checklist"] = values["checklist"] ?? {};
    }
    if (config.table === "demographics") payload["habits"] = values["habits"] ?? {};
    if (config.table === "clinical_data") payload["examination"] = values["examination"] ?? {};
    if (config.table === "medication_changes" || config.table === "drp_visit_outcomes")
      payload["milestone"] = visit ?? "day_15";
    if (config.table === "adr_reports") payload["milestone"] = visit ?? null;
    // Editing keeps the record's own visit; new records go to the visit that is open now.
    if (isInteractions) payload["milestone"] = interactionVisit;
    if (config.table === "follow_ups") {
      payload["milestone"] = visit ?? "day_15";
      payload["status"] = "in_progress";
    }
    if (config.table === "physician_recommendations") payload["acceptance_status"] ||= "pending";
    save.mutate(
      {
        table: config.table,
        ...(single
          ? current?.["id"]
            ? { recordId: String(current["id"]) }
            : {}
          : editing
            ? { recordId: editing }
            : {}),
        values: payload,
      },
      {
        onSuccess: () => {
          if (config.multiple) {
            setEditing(null);
            setValues(initial(config, visit));
          }
        },
      },
    );
  };
  const startingNew = config.multiple && editing === null;
  const pending = PENDING_SPEC[section];
  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold">{config.title}</h3>
        {config.multiple && (
          <Button
            variant="outline"
            onClick={() => {
              setEditing(null);
              setValues(initial(config, visit));
            }}
          >
            New record
          </Button>
        )}
      </div>
      {pending && (
        <p
          role="note"
          className="rounded-lg border border-hairline bg-mist px-3 py-2 text-xs text-foreground"
        >
          <strong>{pending}.</strong> These are provisional working fields, not the approved study
          form. This is an intentional protocol dependency, not an application fault.
          {section === "interactions" &&
            " Interactions are documented by the researcher; no approved interaction-checking source is configured, so nothing here is clinically authoritative."}
        </p>
      )}
      {isInteractions && (
        <p role="note" className="rounded-lg border border-hairline bg-mist px-3 py-2 text-xs text-foreground">
          {editing ? (
            interactionVisit ? (
              <>This interaction belongs to the <strong>{VISIT_NAMES[interactionVisit]}</strong> visit and stays there when edited.</>
            ) : (
              <>This interaction was documented <strong>outside a scheduled visit</strong> and stays that way when edited.</>
            )
          ) : interactionVisit ? (
            <>New interactions are recorded against the open <strong>{VISIT_NAMES[interactionVisit]}</strong> visit.</>
          ) : (
            <>No visit is open, so new interactions are saved as <strong>Outside scheduled visit — not assigned to Baseline, Day 15 or Day 30</strong>. Participant and visit status are not changed.</>
          )}{" "}
          These fields are for researcher documentation; formal protocol alignment remains subject to confirmation by the study team, and entries are not validated by an external interaction database.
        </p>
      )}
      {config.multiple && (
        <div className="space-y-2">
          {visible.length ? (
            visible.map((row) => (
              <div
                key={String(row["id"])}
                className="inset-tile flex items-center justify-between gap-4 rounded-lg p-3 text-sm"
              >
                <span>
                  {isInteractions ? `${row["milestone"] ? VISIT_NAMES[row["milestone"] as Visit] : "Outside scheduled visit"} · ` : ""}
                  {labelFor(row, config)} ·{" "}
                  {String(
                    row["status"] ??
                      row["acceptance_status"] ??
                      row["identified_at"] ??
                      row["created_at"] ??
                      "",
                  )}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(String(row["id"]));
                    setValues(asForm(row, config));
                  }}
                >
                  Edit
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{isInteractions ? "No interaction records recorded for this participant yet." : "No records yet."}</p>
          )}
        </div>
      )}
      {(single || (startingNew && !(isInteractions && interactionLock)) || Boolean(editing)) && (
        <form onSubmit={submit} className="space-y-6">
          {(() => {
            const renderField = (f: Field) =>
            f.type === "boolean" ? (
              <div key={f.key} className="flex items-end">
                <label
                  htmlFor={`${section}-${visit ?? "all"}-${f.key}`}
                  className="inset-tile flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm"
                >
                  <input
                    id={`${section}-${visit ?? "all"}-${f.key}`}
                    type="checkbox"
                    checked={Boolean(values[f.key])}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.checked })}
                    className="size-4 shrink-0 accent-primary"
                  />
                  {f.label}
                  {f.required ? <span className="text-destructive"> *</span> : null}
                </label>
              </div>
            ) : (
              <div
                key={f.key}
                className={
                  f.type === "textarea" || f.type === "list"
                    ? "space-y-2 sm:col-span-2"
                    : "space-y-2"
                }
              >
                <Label htmlFor={`${section}-${visit ?? "all"}-${f.key}`}>
                  {f.label}
                  {f.required ? <span className="text-destructive"> *</span> : null}
                </Label>
                {f.type === "textarea" || f.type === "list" ? (
                  <Textarea
                    id={`${section}-${visit ?? "all"}-${f.key}`}
                    value={
                      Array.isArray(values[f.key])
                        ? (values[f.key] as string[]).join("\n")
                        : String(values[f.key] ?? "")
                    }
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    required={f.required}
                  />
                ) : f.type === "select" ? (
                  <Select
                    value={String(values[f.key] ?? "")}
                    onValueChange={(v) => setValues({ ...values, [f.key]: v })}
                  >
                    <SelectTrigger id={`${section}-${visit ?? "all"}-${f.key}`}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {(f.key === "drp_id"
                        ? drps.map((r) => String(r["id"]))
                        : (f.options ?? [])
                      ).map((option) => (
                        <SelectItem key={option} value={option}>
                          {f.key === "drp_id"
                            ? `${option.slice(0, 8)} · ${String(drps.find((r) => r["id"] === option)?.["description"] ?? "")}`
                            : option.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={`${section}-${visit ?? "all"}-${f.key}`}
                    type={f.type ?? "text"}
                    min={f.type === "number" ? 0 : undefined}
                    value={String(values[f.key] ?? "")}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    required={f.required}
                  />
                )}
              </div>
            );
            const groupList = config.groups ?? [];
            const groupedKeys = new Set(groupList.flatMap((g) => g.keys));
            const ungrouped = config.fields.filter((f) => !groupedKeys.has(f.key));
            return (
              <>
                {groupList.map((g) => (
                  <fieldset key={g.title} className="space-y-4">
                    <legend className="w-full border-b border-border pb-2 text-sm font-semibold">
                      {g.title}
                    </legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {config.fields.filter((f) => g.keys.includes(f.key)).map(renderField)}
                    </div>
                  </fieldset>
                ))}
                {ungrouped.length ? (
                  <div className="grid gap-4 sm:grid-cols-2">{ungrouped.map(renderField)}</div>
                ) : null}
              </>
            );
          })()}
          {section === "demographics" ? (
            <>
              <p className="text-sm text-muted-foreground sm:col-span-2">
                Patient BMI (calculated):{" "}
                <strong>{bmi(values["height_cm"], values["weight_kg"]) ?? "—"}</strong>
                {" · "}Caregiver BMI (calculated):{" "}
                <strong>
                  {bmi(values["caregiver_height_cm"], values["caregiver_weight_kg"]) ?? "—"}
                </strong>
              </p>
              <HabitsEditor
                value={(values["habits"] as Record<string, HabitValue>) ?? {}}
                onChange={(v) => setValues({ ...values, habits: v })}
              />
            </>
          ) : null}
          {section === "clinical" ? (
            <ExaminationEditor
              value={(values["examination"] as Record<string, string | null>) ?? {}}
              onChange={(v) => setValues({ ...values, examination: v })}
            />
          ) : null}
          {section === "counselling" ? (
            <CounsellingChecklist
              value={(values["checklist"] as Record<string, ChecklistValue | boolean>) ?? {}}
              onChange={(v) => setValues({ ...values, checklist: v })}
            />
          ) : null}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : current || editing ? "Save changes" : "Save record"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

export function InstrumentPanel({
  participant,
  visit,
  instrument,
}: {
  participant: Participant;
  visit: Visit;
  instrument: "NRS" | "DN4" | "NEPIQoL";
}) {
  const { data, isPending } = useStudyData(participant.id);
  const client = useQueryClient();
  const save = useServerFn(saveNrs);
  const [score, setScore] = useState(0);
  const record = data?.assessments.find(
    (a) => a["milestone"] === visit && a.instrument === instrument,
  );
  const active =
    visit === "baseline"
      ? participant.enrolmentConfirmed && !participant.baselineCompletedAt
      : visit === "day_15"
        ? Boolean(participant.day15OpenedAt && !participant.day15CompletedAt)
        : Boolean(participant.day15CompletedAt && !participant.day30CompletedAt);
  const mutation = useMutation({
    mutationFn: (value: number) =>
      save({ data: { participantId: participant.id, milestone: visit, score: value } }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["study-data", participant.id] });
      toast.success("NRS saved.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save NRS."),
  });
  if (isPending) return <LoadingState label="Loading assessment" />;
  return (
    <section className="space-y-4">
      <h3 className="font-display text-lg font-bold">
        {instrument === "NEPIQoL" ? "NePIQoL" : instrument} · {MILESTONE_LABELS[visit]}
      </h3>
      {instrument !== "NRS" ? (
        record?.status === "completed" ? (
          <QuestionnaireResult
            instrument={instrument}
            responses={record.responses}
            conductedAt={record.conducted_at}
          />
        ) : !active ? (
          <p className="text-sm text-muted-foreground">This visit is not open for assessment.</p>
        ) : instrument === "DN4" ? (
          <Dn4Form participantId={participant.id} visit={visit} />
        ) : (
          <NepiqolForm participantId={participant.id} visit={visit} />
        )
      ) : record ? (
        <div className="inset-tile rounded-lg p-4">
          <p className="font-semibold">
            Recorded score: {String((record.responses as { score?: number })?.score ?? "—")} / 10
          </p>
          <p className="text-sm text-muted-foreground">
            Recorded {record.conducted_at ? new Date(record.conducted_at).toLocaleString() : "—"}.
            Completed assessments are locked.
          </p>
        </div>
      ) : active ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(score);
          }}
          className="space-y-4"
        >
          <Label htmlFor={`nrs-${visit}`}>Pain intensity (0–10)</Label>
          <div className="flex items-center gap-4">
            <Input
              id={`nrs-${visit}`}
              type="number"
              min="0"
              max="10"
              step="1"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="max-w-28"
              required
            />
            <span className="font-semibold">/ 10</span>
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            Save NRS
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">This visit is not open for assessment.</p>
      )}
    </section>
  );
}

export function OutcomesPanel({ participant }: { participant: Participant }) {
  const { data, isPending } = useStudyData(participant.id);
  if (isPending) return <LoadingState label="Loading outcomes" />;
  const result = (instrument: "NRS" | "NEPIQoL" | "DN4", visit: Visit) => {
    const a = data?.assessments.find(
      (x) => x.instrument === instrument && x["milestone"] === visit && x.status === "completed",
    );
    const r = (a?.responses ?? {}) as { score?: number; total?: number };
    const value = instrument === "NRS" ? r.score : r.total;
    return typeof value === "number" ? value : null;
  };
  const change = (instrument: "NRS" | "NEPIQoL", visit: Visit) => {
    const b = result(instrument, "baseline");
    const f = result(instrument, visit);
    return b === null || f === null
      ? "Not available yet"
      : `${b} → ${f} (change ${f - b > 0 ? "+" : ""}${f - b})`;
  };
  const drps = (data?.records["drps"] ?? []) as Row[];
  return (
    <section className="space-y-4">
      <h3 className="font-display text-lg font-bold">Study outcomes</h3>
      {(["day_15", "day_30"] as Visit[]).map((visit) => (
        <div className="inset-tile space-y-1 rounded-lg p-4 text-sm" key={visit}>
          <p className="font-semibold">Baseline → {MILESTONE_LABELS[visit]}</p>
          <p>NRS: {change("NRS", visit)}</p>
          <p>NePIQoL total: {change("NEPIQoL", visit)}</p>
          <p>
            DN4 total: baseline {result("DN4", "baseline") ?? "—"} · {MILESTONE_LABELS[visit]}{" "}
            {result("DN4", visit) ?? "—"}{" "}
            <span className="text-muted-foreground">(recorded values; no change formula defined)</span>
          </p>
        </div>
      ))}
      <div className="inset-tile space-y-1 rounded-lg p-4 text-sm">
        <p>DRPs documented: {drps.length}</p>
        <p>DRP resolution rate: {PENDING_PROTOCOL}</p>
        {participant.studyGroup === "intervention" && (
          <p>Physician acceptance rate: {PENDING_PROTOCOL}</p>
        )}
        <p className="text-muted-foreground">
          The underlying PCNE outcome (O) and acceptance (A) codes are stored for each DRP. Rates
          are not calculated until the protocol defines the formula.
        </p>
      </div>
    </section>
  );
}
