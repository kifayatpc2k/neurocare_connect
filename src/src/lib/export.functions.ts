import { splitByDataset, type Dataset } from "@/lib/test-records";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeAnalytics, VISITS, ARMS, type OutcomeRow } from "@/lib/analytics";
import { buildXlsx, toBase64, type CellValue, type Sheet } from "@/lib/xlsx";
import { EXPORT_PENDING_COLUMNS, EXPORT_SHEETS } from "@/lib/export-spec";
import {
  DN4_ITEM_COUNT,
  NEPIQOL_ITEM_COUNT,
  NEPIQOL_MAPPING_STATUS,
  NEPIQOL_SUBSCALES,
  PENDING_PROTOCOL,
} from "@/lib/instruments";

export type ExportResult = {
  filename: string;
  fileBase64: string;
  participantCount: number;
  sheets: { label: string; rows: number }[];
};

type Known =
  | "id"
  | "participant_id"
  | "participant_code"
  | "milestone"
  | "status"
  | "conducted_at"
  | "instrument"
  | "responses"
  | "medication_id"
  | "drp_id"
  | "pcne_cause_codes"
  | "pcne_intervention_codes"
  | "items"
  | "score"
  | "total"
  | "version"
  | "subscales";
type Row = Record<string, unknown> & Partial<Record<Known, unknown>>;

const GRAIN: Record<string, string> = {
  participants: "One row per participant",
  randomisation: "One row per randomised participant",
  milestones: "One row per participant per visit",
  demographics: "One row per participant",
  clinical: "One row per clinical record",
  medications: "One row per medication record",
  interactions: "One row per recorded interaction",
  nrs: "One row per participant per visit",
  dn4: "One row per participant per visit",
  nepiqol: "One row per participant per visit",
  drps: "One row per DRP",
  recommendations: "One row per recommendation",
  counselling: "One row per counselling session",
  follow_ups: "One row per follow-up contact",
  study_summary: "One row per metric",
  outcome_summary: "One row per instrument × group × visit",
  drp_summary: "One row per category count",
  completeness: "One row per completeness metric",
  laboratory: "One row per investigation",
  adrs: "One row per ADR report",
  med_changes: "One row per medication change per visit",
  drp_outcomes: "One row per DRP per visit",
};

const list = (v: unknown) => (Array.isArray(v) ? v.join("; ") : (v as CellValue));
const val = (v: unknown): CellValue =>
  v === null || v === undefined
    ? null
    : typeof v === "object"
      ? JSON.stringify(v)
      : (v as CellValue);

/**
 * Builds the research Excel workbook.
 * Authorization: signed-in (middleware) AND research staff (checked through the
 * caller's own RLS-scoped client). All reads run as the caller, so RLS remains
 * the access boundary; no admin client is used. Staff/user account IDs,
 * profiles, roles and session logs are deliberately excluded.
 */
export const generateResearchExport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { dataset?: Dataset } | undefined) => ({
    dataset: (input?.dataset === "test" || input?.dataset === "all"
      ? input.dataset
      : "study") as Dataset,
  }))
  .handler(async ({ context, data: input }): Promise<ExportResult> => {
    const supabase = context.supabase;
    const { data: isStaff, error: roleError } = await supabase.rpc("is_research_staff", {
      _user_id: context.userId,
    });
    if (roleError) {
      console.error("[export] role check:", roleError);
      throw new Error("Could not confirm research access.");
    }
    if (isStaff !== true) throw new Error("Research staff permission is required.");

    const read = async (
      name: string,
      query: PromiseLike<{ data: unknown; error: { message: string } | null }>,
    ) => {
      const { data, error } = await query;
      if (error) {
        console.error(`[export] ${name}:`, error);
        throw new Error(`Could not read ${name}.`);
      }
      return (data ?? []) as Row[];
    };

    const [
      allParticipants,
      allRandomizations,
      all_milestones,
      all_assessments,
      all_demographics,
      all_clinical,
      all_medications,
      all_interactions,
      all_drps,
      all_recommendations,
      all_counselling,
      all_followUps,
      all_overrides,
      all_lab,
      all_adrs,
      all_medChanges,
      all_drpOutcomes,
    ] = await Promise.all([
      read(
        "participants",
        supabase
          .from("participants")
          .select(
            "id, is_test_record, participant_code, site, study_group, status, lifecycle_stage, screening_date, eligibility_status, inclusion_criteria_met, exclusion_criteria_present, screening_notes, consent_status, consent_date, consent_confirmed, consent_notes, enrolment_confirmed, enrolled_at, enrolment_notes, baseline_completed_at, randomized_at, day_15_opened_at, day_15_completed_at, day_30_completed_at, non_completion_reason, last_contact_date, completion_notes, notes, created_at",
          )
          .order("participant_code"),
      ),
      read(
        "randomisation",
        supabase
          .from("randomizations")
          .select("participant_id, study_group, method, allocation_seq, assigned_at")
          .order("allocation_seq"),
      ),
      read(
        "milestones",
        supabase
          .from("participant_milestones")
          .select("participant_id, milestone, status, due_date, started_at, completed_at"),
      ),
      read(
        "assessments",
        supabase
          .from("assessments")
          .select("id, participant_id, milestone, instrument, status, conducted_at, responses")
          .order("conducted_at"),
      ),
      read(
        "demographics",
        supabase
          .from("demographics")
          .select(
            "participant_id, age_years, sex, height_cm, weight_kg, education_level, occupation, residence, socioeconomic_status, ip_number, op_number, patient_type, ward_unit, admission_date, discharge_date, city, district, state, postal_code, preferred_language, caregiver_name, caregiver_relationship, caregiver_height_cm, caregiver_weight_kg, caregiver_bp, habits, updated_at",
          ),
      ),
      read(
        "clinical data",
        supabase
          .from("clinical_data")
          .select(
            "participant_id, primary_diagnosis, provisional_diagnosis, final_diagnosis, diagnosis_date, treating_neurologist, pain_site, pain_distribution, pain_duration_months, pain_onset_date, presenting_complaints, history_present_illness, past_medical_history, past_surgical_history, family_history, comorbidities, allergies, lifestyle_notes, bp_systolic, bp_diastolic, pulse_rate, temperature_c, respiratory_rate, spo2, examination, clinical_notes, recorded_at, updated_at",
          ),
      ),
      read(
        "medications",
        supabase
          .from("medications")
          .select(
            "id, participant_id, drug_name, brand_name, generic_name, category, dose, dose_unit, frequency, dosing_schedule, route, indication, for_neuropathic_pain, non_pharm_measures, start_date, stop_date, is_current, recorded_at",
          )
          .order("recorded_at"),
      ),
      read(
        "drug interactions",
        supabase
          .from("drug_interactions")
          .select(
            "participant_id, milestone, drug_a, drug_b, severity, mechanism, management, source, documentation_notes, identified_at",
          )
          .order("identified_at"),
      ),
      read(
        "DRPs",
        supabase
          .from("drps")
          .select(
            "id, participant_id, medication_id, milestone, problem_type, pcne_version, pcne_problem_code, pcne_cause_codes, pcne_intervention_codes, pcne_acceptance_code, pcne_outcome_code, description, status, identified_at, resolved_at, resolution_notes, suspected_medication, clinical_details, researcher_observations, cause_details, intervention_details, physician_communication, physician_response_notes, action_taken, outcome_notes, follow_up_observations, additional_comments",
          )
          .order("identified_at"),
      ),
      read(
        "physician recommendations",
        supabase
          .from("physician_recommendations")
          .select(
            "participant_id, drp_id, recommendation, communicated_at, communication_mode, acceptance_status, physician_response, responded_at, created_at",
          )
          .order("created_at"),
      ),
      read(
        "counselling",
        supabase
          .from("counselling_sessions")
          .select(
            "participant_id, milestone, session_date, duration_minutes, recipient, topics, materials_provided, checklist, notes",
          )
          .order("session_date"),
      ),
      read(
        "follow-ups",
        supabase
          .from("follow_ups")
          .select(
            "participant_id, milestone, status, scheduled_for, contacted_at, contact_mode, outcome, missed_doses, missed_dose_details, missed_dose_reason, adherence_notes, admission_er, admission_date, admission_details, notes",
          ),
      ),
      read(
        "allocation overrides",
        supabase
          .from("allocation_overrides")
          .select("participant_id, previous_group, new_group, overridden_at")
          .order("overridden_at"),
      ),
      read(
        "laboratory investigations",
        supabase
          .from("laboratory_investigations")
          .select("participant_id, category, investigation_name, result, unit, reference_range, investigation_date, notes")
          .order("investigation_date"),
      ),
      read(
        "ADR reports",
        supabase
          .from("adr_reports")
          .select("participant_id, kind, milestone, suspected_medicine, suspected_medicine_notes, allergic_reaction, reaction_description, symptomatic_relief, onset_period, severity, outcome, created_at")
          .order("created_at"),
      ),
      read(
        "medication changes",
        supabase
          .from("medication_changes")
          .select("participant_id, milestone, medication_name, previous_regimen, new_regimen, previous_dose, new_dose, frequency_change, route_change, modification_details, change_description, reason, change_date, change_period, researcher_notes, additional_details")
          .order("created_at"),
      ),
      read(
        "DRP visit outcomes",
        supabase
          .from("drp_visit_outcomes")
          .select("participant_id, drp_id, milestone, visit_status, pcne_outcome_code, notes, recorded_at")
          .order("recorded_at"),
      ),
    ]);

    // Study export excludes test participants; a test export holds only them.
    const {
      participants,
      children: {
        randomizations, milestones, assessments, demographics, clinical, medications,
        interactions, drps, recommendations, counselling, followUps, overrides,
        lab, adrs, medChanges, drpOutcomes,
      },
    } = splitByDataset(allParticipants, {
      randomizations: allRandomizations,
      milestones: all_milestones,
      assessments: all_assessments,
      demographics: all_demographics,
      clinical: all_clinical,
      medications: all_medications,
      interactions: all_interactions,
      drps: all_drps,
      recommendations: all_recommendations,
      counselling: all_counselling,
      followUps: all_followUps,
      overrides: all_overrides,
      lab: all_lab,
      adrs: all_adrs,
      medChanges: all_medChanges,
      drpOutcomes: all_drpOutcomes,
    }, input.dataset);

    const code = new Map(participants.map((p) => [p.id as string, p.participant_code as string]));
    const pc = (r: Row) => code.get(r.participant_id as string) ?? "UNKNOWN";
    const ref = (id: unknown) => (typeof id === "string" ? id.slice(0, 8) : null);
    const pick = (rows: Row[], cols: string[], arrays: string[] = []) =>
      rows.map((r) => [pc(r), ...cols.map((c) => (arrays.includes(c) ? list(r[c]) : val(r[c])))]);
    const byInstrument = (name: string) =>
      assessments.filter((a) => String(a.instrument).toUpperCase() === name);
    const resp = (a: Row) => (a.responses ?? {}) as Row;

    const pCols = [
      "site",
      "study_group",
      "status",
      "lifecycle_stage",
      "screening_date",
      "eligibility_status",
      "inclusion_criteria_met",
      "exclusion_criteria_present",
      "screening_notes",
      "consent_status",
      "consent_date",
      "consent_confirmed",
      "consent_notes",
      "enrolment_confirmed",
      "enrolled_at",
      "enrolment_notes",
      "baseline_completed_at",
      "randomized_at",
      "day_15_opened_at",
      "day_15_completed_at",
      "day_30_completed_at",
      "non_completion_reason",
      "last_contact_date",
      "completion_notes",
      "notes",
      "created_at",
    ];
    const aHead = ["participant_code", "visit", "status", "conducted_at"];
    const aBase = (a: Row): CellValue[] => [
      pc(a),
      val(a.milestone),
      val(a.status),
      val(a.conducted_at),
    ];

    const data: Record<string, Sheet> = {
      participants: {
        name: "Participants",
        header: ["participant_code", ...pCols],
        rows: participants.map((p) => [val(p.participant_code), ...pCols.map((c) => val(p[c]))]),
      },
      randomisation: {
        name: "Randomisation",
        header: [
          "participant_code",
          "original_allocation",
          "current_allocation",
          "allocation_overridden",
          "override_count",
          "last_override_date",
          "method",
          "allocation_seq",
          "assigned_at",
        ],
        rows: randomizations.map((r) => {
          const pid = r["participant_id"] as string;
          const current = participants.find((p) => p["id"] === pid)?.["study_group"] ?? r["study_group"];
          const ov = overrides.filter((o) => o["participant_id"] === pid);
          return [
            pc(r),
            val(r["study_group"]),
            val(current),
            ov.length > 0 ? "yes" : "no",
            ov.length,
            ov.length ? val(ov[ov.length - 1]!["overridden_at"]) : null,
            val(r["method"]),
            val(r["allocation_seq"]),
            val(r["assigned_at"]),
          ];
        }),
      },
      milestones: {
        name: "Visit milestones",
        header: ["participant_code", "visit", "status", "due_date", "started_at", "completed_at"],
        rows: pick(milestones, ["milestone", "status", "due_date", "started_at", "completed_at"]),
      },
      nrs: {
        name: "NRS",
        header: [...aHead, "nrs_score"],
        rows: byInstrument("NRS").map((a) => [...aBase(a), val(resp(a).score)]),
      },
      dn4: {
        name: "DN4",
        header: [
          ...aHead,
          "version",
          ...Array.from({ length: DN4_ITEM_COUNT }, (_, i) => `item_${i + 1}`),
          "dn4_total",
        ],
        rows: byInstrument("DN4").map((a) => {
          const items = Array.isArray(resp(a).items) ? (resp(a).items as unknown[]) : [];
          return [
            ...aBase(a),
            val(resp(a).version),
            ...Array.from({ length: DN4_ITEM_COUNT }, (_, i) =>
              items[i] === undefined ? null : items[i] ? "Yes" : "No",
            ),
            val(resp(a).total),
          ];
        }),
      },
      nepiqol: {
        name: "NePIQoL",
        header: [
          ...aHead,
          "version",
          "scoring_status",
          "total",
          ...NEPIQOL_SUBSCALES.map((s) => `subscale_${s.key}`),
          ...Array.from({ length: NEPIQOL_ITEM_COUNT }, (_, i) => `item_${i + 1}_position`),
        ],
        rows: byInstrument("NEPIQOL").map((a) => {
          const r = resp(a);
          const items = Array.isArray(r.items) ? (r.items as unknown[]) : [];
          const subs = (r.subscales ?? {}) as Record<string, unknown>;
          return [
            ...aBase(a),
            val(r.version),
            `PROVISIONAL — ${NEPIQOL_MAPPING_STATUS}`,
            val(r.total),
            ...NEPIQOL_SUBSCALES.map((s) => val(subs[s.key])),
            ...Array.from({ length: NEPIQOL_ITEM_COUNT }, (_, i) => val(items[i])),
          ];
        }),
      },
      demographics: {
        name: "Demographics",
        header: [
          "participant_code",
          "age_years",
          "sex",
          "height_cm",
          "weight_kg",
          "patient_bmi",
          "ip_number",
          "op_number",
          "patient_type",
          "ward_unit",
          "admission_date",
          "discharge_date",
          "city",
          "district",
          "state",
          "postal_code",
          "preferred_language",
          "education_level",
          "occupation",
          "residence",
          "socioeconomic_status",
          "caregiver_name",
          "caregiver_relationship",
          "caregiver_height_cm",
          "caregiver_weight_kg",
          "caregiver_bmi",
          "caregiver_bp",
          "habits",
          "updated_at",
        ],
        rows: demographics.map((d) => {
          const bmiOf = (h: unknown, w: unknown) => {
            const hn = Number(h), wn = Number(w);
            return hn > 0 && wn > 0 ? (wn / ((hn / 100) ** 2)).toFixed(1) : null;
          };
          return [
            pc(d),
            ...["age_years", "sex", "height_cm", "weight_kg"].map((c) => val(d[c])),
            bmiOf(d["height_cm"], d["weight_kg"]),
            ...["ip_number", "op_number", "patient_type", "ward_unit", "admission_date", "discharge_date", "city", "district", "state", "postal_code", "preferred_language", "education_level", "occupation", "residence", "socioeconomic_status", "caregiver_name", "caregiver_relationship", "caregiver_height_cm", "caregiver_weight_kg"].map((c) => val(d[c])),
            bmiOf(d["caregiver_height_cm"], d["caregiver_weight_kg"]),
            val(d["caregiver_bp"]),
            val(d["habits"]),
            val(d["updated_at"]),
          ];
        }),
      },
      clinical: {
        name: "Clinical data",
        header: [
          "participant_code",
          "treating_neurologist",
          "primary_diagnosis",
          "provisional_diagnosis",
          "final_diagnosis",
          "diagnosis_date",
          "pain_site",
          "pain_distribution",
          "pain_duration_months",
          "pain_onset_date",
          "presenting_complaints",
          "history_present_illness",
          "past_medical_history",
          "past_surgical_history",
          "family_history",
          "comorbidities",
          "allergies",
          "lifestyle_notes",
          "bp_systolic",
          "bp_diastolic",
          "pulse_rate",
          "temperature_c",
          "respiratory_rate",
          "spo2",
          "examination",
          "clinical_notes",
          "recorded_at",
          "updated_at",
        ],
        rows: pick(
          clinical,
          [
            "treating_neurologist",
            "primary_diagnosis",
            "provisional_diagnosis",
            "final_diagnosis",
            "diagnosis_date",
            "pain_site",
            "pain_distribution",
            "pain_duration_months",
            "pain_onset_date",
            "presenting_complaints",
            "history_present_illness",
            "past_medical_history",
            "past_surgical_history",
            "family_history",
            "comorbidities",
            "allergies",
            "lifestyle_notes",
            "bp_systolic",
            "bp_diastolic",
            "pulse_rate",
            "temperature_c",
            "respiratory_rate",
            "spo2",
            "examination",
            "clinical_notes",
            "recorded_at",
            "updated_at",
          ],
          ["comorbidities", "allergies"],
        ),
      },
      laboratory: {
        name: "Laboratory Investigations",
        header: [
          "participant_code",
          "category",
          "investigation_name",
          "result",
          "unit",
          "reference_range",
          "investigation_date",
          "notes",
        ],
        rows: pick(lab, ["category", "investigation_name", "result", "unit", "reference_range", "investigation_date", "notes"]),
      },
      adrs: {
        name: "Adverse Drug Reactions",
        header: [
          "participant_code",
          "kind",
          "visit",
          "suspected_medicine",
          "reaction_description",
          "onset_period",
          "severity",
          "outcome",
          "created_at",
        ],
        rows: pick(adrs, ["kind", "milestone", "suspected_medicine", "suspected_medicine_notes", "allergic_reaction", "reaction_description", "symptomatic_relief", "onset_period", "severity", "outcome", "created_at"]),
      },
      med_changes: {
        name: "Medication Changes",
        header: [
          "participant_code",
          "visit",
          "medication_name", "previous_regimen", "new_regimen", "previous_dose", "new_dose", "frequency_change", "route_change", "modification_details", "change_description", "reason", "change_date", "change_period", "researcher_notes", "additional_details",
        ],
        rows: pick(medChanges, ["milestone", "medication_name", "previous_regimen", "new_regimen", "previous_dose", "new_dose", "frequency_change", "route_change", "modification_details", "change_description", "reason", "change_date", "change_period", "researcher_notes", "additional_details"]),
      },
      drp_outcomes: {
        name: "DRP Follow-up Outcomes",
        header: [
          "participant_code",
          "drp_ref",
          "visit",
          "visit_status",
          "pcne_outcome_code",
          "notes",
          "recorded_at",
        ],
        rows: drpOutcomes.map((o) => [
          pc(o),
          ref(o["drp_id"]),
          ...["milestone", "visit_status", "pcne_outcome_code", "notes", "recorded_at"].map((c) => val(o[c])),
        ]),
      },
      medications: {
        name: "Medications",
        header: [
          "participant_code",
          "medication_ref",
          "drug_name",
          "brand_name",
          "generic_name",
          "category",
          "dose",
          "dose_unit",
          "frequency",
          "dosing_schedule",
          "route",
          "indication",
          "for_neuropathic_pain",
          "non_pharm_measures",
          "start_date",
          "stop_date",
          "is_current",
          "recorded_at",
        ],
        rows: medications.map((m) => [
          pc(m),
          ref(m.id),
          ...[
            "drug_name",
            "brand_name",
            "generic_name",
            "category",
            "dose",
            "dose_unit",
            "frequency",
            "dosing_schedule",
            "route",
            "indication",
            "for_neuropathic_pain",
            "non_pharm_measures",
            "start_date",
            "stop_date",
            "is_current",
            "recorded_at",
          ].map((c) => val(m[c])),
        ]),
      },
      interactions: {
        name: "Drug interactions",
        header: [
          "participant_code",
          "visit",
          "drug_a",
          "drug_b",
          "severity",
          "mechanism",
          "management",
          "source",
          "documentation_notes",
          "identified_at",
        ],
        rows: pick(interactions, [
          "milestone",
          "drug_a",
          "drug_b",
          "severity",
          "mechanism",
          "management",
          "source",
          "documentation_notes",
          "identified_at",
        ]),
      },
      drps: {
        name: "DRPs (PCNE)",
        header: [
          "participant_code",
          "drp_ref",
          "medication_ref",
          "visit",
          "problem_type",
          "pcne_version",
          "problem_code",
          "cause_codes",
          "intervention_codes",
          "acceptance_code",
          "outcome_code",
          "description",
          "status",
          "identified_at",
          "resolved_at",
          "resolution_notes",
          "suspected_medication",
          "clinical_details",
          "researcher_observations",
          "cause_details",
          "intervention_details",
          "physician_communication",
          "physician_response_notes",
          "action_taken",
          "outcome_notes",
          "follow_up_observations",
          "additional_comments",
        ],
        rows: drps.map((d) => [
          pc(d),
          ref(d.id),
          ref(d.medication_id),
          ...["milestone", "problem_type", "pcne_version", "pcne_problem_code"].map((c) =>
            val(d[c]),
          ),
          list(d.pcne_cause_codes),
          list(d.pcne_intervention_codes),
          ...[
            "pcne_acceptance_code",
            "pcne_outcome_code",
            "description",
            "status",
            "identified_at",
            "resolved_at",
            "resolution_notes",
            "suspected_medication",
            "clinical_details",
            "researcher_observations",
            "cause_details",
            "intervention_details",
            "physician_communication",
            "physician_response_notes",
            "action_taken",
            "outcome_notes",
            "follow_up_observations",
            "additional_comments",
          ].map((c) => val(d[c])),
        ]),
      },
      recommendations: {
        name: "Physician recommendations",
        header: [
          "participant_code",
          "drp_ref",
          "recommendation",
          "communicated_at",
          "communication_mode",
          "acceptance_status",
          "physician_response",
          "responded_at",
          "created_at",
        ],
        rows: recommendations.map((r) => [
          pc(r),
          ref(r.drp_id),
          ...[
            "recommendation",
            "communicated_at",
            "communication_mode",
            "acceptance_status",
            "physician_response",
            "responded_at",
            "created_at",
          ].map((c) => val(r[c])),
        ]),
      },
      counselling: {
        name: "Counselling",
        header: [
          "participant_code",
          "visit",
          "session_date",
          "duration_minutes",
          "recipient",
          "topics",
          "materials_provided",
          "checklist",
          "notes",
        ],
        rows: pick(
          counselling,
          [
            "milestone",
            "session_date",
            "duration_minutes",
            "recipient",
            "topics",
            "materials_provided",
            "checklist",
            "notes",
          ],
          ["topics", "materials_provided"],
        ),
      },
      follow_ups: {
        name: "Follow-up contacts",
        header: [
          "participant_code",
          "visit",
          "status",
          "scheduled_for",
          "contacted_at",
          "contact_mode",
          "outcome",
          "missed_doses",
          "missed_dose_details",
          "missed_dose_reason",
          "adherence_notes",
          "admission_er",
          "admission_date",
          "admission_details",
          "notes",
        ],
        rows: pick(followUps, [
          "milestone",
          "status",
          "scheduled_for",
          "contacted_at",
          "contact_mode",
          "outcome",
          "missed_doses",
          "missed_dose_details",
          "missed_dose_reason",
          "adherence_notes",
          "admission_er",
          "admission_date",
          "admission_details",
          "notes",
        ]),
      },
    };

    // Summary sheets reuse the same aggregation as the dashboard/analytics pages.
    const A = computeAnalytics(
      {
        participants,
        randomizations,
        milestones,
        assessments,
        demographics,
        clinical,
        medications,
        interactions,
        drps,
        recommendations,
        counselling,
        followUps,
        audit: [],
      },
      { group: "all", status: "all", from: null, to: null },
    );
    const VL: Record<string, string> = { baseline: "Baseline", day_15: "Day 15", day_30: "Day 30" };
    const nOf = (rows: OutcomeRow[], v: string) =>
      rows.filter((r) => r.visit === v).reduce((s, r) => s + r.stats.n, 0);
    const T = A.totals;
    data["study_summary"] = {
      name: "Study Summary",
      header: ["Section", "Metric", "Value", "Status"],
      rows: [
        ...(
          [
            ["Participants", T.participants],
            ["Screened", T.screened],
            ["Eligible", T.eligible],
            ["Consented", T.consented],
            ["Enrolled", T.enrolled],
            ["Baseline completed", T.baseline],
            ["Randomised", T.randomised],
            ["Control", T.control],
            ["Intervention", T.intervention],
            ["Withdrawn", T.withdrawn],
          ] as [string, number][]
        ).map(([m, v]): CellValue[] => ["Flow (cumulative)", m, v, "Recorded"]),
        ["Follow-up", "Day 15 completed", T.day15, "Recorded"],
        ["Follow-up", "Day 30 completed", T.day30, "Recorded"],
        ["Follow-up", "Overdue", PENDING_PROTOCOL, "Requires protocol-defined visit window"],
        ...(
          [
            ["Total", A.drp.total],
            ["Potential", A.drp.potential],
            ["Manifest", A.drp.manifest],
            ["Resolved", A.drp.resolved],
            ["Unresolved", A.drp.unresolved],
          ] as [string, number][]
        ).map(([m, v]): CellValue[] => ["DRPs", m, v, "Recorded"]),
        ["DRPs", "Resolution rate", PENDING_PROTOCOL, "Pending"],
        ["DRPs", "Physician acceptance rate", PENDING_PROTOCOL, "Pending"],
        ...VISITS.map((v): CellValue[] => [
          "Outcome availability (randomised)",
          `${VL[v]} NRS`,
          nOf(A.nrs, v),
          "Recorded",
        ]),
        ...VISITS.map((v): CellValue[] => [
          "Outcome availability (randomised)",
          `${VL[v]} NePIQoL`,
          nOf(A.nepiqol, v),
          `PROVISIONAL — ${NEPIQOL_MAPPING_STATUS}`,
        ]),
      ],
    };
    const outRows = (instr: string, rows: OutcomeRow[], status: string): CellValue[][] =>
      ARMS.flatMap((g) =>
        VISITS.map((v) => {
          const r = rows.find((x) => x.group === g && x.visit === v)!;
          return [
            instr,
            g,
            VL[v]!,
            r.stats.n,
            r.stats.mean,
            r.stats.sd,
            r.stats.median,
            r.change ? r.change.n : null,
            r.change ? r.change.mean : null,
            r.change ? r.change.sd : null,
            r.stats.n === 0 ? "Insufficient recorded data" : status,
          ];
        }),
      );
    data["outcome_summary"] = {
      name: "Outcome Summary",
      header: [
        "Instrument",
        "Group",
        "Visit",
        "n",
        "Mean",
        "SD",
        "Median",
        "Paired change n",
        "Mean change from baseline",
        "SD of change",
        "Status",
      ],
      rows: [
        ...outRows("NRS", A.nrs, "Recorded"),
        ...outRows("NePIQoL total", A.nepiqol, `PROVISIONAL — ${NEPIQOL_MAPPING_STATUS}`),
      ],
    };
    const cnt = (
      section: string,
      items: { key: string; label: string; count: number }[],
    ): CellValue[][] => items.map((i) => [section, i.key, i.label, i.count]);
    data["drp_summary"] = {
      name: "DRP Summary",
      header: ["Section", "Code / category", "Label", "Count"],
      rows: [
        ["Totals", "total", "Total DRPs", A.drp.total],
        ["Totals", "potential", "Potential", A.drp.potential],
        ["Totals", "manifest", "Manifest", A.drp.manifest],
        ["Totals", "unclassified", "Type not recorded", A.drp.unclassified],
        ["Totals", "resolved", "Resolved", A.drp.resolved],
        ["Totals", "unresolved", "Unresolved", A.drp.unresolved],
        ["Totals", "participants", "Participants with ≥1 DRP", A.drp.participantsWithDrp],
        ...cnt("PCNE problem", A.drp.problems),
        ...cnt("PCNE cause", A.drp.causes),
        ...cnt("PCNE intervention", A.drp.interventions),
        ...cnt("PCNE acceptance", A.drp.acceptance),
        ...cnt("Physician recommendation acceptance", A.drp.recommendationAcceptance),
        ["Rates", "resolution_rate", "Resolution rate", PENDING_PROTOCOL],
        ["Rates", "acceptance_rate", "Physician acceptance rate", PENDING_PROTOCOL],
        ["Note", "pcne", "PCNE V9.1 code verification pending", null],
      ],
    };
    data["completeness"] = {
      name: "Data Completeness",
      header: [
        "Metric",
        "Denominator",
        "Eligible denominator",
        "Recorded",
        "Missing",
        "Completeness %",
      ],
      rows: A.completeness.map((c) => [
        c.label,
        c.denominatorLabel,
        c.ratio.denominator,
        c.ratio.numerator,
        c.ratio.denominator - c.ratio.numerator,
        c.ratio.pct,
      ]),
    };
    const dictionary: Sheet = {
      name: "Data Dictionary",
      header: ["Sheet", "Row grain", "Key identifier", "Status", "Notes / limitations"],
      rows: EXPORT_SHEETS.map((s) => [
        s.label,
        GRAIN[s.key] ?? "",
        s.key.endsWith("summary") || s.key === "completeness" ? "—" : "participant_code",
        s.status === "provisional"
          ? "PROVISIONAL"
          : s.status === "pending"
            ? "PENDING"
            : "Recorded",
        s.note,
      ]),
    };

    const generatedAt = new Date().toISOString();
    const about: Sheet = {
      name: "About this export",
      header: ["Item", "Value"],
      rows: [
        ["NeuroCare Connect", "Research Data Export"],
        ["Export type", "Research dataset"],
        ["Generated at (UTC)", generatedAt],
        ["Participants", participants.length],
        ["Identifier", "participant_code (study code). Internal account IDs are not exported."],
        [
          "Excluded",
          "Passwords, tokens, staff/user account IDs, profiles, roles and session logs.",
        ],
        ...EXPORT_SHEETS.map((s): CellValue[] => [
          `Sheet: ${s.label}`,
          `${s.status.toUpperCase()} — ${s.note}`,
        ]),
        ...EXPORT_PENDING_COLUMNS.map((c): CellValue[] => ["Not exported", c]),
        ["Protocol status", PENDING_PROTOCOL + " for all items marked PROVISIONAL."],
      ],
    };

    const sheets = [about, dictionary, ...EXPORT_SHEETS.map((s) => data[s.key]!)];
    const bytes = buildXlsx(sheets);

    const { error: auditError } = await supabase.from("audit_events").insert({
      actor_id: context.userId,
      entity_type: "export",
      action: "research_export_generated",
      metadata: {
        participants: participants.length,
        sheets: sheets.length,
        generated_at: generatedAt,
      },
    });
    if (auditError) console.error("[export] audit:", auditError);

    return {
      filename: `neurocare-${input.dataset === "test" ? "TEST-DATA" : input.dataset === "all" ? "ALL-RECORDS-DEV" : "research"}-export-${generatedAt.slice(0, 10)}.xlsx`,
      fileBase64: toBase64(bytes),
      participantCount: participants.length,
      sheets: EXPORT_SHEETS.map((s) => ({ label: s.label, rows: data[s.key]!.rows.length })),
    };
  });
