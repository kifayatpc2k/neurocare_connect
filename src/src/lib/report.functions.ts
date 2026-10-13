import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { toBase64 } from "@/lib/xlsx";
import { renderReport } from "@/lib/pdf-report";
import { buildReportBlocks, type Row } from "@/lib/report-model";

export type StudyReportResult = { filename: string; fileBase64: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Research-staff-only patient study report (PDF).
 * 1) signed-in (middleware) 2) research staff (is_research_staff via caller's
 * RLS client) 3) participant must exist and be visible under RLS 4) every query
 * is constrained to that participant ID server-side 5) PDF built only from that
 * authorised dataset. Read-only: no study record is modified; one audit row is written.
 */
export const generateStudyReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { participantId: string }) => {
    if (!input || typeof input.participantId !== "string" || !UUID.test(input.participantId))
      throw new Error("Invalid participant reference.");
    return { participantId: input.participantId };
  })
  .handler(async ({ data, context }): Promise<StudyReportResult> => {
    const supabase = context.supabase;
    const { data: isStaff, error: roleError } = await supabase.rpc("is_research_staff", { _user_id: context.userId });
    if (roleError) { console.error("[report] role:", roleError); throw new Error("Could not confirm research access."); }
    if (isStaff !== true) throw new Error("Research staff permission is required.");

    const pid = data.participantId;
    const { data: p, error: pErr } = await supabase
      .from("participants")
      .select("id, participant_code, site, study_group, status, lifecycle_stage, screening_date, eligibility_status, inclusion_criteria_met, exclusion_criteria_present, screening_notes, consent_status, consent_date, consent_confirmed, consent_notes, enrolment_confirmed, enrolled_at, enrolment_notes, baseline_completed_at, randomized_at, day_15_opened_at, day_15_completed_at, day_30_completed_at, non_completion_reason, last_contact_date, completion_notes, notes, is_test_record, created_at")
      .eq("id", pid)
      .maybeSingle();
    if (pErr) { console.error("[report] participant:", pErr); throw new Error("Could not load the participant record."); }
    if (!p) throw new Error("Participant record not found.");

    const read = async (name: string, q: PromiseLike<{ data: unknown; error: { message: string } | null }>) => {
      const { data: rows, error } = await q;
      if (error) { console.error(`[report] ${name}:`, error); throw new Error("Could not load the participant record."); }
      return (rows ?? []) as Row[];
    };
    const [rand, milestones, assessments, demo, clinical, meds, interactions, drps, counselling, followUps, overrides, lab, adrs, medChanges, drpOutcomes] = await Promise.all([
      read("randomisation", supabase.from("randomizations").select("study_group, method, assigned_at").eq("participant_id", pid)),
      read("milestones", supabase.from("participant_milestones").select("milestone, status, due_date, started_at, completed_at").eq("participant_id", pid)),
      read("assessments", supabase.from("assessments").select("milestone, instrument, status, conducted_at, responses").eq("participant_id", pid).order("conducted_at")),
      read("demographics", supabase.from("demographics").select("age_years, sex, height_cm, weight_kg, education_level, occupation, residence, socioeconomic_status, ip_number, op_number, patient_type, ward_unit, admission_date, discharge_date, city, district, state, preferred_language, caregiver_name, caregiver_relationship, caregiver_height_cm, caregiver_weight_kg, caregiver_bp, caregiver_ecg_notes, bed_number, habits, updated_at").eq("participant_id", pid)),
      read("clinical", supabase.from("clinical_data").select("primary_diagnosis, provisional_diagnosis, final_diagnosis, diagnosis_date, treating_neurologist, pain_site, pain_distribution, pain_duration_months, pain_onset_date, presenting_complaints, history_present_illness, past_medical_history, past_surgical_history, family_history, comorbidities, allergies, lifestyle_notes, bp_systolic, bp_diastolic, pulse_rate, temperature_c, respiratory_rate, spo2, examination, clinical_notes, recorded_at, updated_at").eq("participant_id", pid)),
      read("medications", supabase.from("medications").select("id, drug_name, brand_name, generic_name, category, dose, dose_unit, frequency, dosing_schedule, route, indication, for_neuropathic_pain, non_pharm_measures, start_date, stop_date, is_current, recorded_at").eq("participant_id", pid).order("recorded_at")),
      read("interactions", supabase.from("drug_interactions").select("milestone, drug_a, drug_b, severity, mechanism, management, source, documentation_notes, identified_at").eq("participant_id", pid).order("identified_at")),
      read("drps", supabase.from("drps").select("id, medication_id, milestone, problem_type, pcne_version, pcne_problem_code, pcne_cause_codes, pcne_intervention_codes, pcne_acceptance_code, pcne_outcome_code, description, status, identified_at, resolved_at, resolution_notes, suspected_medication, clinical_details, researcher_observations, cause_details, intervention_details, physician_communication, physician_response_notes, action_taken, outcome_notes, follow_up_observations, additional_comments").eq("participant_id", pid).order("identified_at")),
      read("counselling", supabase.from("counselling_sessions").select("milestone, session_date, duration_minutes, recipient, topics, materials_provided, checklist, notes").eq("participant_id", pid).order("session_date")),
      read("follow-ups", supabase.from("follow_ups").select("milestone, status, scheduled_for, contacted_at, contact_mode, outcome, missed_doses, missed_dose_details, missed_dose_reason, adherence_notes, admission_er, admission_date, admission_details, notes").eq("participant_id", pid)),
      read("allocation overrides", supabase.from("allocation_overrides").select("previous_group, new_group, reason, overridden_at").eq("participant_id", pid).order("overridden_at")),
      read("laboratory investigations", supabase.from("laboratory_investigations").select("category, investigation_name, result, unit, reference_range, investigation_date, notes").eq("participant_id", pid).order("investigation_date")),
      read("ADR reports", supabase.from("adr_reports").select("kind, milestone, medication_id, suspected_medicine, suspected_medicine_notes, allergic_reaction, reaction_description, symptomatic_relief, onset_period, severity, outcome, created_at").eq("participant_id", pid).order("created_at")),
      read("medication changes", supabase.from("medication_changes").select("milestone, medication_name, previous_regimen, new_regimen, previous_dose, new_dose, frequency_change, route_change, modification_details, change_description, reason, change_date, change_period, researcher_notes, additional_details").eq("participant_id", pid).order("created_at")),
      read("DRP visit outcomes", supabase.from("drp_visit_outcomes").select("drp_id, milestone, visit_status, pcne_outcome_code, notes, recorded_at").eq("participant_id", pid).order("recorded_at")),
    ]);
    // Recommendations are reachable only through this participant's own DRPs.
    const drpIds = drps.map((d) => d.id as string);
    const recs = drpIds.length
      ? await read("recommendations", supabase.from("physician_recommendations").select("drp_id, recommendation, communicated_at, communication_mode, acceptance_status, physician_response, responded_at, created_at").eq("participant_id", pid).in("drp_id", drpIds).order("created_at"))
      : [];


    const now = new Date();
    const generatedAt = `${now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })} ${now.toISOString().slice(11, 16)} UTC`;
    const { cover, blocks, studyCode: code, synthetic } = buildReportBlocks({
      participant: p as Row, randomizations: rand, milestones, assessments, demographics: demo, clinical, medications: meds, interactions, drps,
      counselling, followUps, overrides, laboratory: lab, adrs, medicationChanges: medChanges, drpOutcomes, recommendations: recs,
    }, generatedAt);

    const bytes = await renderReport({ title: "Clinical Research Participant Report", subtitle: "Clinical Research Participant Report — Pharm.D neuropathic pain study", studyCode: code, generatedAt, synthetic }, cover, blocks);


    const { error: auditError } = await supabase.from("audit_events").insert({
      actor_id: context.userId,
      entity_type: "participant",
      entity_id: pid,
      action: "patient_study_report_generated",
      metadata: { participant_code: code, generated_at: now.toISOString() },
    });
    if (auditError) console.error("[report] audit:", auditError);

    return { filename: `NeuroCare_Study_Report_${code.replace(/[^A-Za-z0-9_-]/g, "_")}.pdf`, fileBase64: toBase64(bytes) };
  });
