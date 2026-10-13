import { isVisitOpen } from "@/lib/lifecycle";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { codesOf, DN4_ITEM_COUNT, NEPIQOL_ITEM_COUNT, PCNE_ACCEPTANCE, PCNE_CAUSES, PCNE_INTERVENTIONS, PCNE_OUTCOMES, PCNE_PROBLEMS } from "@/lib/instruments";

const uuid = z.string().uuid();
const visit = z.enum(["baseline", "day_15", "day_30"]);
const table = z.enum(["demographics", "clinical_data", "medications", "drug_interactions", "drps", "counselling_sessions", "physician_recommendations", "follow_ups", "laboratory_investigations", "adr_reports", "medication_changes", "drp_visit_outcomes"]);
// A habit entry may arrive with only an answer selected (no details typed yet) — absent values are stored as null,
// never coerced to "no"; details are free text (any characters) and kept even if the answer later changes.
const habit = z.object({
  status: z.enum(["yes", "no", "unknown"]).nullish().transform((v) => v ?? null),
  details: z.string().max(2000).nullish().transform((v) => v ?? null),
});
const habitsSchema = z.object({ nicotine: habit, caffeine: habit, alcohol: habit, tobacco: habit, gutkha: habit }).partial();
const adrText = z.string().max(20000).nullish().transform((v) => (v == null || v.trim() === "" ? null : v));
const examSchema =  z.record(z.enum(["general", "cns", "pa", "cvs", "rs", "gu", "heent", "extremities", "other"]), z.string().max(2000).nullable());
const schemas = {
  demographics: z.object({ age_years: z.number().int().min(0).max(120).nullable(), sex: z.string().max(100).nullable(), height_cm: z.number().positive().max(300).nullable(), weight_kg: z.number().positive().max(500).nullable(), education_level: z.string().max(200).nullable(), occupation: z.string().max(200).nullable(), residence: z.string().max(200).nullable(), socioeconomic_status: z.string().max(200).nullable(), ip_number: z.string().max(100).nullable(), op_number: z.string().max(100).nullable(), patient_type: z.enum(["IPD", "OPD"]).nullable(), ward_unit: z.string().max(200).nullable(), bed_number: z.string().max(100).nullable(), admission_date: z.string().nullable(), discharge_date: z.string().nullable(), contact_number: z.string().max(50).nullable(), alt_contact_number: z.string().max(50).nullable(), address: z.string().max(1000).nullable(), city: z.string().max(200).nullable(), district: z.string().max(200).nullable(), state: z.string().max(200).nullable(), postal_code: z.string().max(20).nullable(), preferred_language: z.string().max(100).nullable(), caregiver_name: z.string().max(200).nullable(), caregiver_relationship: z.string().max(200).nullable(), caregiver_contact: z.string().max(50).nullable(), caregiver_height_cm: z.number().positive().max(300).nullable(), caregiver_weight_kg: z.number().positive().max(500).nullable(), caregiver_bp: z.string().max(50).nullable(), caregiver_ecg_notes: z.string().max(2000).nullable(), habits: habitsSchema }),
  clinical_data: z.object({ primary_diagnosis: z.string().max(500).nullable(), pain_duration_months: z.number().int().min(0).max(1200).nullable(), comorbidities: z.array(z.string().max(200)).max(30), allergies: z.array(z.string().max(200)).max(30), clinical_notes: z.string().max(5000).nullable(), treating_neurologist: z.string().max(200).nullable(), provisional_diagnosis: z.string().max(500).nullable(), final_diagnosis: z.string().max(500).nullable(), diagnosis_date: z.string().nullable(), pain_site: z.string().max(300).nullable(), pain_distribution: z.string().max(300).nullable(), pain_onset_date: z.string().nullable(), presenting_complaints: z.string().max(5000).nullable(), history_present_illness: z.string().max(5000).nullable(), past_medical_history: z.string().max(5000).nullable(), past_surgical_history: z.string().max(5000).nullable(), family_history: z.string().max(5000).nullable(), bp_systolic: z.number().int().min(40).max(300).nullable(), bp_diastolic: z.number().int().min(20).max(200).nullable(), pulse_rate: z.number().int().min(20).max(250).nullable(), temperature_c: z.number().min(25).max(45).nullable(), respiratory_rate: z.number().int().min(4).max(80).nullable(), spo2: z.number().int().min(50).max(100).nullable(), examination: examSchema }),
  medications: z.object({ drug_name: z.string().trim().min(1).max(250), dose: z.string().max(200).nullable(), frequency: z.string().max(200).nullable(), route: z.string().max(200).nullable(), indication: z.string().max(500).nullable(), start_date: z.string().nullable(), stop_date: z.string().nullable(), is_current: z.boolean(), brand_name: z.string().max(250).nullable(), generic_name: z.string().max(250).nullable(), dose_unit: z.string().max(50).nullable(), dosing_schedule: z.string().max(300).nullable(), category: z.enum(["prescribed", "otc", "self_medication", "herbal_traditional", "other"]).nullable(), for_neuropathic_pain: z.boolean().nullable(), non_pharm_measures: z.string().max(2000).nullable() }),
  laboratory_investigations: z.object({ category: z.enum(["renal", "liver", "glucose", "ecg", "xray", "ct_usg", "mri", "culture_sensitivity", "biopsy", "other"]), investigation_name: z.string().trim().min(1).max(300), result: z.string().max(500).nullable(), unit: z.string().max(50).nullable(), reference_range: z.string().max(200).nullable(), investigation_date: z.string().nullable(), notes: z.string().max(5000).nullable() }),
  // ADR fields are unrestricted free text (stored in unbounded text columns); 20k is only an abuse guard. The medication
  // link is optional — absent/empty becomes null, never a fake ID.
  adr_reports: z.object({ kind: adrText, milestone: visit.nullish().transform((v) => v ?? null), medication_id: z.union([uuid, z.literal("")]).nullish().transform((v) => v || null), suspected_medicine: adrText, suspected_medicine_notes: adrText, allergic_reaction: adrText, reaction_description: z.string().max(20000).refine((v) => v.trim().length > 0, "Reaction description is required."), symptomatic_relief: adrText, onset_period: adrText, severity: adrText, outcome: adrText }),
  // Medication changes are free text; the medication link is optional (absent/empty -> null, never a fake ID).
  medication_changes: z.object({ milestone: z.enum(["day_15", "day_30"]), medication_id: z.union([uuid, z.literal("")]).nullish().transform((v) => v || null), medication_name: z.string().max(20000, "Medication name is limited to 20,000 characters.").refine((v) => v.trim().length > 0, "Medication name is required."), previous_dose: adrText, new_dose: adrText, previous_regimen: adrText, new_regimen: adrText, frequency_change: adrText, route_change: adrText, modification_details: adrText, change_description: adrText, reason: adrText, change_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish().or(z.literal("")).transform((v) => v || null), change_period: adrText, researcher_notes: adrText, additional_details: adrText }),
  drp_visit_outcomes: z.object({ drp_id: uuid, milestone: z.enum(["day_15", "day_30"]), visit_status: z.enum(["new", "continuing", "resolved", "unresolved", "not_assessed"]), pcne_outcome_code: z.enum(codesOf(PCNE_OUTCOMES)).nullable(), notes: z.string().max(5000).nullable() }),
  drug_interactions: z.object({ drug_a: z.string().max(20000).refine((v) => v.trim().length > 0, "First medication is required."), drug_b: z.string().max(20000).refine((v) => v.trim().length > 0, "Second medication is required."), severity: adrText, mechanism: adrText, management: adrText, documentation_notes: adrText, milestone: visit.nullish().transform((v) => v ?? null) }),
  drps: z.object({ milestone: visit.nullish().transform((v) => v ?? null), suspected_medication: adrText, clinical_details: adrText, cause_details: adrText, researcher_observations: adrText, intervention_details: adrText, physician_communication: adrText, physician_response_notes: adrText, action_taken: adrText, outcome_notes: adrText, follow_up_observations: adrText, additional_comments: adrText, problem_type: z.enum(["potential", "manifest"]), pcne_problem_code: z.enum(codesOf(PCNE_PROBLEMS)), pcne_cause_codes: z.array(z.enum(codesOf(PCNE_CAUSES))).max(20), pcne_intervention_codes: z.array(z.enum(codesOf(PCNE_INTERVENTIONS))).max(20), pcne_acceptance_code: z.enum(codesOf(PCNE_ACCEPTANCE)).nullable(), pcne_outcome_code: z.enum(codesOf(PCNE_OUTCOMES)).nullable(), description: z.string().max(20000, "Problem description is limited to 20,000 characters.").refine((v) => v.trim().length > 0, "Describe the problem."), status: z.enum(["open", "resolved"]), resolution_notes: adrText }),
  counselling_sessions: z.object({ milestone: visit, session_date: z.string(), duration_minutes: z.number().int().positive().max(1440).nullable(), recipient: z.enum(["patient", "caregiver", "both"]).nullable(), topics: z.array(z.string().max(250)).max(30), materials_provided: z.array(z.string().max(250)).max(30), notes: z.string().max(5000).nullable(), checklist: z.record(z.string(), z.union([z.boolean(), z.object({ covered: z.boolean(), teach_back: z.boolean() })])) }),
  physician_recommendations: z.object({ drp_id: uuid, recommendation: z.string().trim().min(1).max(5000), communicated_at: z.string().nullable(), communication_mode: z.string().max(200).nullable(), acceptance_status: z.enum(["pending", "accepted", "not_accepted"]), physician_response: z.string().max(5000).nullable(), responded_at: z.string().nullable() }),
  // Follow-up contact records exist only for Day 15 / Day 30 (the only visits with a follow-up form or PDF section).
  follow_ups: z.object({ milestone: z.enum(["day_15", "day_30"]), scheduled_for: z.string().nullable(), contacted_at: z.string().nullable(), contact_mode: z.string().max(200).nullable(), outcome: z.string().max(2000).nullable(), notes: z.string().max(5000).nullable(), status: z.enum(["pending", "in_progress", "completed"]), missed_doses: z.enum(["yes", "no", "unknown"]).nullable(), missed_dose_details: z.string().max(1000).nullable(), missed_dose_reason: z.string().max(1000).nullable(), adherence_notes: z.string().max(5000).nullable(), admission_er: z.enum(["yes", "no", "unknown"]).nullable(), admission_date: z.string().nullable(), admission_details: z.string().max(2000).nullable() }),
};

function fail(error: { message: string; code?: string } | null, action: string) {
  if (!error) return;
  console.error(`[study] ${action}:`, error);
  throw new Error(error.code === "42501" ? "Research staff permission is required." : error.message);
}

export const getResearchData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { participantId: string }) => z.object({ participantId: uuid }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const { data: participant, error: pe } = await supabase.from("participants").select("id, enrolment_confirmed, study_group, randomized_at, day_15_opened_at, day_15_completed_at, day_30_completed_at").eq("id", data.participantId).single();
    fail(pe, "participant read");
    if (!participant) throw new Error("Participant not found.");
    const orderBy: Record<string, string> = { demographics: "created_at", clinical_data: "recorded_at", follow_ups: "created_at", physician_recommendations: "created_at", counselling_sessions: "created_at", medications: "recorded_at", drps: "identified_at", drug_interactions: "identified_at", laboratory_investigations: "investigation_date", adr_reports: "created_at", medication_changes: "created_at", drp_visit_outcomes: "recorded_at" };
    const entries = await Promise.all(table.options.map(async (name) => {
      const result = await supabase.from(name).select("*").eq("participant_id", data.participantId).order(orderBy[name] ?? "created_at", { ascending: false });
      fail(result.error, `${name} read`);
      return [name, result.data ?? []] as const;
    }));
    const { data: assessments, error: ae } = await supabase.from("assessments").select("*").eq("participant_id", data.participantId);
    fail(ae, "assessments read");
    const { data: randomization, error: re } = await supabase.from("randomizations").select("study_group, method, allocation_seq, assigned_at").eq("participant_id", data.participantId).maybeSingle();
    fail(re, "allocation read");
    return { participant, records: Object.fromEntries(entries) as Record<string, Array<Record<string, string | number | boolean | null | string[] | Record<string, boolean>>>>, assessments: assessments ?? [], randomization };
  });

export const saveResearchRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { participantId: string; table: z.infer<typeof table>; recordId?: string; values: unknown }) => z.object({ participantId: uuid, table, recordId: uuid.optional(), values: z.unknown() }).parse(input))
  .handler(async ({ data, context }) => {
    const parsed = schemas[data.table].safeParse(data.values);
    // Show researchers a readable message, never a raw validation dump.
    if (!parsed.success) throw new Error(parsed.error.issues.map((i) => `${i.path.join(".") || "form"}: ${i.message}`).join("; "));
    const values = parsed.data as Record<string, unknown>;
    const supabase = context.supabase;
    const { data: participant, error: pe } = await supabase.from("participants").select("id, enrolment_confirmed, study_group, baseline_completed_at, randomized_at, day_15_opened_at, day_15_completed_at, day_30_completed_at").eq("id", data.participantId).single();
    fail(pe, "participant validation");
    if (!participant?.enrolment_confirmed) throw new Error("Enroll the participant before recording study data.");
    if ((data.table === "counselling_sessions" || data.table === "physician_recommendations") && participant.study_group !== "intervention") throw new Error("Intervention records require an intervention allocation.");
    if (data.table === "counselling_sessions" && !participant.randomized_at) throw new Error("Randomise before recording counselling.");
    if (data.table === "physician_recommendations" || data.table === "drp_visit_outcomes") {
      const { data: drp, error } = await supabase.from("drps").select("id").eq("id", String(values["drp_id"])).eq("participant_id", data.participantId).maybeSingle();
      fail(error, "DRP validation");
      if (!drp) throw new Error("Choose a DRP belonging to this participant.");
    }
    if ((data.table === "adr_reports" || data.table === "medication_changes") && values["medication_id"]) {
      const { data: med, error } = await supabase.from("medications").select("id").eq("id", String(values["medication_id"])).eq("participant_id", data.participantId).maybeSingle();
      fail(error, "medication validation");
      if (!med) throw new Error("Choose a medication belonging to this participant.");
    }
    // Drug interactions and DRPs may be documented at any time (null = outside scheduled visit); edits keep their visit.
    const anyTime = data.table === "drug_interactions" || data.table === "drps";
    if (anyTime) {
      if (data.recordId) delete values["milestone"];
      else if (values["milestone"] && !isVisitOpen({ enrolmentConfirmed: participant.enrolment_confirmed, baselineCompletedAt: participant.baseline_completed_at, randomizedAt: participant.randomized_at, day15OpenedAt: participant.day_15_opened_at, day15CompletedAt: participant.day_15_completed_at, day30CompletedAt: participant.day_30_completed_at }, values["milestone"] as z.infer<typeof visit>)) values["milestone"] = null;
    }
    const milestone = anyTime ? null : values["milestone"];
    if (milestone === "day_15" && (!participant.randomized_at || !participant.day_15_opened_at || participant.day_15_completed_at)) throw new Error("Day 15 must be open and incomplete.");
    if (milestone === "day_30" && (!participant.day_15_completed_at || participant.day_30_completed_at)) throw new Error("Complete Day 15 before recording Day 30.");
    if (milestone === "baseline" && !participant.enrolment_confirmed) throw new Error("Enroll before Baseline.");
    const authorField: Partial<Record<z.infer<typeof table>, string>> = { drug_interactions: "documented_by", drps: "identified_by", counselling_sessions: "delivered_by", physician_recommendations: "created_by", follow_ups: "recorded_by", laboratory_investigations: "recorded_by", adr_reports: "reported_by", medication_changes: "recorded_by", drp_visit_outcomes: "recorded_by" };
    const tableClient = supabase.from(data.table) as any; // runtime table name and payload are validated by the closed Zod enum and schema
    const payload = { ...values, participant_id: data.participantId, ...(authorField[data.table] && !data.recordId ? { [authorField[data.table] as string]: context.userId } : {}) };
    const result = data.recordId
      ? await tableClient.update(values).eq("id", data.recordId).eq("participant_id", data.participantId).select("*").single()
      : data.table === "demographics" || data.table === "clinical_data" || data.table === "follow_ups"
        ? await tableClient.upsert(payload, { onConflict: data.table === "follow_ups" ? "participant_id,milestone" : "participant_id" }).select("*").single()
        : await tableClient.insert(payload).select("*").single();
    fail(result.error, `${data.table} save`);
    if (!result.data) throw new Error("Save did not return a record.");
    return result.data;
  });

export const saveNrs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { participantId: string; milestone: z.infer<typeof visit>; score: number }) => z.object({ participantId: uuid, milestone: visit, score: z.number().int().min(0).max(10) }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const { data: participant, error: pe } = await supabase.from("participants").select("enrolment_confirmed, baseline_completed_at, randomized_at, day_15_opened_at, day_15_completed_at, day_30_completed_at").eq("id", data.participantId).single();
    fail(pe, "NRS visit validation");
    if (!participant?.enrolment_confirmed || (data.milestone === "baseline" && participant.baseline_completed_at) || (data.milestone === "day_15" && (!participant.day_15_opened_at || participant.day_15_completed_at)) || (data.milestone === "day_30" && (!participant.day_15_completed_at || participant.day_30_completed_at))) throw new Error("This visit is not available for NRS recording.");
    const { data: existing, error: ee } = await supabase.from("assessments").select("id, status").eq("participant_id", data.participantId).eq("milestone", data.milestone).eq("instrument", "NRS").maybeSingle();
    fail(ee, "NRS lookup");
    if (existing?.status === "completed") throw new Error("Completed NRS records cannot be overwritten.");
    const { data: result, error } = await supabase.from("assessments").upsert({ participant_id: data.participantId, milestone: data.milestone, instrument: "NRS", status: "completed", responses: { score: data.score }, conducted_by: context.userId, conducted_at: new Date().toISOString() }, { onConflict: "participant_id,milestone,instrument" }).select("*").single();
    fail(error, "NRS save");
    if (!result) throw new Error("NRS could not be saved.");
    return result;
  });

/** DN4 / NePIQoL completion. Scores are computed by the database trigger, never trusted from the client. */
export const saveQuestionnaire = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { participantId: string; milestone: z.infer<typeof visit>; instrument: "DN4" | "NEPIQoL"; items: Array<boolean | number> }) =>
    z.discriminatedUnion("instrument", [
      z.object({ participantId: uuid, milestone: visit, instrument: z.literal("DN4"), items: z.array(z.boolean()).length(DN4_ITEM_COUNT) }),
      z.object({ participantId: uuid, milestone: visit, instrument: z.literal("NEPIQoL"), items: z.array(z.number().int().min(1).max(5)).length(NEPIQOL_ITEM_COUNT) }),
    ]).parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const { data: existing, error: ee } = await supabase.from("assessments").select("id, status").eq("participant_id", data.participantId).eq("milestone", data.milestone).eq("instrument", data.instrument).maybeSingle();
    fail(ee, `${data.instrument} lookup`);
    if (existing?.status === "completed") throw new Error(`Completed ${data.instrument} records cannot be overwritten.`);
    const { data: result, error } = await supabase.from("assessments").upsert({ participant_id: data.participantId, milestone: data.milestone, instrument: data.instrument, status: "completed", responses: { items: data.items }, conducted_by: context.userId, conducted_at: new Date().toISOString() }, { onConflict: "participant_id,milestone,instrument" }).select("*").single();
    fail(error, `${data.instrument} save`);
    if (!result) throw new Error(`${data.instrument} could not be saved.`);
    await supabase.from("audit_events").insert({ actor_id: context.userId, entity_type: "assessment", entity_id: result.id, action: `${data.instrument.toLowerCase()}_completed`, metadata: { milestone: data.milestone } });
    return result;
  });

/** Study completion details. Completion itself is always derived from the visit records — never from this form. */
export const saveStudyCompletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { participantId: string; nonCompletionReason: string | null; lastContactDate: string | null; completionNotes: string | null }) =>
    z.object({
      participantId: uuid,
      nonCompletionReason: z.string().max(2000).nullable(),
      lastContactDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
      completionNotes: z.string().max(5000).nullable(),
    }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const { data: participant, error: pe } = await supabase.from("participants").select("id, day_15_completed_at, day_30_completed_at").eq("id", data.participantId).single();
    fail(pe, "completion validation");
    if (!participant) throw new Error("Participant not found.");
    const bothDone = Boolean(participant.day_15_completed_at && participant.day_30_completed_at);
    if (bothDone && data.nonCompletionReason) throw new Error("Both follow-ups are complete — a non-completion reason does not apply.");
    const { data: result, error } = await supabase.from("participants").update({
      non_completion_reason: bothDone ? null : data.nonCompletionReason,
      last_contact_date: data.lastContactDate,
      completion_notes: data.completionNotes,
    }).eq("id", data.participantId).select("id").single();
    fail(error, "completion save");
    return result;
  });
