import type { Block } from "@/lib/pdf-report";
import {
  DN4_ITEM_COUNT,
  DN4_QUESTIONS,
  DN4_VERSION,
  INSTRUMENT_CONTENT_STATUS,
  NEPIQOL_ITEM_COUNT,
  NEPIQOL_ITEMS,
  NEPIQOL_MAPPING_STATUS,
  NEPIQOL_SECTIONS,
  NEPIQOL_SUBSCALES,
  NEPIQOL_TOTAL_RANGE,
  PCNE_ACCEPTANCE,
  PCNE_CAUSES,
  PCNE_INTERVENTIONS,
  PCNE_OUTCOMES,
  PCNE_PROBLEMS,
  PCNE_VERSION,
  PENDING_PROTOCOL,
  labelOf,
} from "@/lib/instruments";
import { COUNSELLING_TOPICS, EXAM_SYSTEMS, LIFESTYLE_HABITS } from "@/components/research/StudyForms";

/**
 * Pure mapping from one participant's persisted dataset to report blocks.
 * Kept separate from the server function so the completeness tests can feed
 * synthetic fixtures through exactly the same mapping the download uses.
 */
type Known = 'acceptance_status' | 'adherence_notes' | 'admission_date' | 'admission_details' | 'admission_er' | 'age_years' | 'allergies' | 'assigned_at' | 'baseline_completed_at' | 'bed_number' | 'bp_diastolic' | 'bp_systolic' | 'brand_name' | 'caregiver_bp' | 'caregiver_ecg_notes' | 'caregiver_height_cm' | 'caregiver_name' | 'caregiver_relationship' | 'caregiver_weight_kg' | 'category' | 'change_date' | 'change_description' | 'checklist' | 'city' | 'clinical_notes' | 'communicated_at' | 'communication_mode' | 'comorbidities' | 'completed_at' | 'completion_notes' | 'conducted_at' | 'consent_confirmed' | 'consent_date' | 'consent_notes' | 'consent_status' | 'contact_mode' | 'contacted_at' | 'created_at' | 'day_15_completed_at' | 'day_15_opened_at' | 'day_30_completed_at' | 'description' | 'diagnosis_date' | 'discharge_date' | 'district' | 'documentation_notes' | 'dose' | 'dose_unit' | 'dosing_schedule' | 'drp_id' | 'drug_a' | 'drug_b' | 'drug_name' | 'due_date' | 'duration_minutes' | 'education_level' | 'eligibility_status' | 'enrolled_at' | 'enrolment_confirmed' | 'enrolment_notes' | 'examination' | 'exclusion_criteria_present' | 'family_history' | 'final_diagnosis' | 'for_neuropathic_pain' | 'frequency' | 'generic_name' | 'habits' | 'height_cm' | 'history_present_illness' | 'id' | 'identified_at' | 'inclusion_criteria_met' | 'indication' | 'instrument' | 'investigation_date' | 'investigation_name' | 'ip_number' | 'is_current' | 'is_test_record' | 'items' | 'kind' | 'last_contact_date' | 'lifecycle_stage' | 'lifestyle_notes' | 'management' | 'materials_provided' | 'mechanism' | 'medication_id' | 'medication_name' | 'method' | 'milestone' | 'missed_dose_details' | 'missed_dose_reason' | 'missed_doses' | 'new_dose' | 'new_group' | 'non_completion_reason' | 'non_pharm_measures' | 'notes' | 'occupation' | 'onset_period' | 'op_number' | 'outcome' | 'overridden_at' | 'pain_distribution' | 'pain_duration_months' | 'pain_onset_date' | 'pain_site' | 'participant_code' | 'past_medical_history' | 'past_surgical_history' | 'patient_type' | 'pcne_acceptance_code' | 'pcne_cause_codes' | 'pcne_intervention_codes' | 'pcne_outcome_code' | 'pcne_problem_code' | 'pcne_version' | 'physician_response' | 'preferred_language' | 'presenting_complaints' | 'previous_dose' | 'previous_group' | 'primary_diagnosis' | 'problem_type' | 'provisional_diagnosis' | 'pulse_rate' | 'randomized_at' | 'reaction_description' | 'reason' | 'recipient' | 'recommendation' | 'recorded_at' | 'reference_range' | 'residence' | 'resolution_notes' | 'resolved_at' | 'respiratory_rate' | 'responded_at' | 'responses' | 'result' | 'route' | 'scheduled_for' | 'screening_date' | 'screening_notes' | 'session_date' | 'severity' | 'sex' | 'site' | 'socioeconomic_status' | 'source' | 'spo2' | 'start_date' | 'started_at' | 'state' | 'status' | 'stop_date' | 'study_group' | 'subscales' | 'suspected_medicine' | 'temperature_c' | 'topics' | 'total' | 'treating_neurologist' | 'unit' | 'updated_at' | 'version' | 'visit_status' | 'ward_unit' | 'weight_kg';
export type Row = Record<string, unknown> & Partial<Record<Known, unknown>>;
export type ReportDataset = {
  participant: Row;
  randomizations: Row[];
  milestones: Row[];
  assessments: Row[];
  demographics: Row[];
  clinical: Row[];
  medications: Row[];
  interactions: Row[];
  drps: Row[];
  counselling: Row[];
  followUps: Row[];
  overrides: Row[];
  laboratory: Row[];
  adrs: Row[];
  medicationChanges: Row[];
  drpOutcomes: Row[];
  recommendations: Row[];
};

export const NR = "Not recorded";
const EMPTY = "No records have been recorded for this section.";
export const STUDY_TITLE = "NeuroCare Connect — neuropathic pain medicines-use and clinical pharmacy study";

const blank = (v: unknown) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");
export const human = (v: unknown): string => {
  if (blank(v)) return NR;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length ? v.map((x) => human(x)).join(", ") : NR;
  if (typeof v === "object") {
    const parts = Object.entries(v as Row).filter(([, x]) => !blank(x)).map(([k, x]) => `${k.replace(/_/g, " ")}: ${human(x)}`);
    return parts.length ? parts.join("; ") : NR;
  }
  return String(v);
};
const cap = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
export const label = (v: unknown) => (typeof v === "string" && v.trim() ? cap(v) : human(v));
export const fmt = (v: unknown, time = false) => {
  if (typeof v !== "string" || !v) return NR;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
  return time && v.length > 10 ? `${date} ${d.toISOString().slice(11, 16)} UTC` : date;
};
const withUnit = (v: unknown, unit: string) => (blank(v) ? NR : `${v} ${unit}`);
const VISITS = ["baseline", "day_15", "day_30"] as const;
const VISIT_LABEL: Record<string, string> = { baseline: "Baseline", day_15: "Day 15", day_30: "Day 30" };
const byVisit = (a: Row, b: Row) => VISITS.indexOf(a.milestone as never) - VISITS.indexOf(b.milestone as never);
const resp = (a: Row) => (a.responses ?? {}) as Row;
const yn = (v: unknown) => (v === true ? "Yes" : v === false ? "No" : NR);

export function buildReportBlocks(ds: ReportDataset, generatedAt: string): { cover: Block[]; blocks: Block[]; studyCode: string; synthetic: boolean } {
  const p = ds.participant;
  const code = String(p.participant_code);
  const drpNo = new Map(ds.drps.map((d, i) => [d.id as string, `DRP-${i + 1}`]));
  const medNo = new Map(ds.medications.map((m, i) => [m.id as string, `M${i + 1}`]));
  const inst = (n: string) => ds.assessments.filter((a) => String(a.instrument).toUpperCase() === n).sort(byVisit);
  const nrs = inst("NRS"), dn4 = inst("DN4"), nep = inst("NEPIQOL");
  const otherAssessments = ds.assessments.filter((a) => !["NRS", "DN4", "NEPIQOL"].includes(String(a.instrument).toUpperCase()));
  const randRow = ds.randomizations[0];
  const group = (p.study_group ?? randRow?.study_group ?? null) as string | null;
  const groupLabel = (g: string | null) => (g === "control" ? "Control (usual care)" : g === "intervention" ? "Intervention" : "Not allocated");
  const blocks: Block[] = [];
  const empty = (t = EMPTY) => blocks.push({ kind: "paragraph", text: t, muted: true });
  const kv = (rows: [string, string][]) => blocks.push({ kind: "kv", rows });
  const sub = (title: string) => blocks.push({ kind: "subheading", title });
  const visitDone = (m: string) => p[`${m === "baseline" ? "baseline" : m}_completed_at`];

  // ---------- Cover ----------
  const visitState = (done: unknown, opened = true) => (done ? `Completed ${fmt(done)}` : opened ? "Not completed" : "Not started");
  const cover: Block[] = [
    { kind: "section", title: "Participant information" },
    { kind: "kv", rows: [["Study title", STUDY_TITLE]] },
    { kind: "fields", rows: [
      ["Study ID", code], ["Site", human(p.site)],
      ["Status", label(p.status)], ["Stage", label(p.lifecycle_stage)],
      ["Eligibility", label(p.eligibility_status)], ["Consent", label(p.consent_status)],
      ["Enrolment", p.enrolment_confirmed ? `Enrolled ${fmt(p.enrolled_at)}` : "Not enrolled"], ["Randomised", p.randomized_at ? fmt(p.randomized_at) : "Not randomised"],
      ["Group", groupLabel(group)], ["Dataset", p.is_test_record === true ? "Synthetic test record" : "Study participant"],
    ] },
    { kind: "section", title: "Study visit completion" },
    { kind: "fields", rows: [
      ["Baseline", visitState(p.baseline_completed_at, p.enrolment_confirmed === true)], ["Day 15", visitState(p.day_15_completed_at, Boolean(p.day_15_opened_at))],
      ["Day 30", visitState(p.day_30_completed_at, Boolean(p.day_15_completed_at))],
      ["Study", p.day_30_completed_at ? "Completed" : p.non_completion_reason ? "Not completed" : "In progress"],
    ] },
    { kind: "notice", text: "Confidential clinical research record for authorised NeuroCare Connect research staff. Personal contact details (phone numbers, address, postal code, caregiver contact) are intentionally excluded. Dates and times are UTC. Report labels are always in English; recorded values are shown as saved. Text typed in Hindi, Kannada, Marathi, Urdu or other non-Latin scripts cannot be printed with the report font and is marked [non-Latin text]; the full value is in the Excel export." },
  ];

  // ---------- 1. Screening ----------
  blocks.push({ kind: "section", title: "1. Screening" });
  kv([
    ["Screening date", fmt(p.screening_date)], ["Eligibility result", label(p.eligibility_status)],
    ["Inclusion criteria met", yn(p.inclusion_criteria_met)], ["Exclusion criteria present", yn(p.exclusion_criteria_present)],
    ["Screening notes", human(p.screening_notes)], ["Record created", fmt(p.created_at, true)],
  ]);

  // ---------- 2. Consent ----------
  blocks.push({ kind: "section", title: "2. Consent" });
  kv([["Consent status", label(p.consent_status)], ["Consent date", fmt(p.consent_date)], ["Consent confirmed", yn(p.consent_confirmed)], ["Consent notes", human(p.consent_notes)]]);

  // ---------- 3. Enrolment ----------
  blocks.push({ kind: "section", title: "3. Enrolment" });
  kv([
    ["Study ID", code], ["Site", human(p.site)], ["Enrolment confirmed", yn(p.enrolment_confirmed)], ["Enrolment date", fmt(p.enrolled_at)],
    ["Enrolment notes", human(p.enrolment_notes)], ["Participant status", label(p.status)], ["Lifecycle stage", label(p.lifecycle_stage)],
    ["General participant notes", human(p.notes)],
  ]);

  // ---------- 4. Demographics ----------
  blocks.push({ kind: "section", title: "4. Demographics" });
  const d = ds.demographics[0];
  const bmiOf = (h: unknown, w: unknown) => {
    const hn = Number(h), wn = Number(w);
    return !blank(h) && !blank(w) && hn > 0 && wn > 0 ? `${(wn / (hn / 100) ** 2).toFixed(1)} kg/m² (weight ÷ height²)` : NR;
  };
  if (!d) empty("No demographic record has been recorded.");
  else {
    sub("Participant details");
    kv([["Age", withUnit(d.age_years, "years")], ["Sex", label(d.sex)], ["Height", withUnit(d.height_cm, "cm")], ["Weight", withUnit(d.weight_kg, "kg")], ["BMI (calculated)", bmiOf(d.height_cm, d.weight_kg)]]);
    sub("Hospital and admission details");
    kv([["IP number", human(d.ip_number)], ["OP number", human(d.op_number)], ["Patient type", label(d.patient_type)], ["Ward / unit", human(d.ward_unit)], ["Bed number", human(d.bed_number)], ["Admission date", fmt(d.admission_date)], ["Discharge date", fmt(d.discharge_date)]]);
    sub("Location and background");
    kv([["City", human(d.city)], ["District", human(d.district)], ["State", human(d.state)], ["Preferred language", label(d.preferred_language)], ["Education level", label(d.education_level)], ["Occupation", human(d.occupation)], ["Residence", label(d.residence)], ["Socio-economic status", label(d.socioeconomic_status)]]);
    sub("Caregiver (recorded separately from the participant)");
    kv([["Caregiver name", human(d.caregiver_name)], ["Relationship", label(d.caregiver_relationship)], ["Height", withUnit(d.caregiver_height_cm, "cm")], ["Weight", withUnit(d.caregiver_weight_kg, "kg")], ["BMI (calculated)", bmiOf(d.caregiver_height_cm, d.caregiver_weight_kg)], ["Blood pressure", human(d.caregiver_bp)], ["ECG notes", human(d.caregiver_ecg_notes)]]);
    sub("Lifestyle and habits");
    const habits = (d.habits ?? {}) as Record<string, { status?: string | null; details?: string | null } | undefined>;
    blocks.push({ kind: "table", header: ["Habit", "Answer", "Frequency / details"], widths: [10, 7, 22],
      rows: LIFESTYLE_HABITS.map((h) => { const e = habits[h.key] ?? {}; return [h.label, e.status ? label(e.status) : NR, human(e.details)]; }) });
    kv([["Last updated", fmt(d.updated_at, true)]]);
  }

  // ---------- 5. Clinical data ----------
  blocks.push({ kind: "section", title: "5. Clinical Data" });
  const c = ds.clinical[0];
  if (!c) empty("No clinical data record has been recorded.");
  else {
    sub("Diagnosis and pain history");
    kv([
      ["Treating neurologist", human(c.treating_neurologist)], ["Primary diagnosis", human(c.primary_diagnosis)], ["Provisional diagnosis", human(c.provisional_diagnosis)],
      ["Final diagnosis", human(c.final_diagnosis)], ["Diagnosis date", fmt(c.diagnosis_date)], ["Pain site", human(c.pain_site)], ["Pain distribution", label(c.pain_distribution)],
      ["Duration of pain", withUnit(c.pain_duration_months, "months")], ["Pain onset date", fmt(c.pain_onset_date)],
      ["Presenting complaints", human(c.presenting_complaints)], ["History of present illness", human(c.history_present_illness)],
      ["Past medical history", human(c.past_medical_history)], ["Past surgical history", human(c.past_surgical_history)], ["Family history", human(c.family_history)],
      ["Comorbidities", human(c.comorbidities)], ["Allergies", human(c.allergies)], ["Lifestyle notes", human(c.lifestyle_notes)],
    ]);
    sub("Vital signs");
    kv([
      ["Blood pressure", !blank(c.bp_systolic) || !blank(c.bp_diastolic) ? `${human(c.bp_systolic)} / ${human(c.bp_diastolic)} mmHg` : NR],
      ["Pulse rate", withUnit(c.pulse_rate, "beats/min")], ["Temperature", withUnit(c.temperature_c, "°C")],
      ["Respiratory rate", withUnit(c.respiratory_rate, "breaths/min")], ["SpO2", withUnit(c.spo2, "%")],
    ]);
    sub("Physical and systemic examination");
    const ex = (c.examination ?? {}) as Row;
    const known = new Set<string>(EXAM_SYSTEMS.map((s) => s.key));
    kv([
      ...EXAM_SYSTEMS.map((s): [string, string] => [s.label, human(ex[s.key])]),
      ...Object.keys(ex).filter((k) => !known.has(k) && !blank(ex[k])).map((k): [string, string] => [cap(k), human(ex[k])]),
    ]);
    kv([["Clinical notes", human(c.clinical_notes)], ["Recorded", fmt(c.recorded_at, true)], ["Last updated", fmt(c.updated_at, true)]]);
  }

  // ---------- 6. Laboratory ----------
  const LAB_CATEGORY: Record<string, string> = { renal: "Renal", liver: "Liver", glucose: "Glucose", ecg: "ECG", xray: "X-ray", ct_usg: "CT/USG", mri: "MRI", culture_sensitivity: "Culture & sensitivity", biopsy: "Biopsy", other: "Other" };
  blocks.push({ kind: "section", title: "6. Laboratory" });
  if (!ds.laboratory.length) empty("No laboratory investigations have been recorded.");
  // Result is free text (imaging/biopsy reports), so it gets the widest column to avoid mid-word breaks.
  else blocks.push({ kind: "table", header: ["Category", "Investigation", "Result", "Unit", "Reference range", "Date", "Notes"], widths: [8, 12, 18, 8, 9, 8, 9],
    rows: ds.laboratory.map((r) => [LAB_CATEGORY[String(r.category)] ?? label(r.category), human(r.investigation_name), human(r.result), human(r.unit), human(r.reference_range), fmt(r.investigation_date), human(r.notes)]) });

  // ---------- assessments per visit ----------
  const assessmentBlocks = (visit: string) => {
    const n = nrs.filter((a) => a.milestone === visit), d4 = dn4.filter((a) => a.milestone === visit), np = nep.filter((a) => a.milestone === visit);
    const oth = otherAssessments.filter((a) => a.milestone === visit);
    sub("Numeric Rating Scale (NRS, 0–10)");
    if (!n.length) empty("No NRS assessment recorded for this visit.");
    else for (const a of n) {
      blocks.push({ kind: "score", value: `${human(resp(a)["score"])}/10`, title: `NRS pain intensity — ${VISIT_LABEL[visit]}`, text: "Numeric Rating Scale, 0 = no pain to 10 = worst imaginable pain, as recorded by the participant." });
      kv([["Conducted", fmt(a.conducted_at, true)], ["Status", label(a.status)]]);
    }
    sub(`DN4 (${DN4_VERSION})`);
    if (!d4.length) empty("No DN4 assessment recorded for this visit.");
    else for (const a of d4) {
      const r = resp(a); const items = Array.isArray(r.items) ? (r.items as unknown[]) : [];
      // Wording from the in-app instrument catalogue (src/lib/instruments.ts), the same
      // source the data-entry form shows; external reproduction authorisation is still pending.
      let idx = 0;
      DN4_QUESTIONS.forEach((q, qi) => {
        const kind = qi < 2 ? "Symptom question (patient interview)" : "Examination question";
        blocks.push({ kind: "paragraph", text: `Question ${qi + 1} — ${kind}: ${q.question}` });
        blocks.push({ kind: "responses", rows: q.items.map((wording, ii) => { const v = items[idx++]; return { label: `${qi + 1}.${ii + 1} ${wording}`, answer: v === true ? "YES" : v === false ? "NO" : NR, positive: v === true }; }) });
      });
      const total = typeof r.total === "number" ? r.total : null;
      blocks.push({ kind: "score", value: total === null ? NR : `${total}/${DN4_ITEM_COUNT}`, title: total === null ? `DN4 total — ${VISIT_LABEL[visit]}` : total >= 4 ? `At or above the DN4 cut-off — ${VISIT_LABEL[visit]}` : `Below the DN4 cut-off — ${VISIT_LABEL[visit]}`,
        text: "Total = number of YES answers (0–10), calculated by the study database. A score of 4 or more suggests neuropathic pain." });
      kv([["Version", human(r.version ?? DN4_VERSION)], ["Conducted", fmt(a.conducted_at, true)], ["Status", label(a.status)]]);
    }
    sub("NePIQoL (provisional scoring)");
    if (!np.length) empty("No NePIQoL assessment recorded for this visit.");
    else for (const a of np) {
      const r = resp(a); const items = Array.isArray(r.items) ? (r.items as unknown[]) : [];
      const subs = (r.subscales ?? {}) as Row;
      blocks.push({ kind: "score", value: human(r.total), title: `NePIQoL total (provisional) — ${VISIT_LABEL[visit]}`, text: `Possible range ${NEPIQOL_TOTAL_RANGE[0]}–${NEPIQOL_TOTAL_RANGE[1]}, calculated by the study database. Provisional until the response-option mapping is approved.` });
      kv([
        ["Version", human(r.version)],
        ...NEPIQOL_SUBSCALES.map((s): [string, string] => [`Subscale: ${s.label}`, `${human(subs[s.key])} / ${s.max}`]),
        ["Conducted", fmt(a.conducted_at, true)], ["Status", label(a.status)],
      ]);
      sub("Itemised answers (all 42 items)");
      // One row per item: catalogue wording + the recorded answer label and stored
      // position (1–5). Labels come from the in-app scale; mapping is provisional
      // until the approved response-option mapping is supplied.
      for (const s of NEPIQOL_SECTIONS) {
        blocks.push({ kind: "paragraph", text: s.title, muted: true });
        blocks.push({ kind: "responses", rows: NEPIQOL_ITEMS.filter((it) => it.section === s.title).map((it) => {
          const n = Number(items[it.number - 1]);
          const valid = Number.isInteger(n) && n >= 1 && n <= 5;
          return { label: `Item ${it.number} — ${it.text}`, answer: valid ? `${it.options[n - 1]} (${n})` : NR };
        }) });
      }
    }
    for (const a of oth) { sub(`${String(a.instrument)} assessment`); kv([["Responses", human(a.responses)], ["Conducted", fmt(a.conducted_at, true)], ["Status", label(a.status)]]); }
  };

  // ---------- 7. Baseline ----------
  blocks.push({ kind: "section", title: "7. Baseline" });
  blocks.push({ kind: "notice", text: `Instrument notes: DN4 and NePIQoL item wording is reproduced from the study's in-app instrument catalogue (the same wording shown on the data-entry forms); external reproduction authorisation is ${INSTRUMENT_CONTENT_STATUS}. DN4 numbering follows the questionnaire (questions 1–2 are symptom/interview items, 3–4 examination items). NePIQoL response labels are PROVISIONAL — ${NEPIQOL_MAPPING_STATUS}; each answer shows the label of the stored position (1–5) with the stored position in brackets; scores are never reverse-scored for display.` });
  kv([["Baseline completed", fmt(p.baseline_completed_at, true)]]);
  assessmentBlocks("baseline");

  // ---------- 8. Medication review ----------
  blocks.push({ kind: "section", title: "8. Medication Review" });
  sub("Medications");
  if (!ds.medications.length) empty("No medication records have been recorded.");
  else {
    blocks.push({ kind: "table", header: ["Ref", "Medication", "Dose", "Frequency", "Route", "Indication", "Start", "Stop", "Current"], widths: [4, 12, 8, 8, 8, 11, 9, 9, 8],
      rows: ds.medications.map((m) => [medNo.get(m.id as string)!, human(m.drug_name), !blank(m.dose) && m.dose_unit ? `${m.dose} ${m.dose_unit}` : human(m.dose), human(m.frequency), human(m.route), human(m.indication), fmt(m.start_date), fmt(m.stop_date), yn(m.is_current)]) });
    blocks.push({ kind: "table", header: ["Ref", "Brand", "Generic", "Category", "Schedule", "For neuropathic pain", "Non-pharmacological measures"], widths: [4, 10, 10, 9, 10, 8, 16],
      rows: ds.medications.map((m) => [medNo.get(m.id as string)!, human(m.brand_name), human(m.generic_name), label(m.category), human(m.dosing_schedule), yn(m.for_neuropathic_pain), human(m.non_pharm_measures)]) });
  }
  sub("Drug interactions");
  if (!ds.interactions.length) empty("No drug-interaction records have been recorded.");
  else {
    ds.interactions.forEach((r, i) => {
      const txt = (v: unknown) => (v == null || String(v).trim() === "" ? "–" : String(v));
      blocks.push({ kind: "paragraph", text: `Interaction ${i + 1}` });
      blocks.push({ kind: "fields", rows: [
        ["Visit", r.milestone ? label(r.milestone) : "Outside scheduled visit — not assigned to Baseline, Day 15 or Day 30"],
        ["First medication", txt(r.drug_a)],
        ["Second medication", txt(r.drug_b)],
        ["Clinical relevance / severity", txt(r.severity)],
        ["Interaction description", txt(r.mechanism)],
        ["Action / documentation", txt(r.management)],
        ["Notes", txt(r.documentation_notes)],
        ["Source", txt(r.source)],
        ["Recorded", fmt(r.identified_at, true)],
      ] });
    });
  }
  sub("Medication changes");
  if (!ds.medicationChanges.length) empty("No medication changes have been recorded.");
  else ds.medicationChanges.forEach((r, i) => {
    const txt = (v: unknown) => (v == null || String(v).trim() === "" ? "–" : String(v));
    blocks.push({ kind: "paragraph", text: `Medication change ${i + 1}` });
    blocks.push({ kind: "fields", rows: [
      ["Visit", label(r.milestone)],
      ["Medication", txt(r.medication_name)],
      ["Previous medication / regimen", txt(r["previous_regimen"])],
      ["New medication / regimen", txt(r["new_regimen"])],
      ["Previous dose", txt(r.previous_dose)],
      ["New dose", txt(r.new_dose)],
      ["Frequency change", txt(r["frequency_change"])],
      ["Route change", txt(r["route_change"])],
      ["Start / stop / modification", txt(r["modification_details"])],
      ["Change description", txt(r.change_description)],
      ["Reason", txt(r.reason)],
      ["Date", fmt(r.change_date)],
      ["Approximate period", txt(r["change_period"])],
      ["Researcher notes", txt(r["researcher_notes"])],
      ["Additional details", txt(r["additional_details"])],
    ] });
  });
  sub("Adverse drug reactions");
  if (!ds.adrs.length) empty("No adverse drug reaction reports have been recorded.");
  else ds.adrs.forEach((r, i) => {
    blocks.push({ kind: "paragraph", text: `ADR ${i + 1}` });
    const txt = (v: unknown) => (v == null || String(v).trim() === "" ? "–" : String(v));
    blocks.push({ kind: "fields", rows: [
      ["When reported", txt(r.kind === "historical" || r.kind === "follow_up" ? label(r.kind) : r.kind)],
      ["Visit", label(r.milestone)],
      ["Linked medication", r.medication_id ? medNo.get(r.medication_id as string) ?? "–" : "Not linked"],
      ["Suspected medication", txt(r.suspected_medicine)],
      ["Suspected medicine notes", txt(r["suspected_medicine_notes"])],
      ["Allergic drug reaction", txt(r["allergic_reaction"])],
      ["Reaction description", txt(r.reaction_description)],
      ["Symptomatic relief / treatment", txt(r["symptomatic_relief"])],
      ["Date / period", txt(r.onset_period)],
      ["Severity / clinical details", txt(r.severity)],
      ["Outcome", txt(r.outcome)],
      ["Recorded", fmt(r.created_at, true)],
    ] });
  });

  // ---------- 9. DRPs ----------
  blocks.push({ kind: "section", title: `9. Drug-Related Problems (PCNE ${PCNE_VERSION})` });
  blocks.push({ kind: "notice", text: `PCNE ${PCNE_VERSION} code labels from the in-app catalogue — verification against the official source pending.` });
  const codeOne = (v: unknown, list: typeof PCNE_PROBLEMS) => (blank(v) ? NR : `${v} — ${labelOf(list, String(v))}`);
  const codeList = (v: unknown, list: typeof PCNE_PROBLEMS) => (Array.isArray(v) && v.length ? v.map((x) => codeOne(x, list)).join("\n") : NR);
  if (!ds.drps.length) empty("No drug-related problems have been recorded.");
  else for (const r of ds.drps) {
    sub(`${drpNo.get(r.id as string)} — ${r.milestone ? label(r.milestone) : "Outside scheduled visit"} — ${label(r.status)}`);
    kv([
      ["Linked medication", r.medication_id ? medNo.get(r.medication_id as string) ?? NR : NR], ["Problem type", label(r.problem_type)],
      ["PCNE version", human(r.pcne_version)], ["Problem (P)", codeOne(r.pcne_problem_code, PCNE_PROBLEMS)], ["Causes (C)", codeList(r.pcne_cause_codes, PCNE_CAUSES)],
      ["Interventions (I)", codeList(r.pcne_intervention_codes, PCNE_INTERVENTIONS)], ["Acceptance (A)", codeOne(r.pcne_acceptance_code, PCNE_ACCEPTANCE)],
      ["Outcome (O)", codeOne(r.pcne_outcome_code, PCNE_OUTCOMES)], ["Description", human(r.description)], ["Identified", fmt(r.identified_at, true)],
      ["Resolved", fmt(r.resolved_at, true)], ["Resolution notes", human(r.resolution_notes)],
      ["Documentation context", r.milestone ? label(r.milestone) : "Outside scheduled visit — not assigned to Baseline, Day 15 or Day 30"],
      ["Suspected / related medication", human(r["suspected_medication"])],
      ["Clinical details", human(r["clinical_details"])],
      ["Researcher observations", human(r["researcher_observations"])],
      ["Cause / contributing factors", human(r["cause_details"])],
      ["Intervention details", human(r["intervention_details"])],
      ["Physician communication notes", human(r["physician_communication"])],
      ["Physician response / acceptance notes", human(r["physician_response_notes"])],
      ["Action taken", human(r["action_taken"])],
      ["Outcome notes", human(r["outcome_notes"])],
      ["Follow-up observations", human(r["follow_up_observations"])],
      ["Additional comments", human(r["additional_comments"])],
    ]);
  }
  sub("DRP follow-up outcomes");
  if (!ds.drpOutcomes.length) empty("No DRP follow-up outcomes have been recorded.");
  else blocks.push({ kind: "table", header: ["DRP", "Visit", "Status at visit", "PCNE outcome", "Notes", "Recorded"], widths: [5, 7, 9, 14, 20, 9],
    rows: [...ds.drpOutcomes].sort(byVisit).map((r) => [drpNo.get(r.drp_id as string) ?? "–", label(r.milestone), label(r.visit_status), codeOne(r.pcne_outcome_code, PCNE_OUTCOMES), human(r.notes), fmt(r.recorded_at, true)]) });

  // ---------- 10. Randomisation ----------
  blocks.push({ kind: "section", title: "10. Randomisation" });
  kv([
    ["Status", p.randomized_at ? "Randomised" : "Not randomised"], ["Randomised at", fmt(randRow?.assigned_at ?? p.randomized_at, true)],
    ["Current allocated group", groupLabel(group)], ["Original allocation", groupLabel((randRow?.study_group ?? null) as string | null)],
    ["Method", human(randRow?.method)],
    ["Allocation corrections", ds.overrides.length ? String(ds.overrides.length) : "None recorded"],
  ]);
  if (ds.overrides.length) blocks.push({ kind: "table", header: ["Previous group", "New group", "Reason", "Date"], widths: [8, 8, 20, 9],
    rows: ds.overrides.map((o) => [groupLabel(o.previous_group as string), groupLabel(o.new_group as string), human(o.reason), fmt(o.overridden_at, true)]) });

  // ---------- 11. Intervention ----------
  blocks.push({ kind: "section", title: "11. Intervention" });
  sub("Patient / caregiver counselling");
  if (!ds.counselling.length) empty(group === "intervention" ? "No counselling record has been recorded." : "No counselling record has been recorded. Counselling records apply to intervention participants.");
  else for (const r of ds.counselling) {
    sub(`${label(r.milestone)} session — ${fmt(r.session_date)}`);
    kv([["Duration", withUnit(r.duration_minutes, "minutes")], ["Recipient", label(r.recipient)], ["Materials provided", human(r.materials_provided)], ["Additional topics", human(r.topics)], ["Notes", human(r.notes)]]);
    const cl = (r.checklist ?? {}) as Record<string, { covered?: boolean; teach_back?: boolean } | boolean>;
    const norm = (raw: { covered?: boolean; teach_back?: boolean } | boolean | undefined) => (typeof raw === "boolean" ? { covered: raw, teach_back: undefined } : (raw ?? {}));
    blocks.push({ kind: "table", header: ["Counselling topic", "Covered", "Teach-back"], widths: [22, 6, 6],
      rows: COUNSELLING_TOPICS.map((t) => { const e = norm(cl[t.key]); return [t.label, yn(e.covered), yn(e.teach_back)]; }) });
  }
  sub("Physician communication");
  if (!ds.recommendations.length) empty("No physician recommendations have been recorded.");
  else blocks.push({ kind: "table", header: ["DRP", "Recommendation", "Sent", "Mode", "Acceptance", "Physician response", "Responded"], widths: [5, 17, 9, 8, 9, 14, 9],
    rows: ds.recommendations.map((r) => [drpNo.get(r.drp_id as string) ?? "–", human(r.recommendation), fmt(r.communicated_at), label(r.communication_mode), label(r.acceptance_status), human(r.physician_response), fmt(r.responded_at)]) });

  // ---------- 12/13. Follow-up visits ----------
  for (const [n, visit, title] of [[12, "day_15", "Day 15"], [13, "day_30", "Day 30"]] as const) {
    blocks.push({ kind: "section", title: `${n}. ${title}` });
    const m = ds.milestones.find((x) => x.milestone === visit);
    kv([
      // Completion comes from the participant record (the lifecycle source of truth), never the progress row alone.
      ["Visit status", visitDone(visit) ? "Completed" : m ? (m.status === "completed" ? "In progress" : label(m.status)) : NR], ["Due date", fmt(m?.due_date)], ["Started", fmt(m?.started_at, true)], ["Completed", fmt(visitDone(visit), true)],
      ...(visit === "day_15" ? [["Visit window opened", fmt(p.day_15_opened_at, true)] as [string, string]] : []),
    ]);
    sub("Follow-up record");
    const f = ds.followUps.find((x) => x.milestone === visit);
    if (!f) empty(`No ${title} follow-up record has been recorded.`);
    else kv([
      ["Status", label(f.status)], ["Scheduled", fmt(f.scheduled_for)], ["Contacted", fmt(f.contacted_at, true)], ["Contact mode", label(f.contact_mode)],
      ["Missed doses", label(f.missed_doses)], ["Missed-dose details", human(f.missed_dose_details)], ["Missed-dose reason", human(f.missed_dose_reason)],
      ["Adherence notes", human(f.adherence_notes)], ["Admission / ER visit", label(f.admission_er)], ["Admission date", fmt(f.admission_date)],
      ["Admission details", human(f.admission_details)], ["Outcome", human(f.outcome)], ["Notes", human(f.notes)],
    ]);
    assessmentBlocks(visit);
  }

  // ---------- 14. Outcomes ----------
  blocks.push({ kind: "section", title: "14. Outcomes" });
  const val = (arr: Row[], k: string, m: string) => { const a = arr.find((x) => x.milestone === m && typeof resp(x)[k] === "number"); return a ? (resp(a)[k] as number) : null; };
  const outRows: string[][] = [];
  for (const [name, arr, key] of [["NRS (0–10)", nrs, "score"], ["DN4 total (0–10)", dn4, "total"], ["NePIQoL total (provisional)", nep, "total"]] as const) {
    const b = val(arr, key, "baseline");
    for (const m of ["day_15", "day_30"]) {
      const f = val(arr, key, m);
      outRows.push([name, label(m), b === null ? NR : String(b), f === null ? NR : String(f), b !== null && f !== null ? `${f - b > 0 ? "+" : ""}${f - b}` : "Insufficient data"]);
    }
  }
  blocks.push({ kind: "table", header: ["Measure", "Follow-up visit", "Baseline", "Follow-up value", "Change (follow-up − baseline)"], widths: [12, 8, 7, 8, 11], rows: outRows });
  const pts = nrs.filter((a) => typeof resp(a)["score"] === "number").map((a) => ({ label: label(a.milestone), value: resp(a)["score"] as number }));
  if (pts.length) blocks.push({ kind: "fields", rows: pts.map((x): [string, string] => [`NRS ${x.label}`, `${x.value}/10`]) });
  kv([
    ["DRPs recorded", String(ds.drps.length)], ["DRP resolution rate", PENDING_PROTOCOL], ["Physician acceptance rate", PENDING_PROTOCOL],
    ["Study completion", p.day_30_completed_at ? `Completed ${fmt(p.day_30_completed_at, true)}` : "Not completed"],
    ["Non-completion reason", human(p.non_completion_reason)], ["Last contact date", fmt(p.last_contact_date)], ["Completion notes", human(p.completion_notes)],
  ]);
  sub("Report information");
  kv([
    ["Generated", generatedAt], ["Source", "Read-only snapshot of the study database at the time shown"],
    ["Pending protocol items", "NePIQoL response-option mapping; DN4/NePIQoL external reproduction authorisation; PCNE code verification; DRP resolution and physician acceptance formulas"],
    ["References", "M1, DRP-1 etc. are local to this report. No account or database identifiers are included."],
  ]);

  return { cover, blocks, studyCode: code, synthetic: p.is_test_record === true };
}
