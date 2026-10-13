import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  canPerform,
  deriveStage,
  type ConsentStatus,
  type EligibilityStatus,
  type LifecycleRecord,
  type LifecycleStage,
} from "@/lib/lifecycle";
import type { StudyGroup } from "@/lib/study";

export type Participant = LifecycleRecord & {
  id: string;
  participantCode: string;
  isTestRecord: boolean;
  createdAt: string;
  updatedAt: string;
  site: string | null;
  notes: string | null;
  screeningDate: string | null;
  inclusionCriteriaMet: boolean | null;
  exclusionCriteriaPresent: boolean | null;
  screeningNotes: string | null;
  consentDate: string | null;
  consentConfirmed: boolean;
  consentNotes: string | null;
  enrolmentNotes: string | null;
  nonCompletionReason: string | null;
  lastContactDate: string | null;
  completionNotes: string | null;
};

const SELECT_COLUMNS =
  "id, participant_code, is_test_record, created_at, updated_at, site, notes, study_group, lifecycle_stage, screening_date, eligibility_status, inclusion_criteria_met, exclusion_criteria_present, screening_notes, consent_status, consent_date, consent_confirmed, consent_notes, enrolled_at, enrolment_confirmed, enrolment_notes, baseline_completed_at, randomized_at, day_15_opened_at, day_15_completed_at, day_30_completed_at, non_completion_reason, last_contact_date, completion_notes";

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapRow(row: any): Participant {
  const p = mapRaw(row);
  return { ...p, lifecycleStage: deriveStage(p) };
}
function mapRaw(row: any): Participant {
  return {
    id: row.id,
    participantCode: row.participant_code,
    isTestRecord: Boolean(row.is_test_record),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    site: row.site ?? null,
    notes: row.notes ?? null,
    lifecycleStage: "screening" as LifecycleStage,
    screeningDate: row.screening_date ?? null,
    eligibilityStatus: (row.eligibility_status ?? "pending") as EligibilityStatus,
    inclusionCriteriaMet: row.inclusion_criteria_met ?? null,
    exclusionCriteriaPresent: row.exclusion_criteria_present ?? null,
    screeningNotes: row.screening_notes ?? null,
    consentStatus: (row.consent_status ?? "pending") as ConsentStatus,
    consentDate: row.consent_date ?? null,
    consentConfirmed: Boolean(row.consent_confirmed),
    consentNotes: row.consent_notes ?? null,
    enrolledAt: row.enrolled_at ?? null,
    enrolmentConfirmed: Boolean(row.enrolment_confirmed),
    enrolmentNotes: row.enrolment_notes ?? null,
    baselineCompletedAt: row.baseline_completed_at ?? null,
    randomizedAt: row.randomized_at ?? null,
    studyGroup: (row.study_group ?? null) as StudyGroup | null,
    day15OpenedAt: row.day_15_opened_at ?? null,
    day15CompletedAt: row.day_15_completed_at ?? null,
    day30CompletedAt: row.day_30_completed_at ?? null,
    nonCompletionReason: row.non_completion_reason ?? null,
    lastContactDate: row.last_contact_date ?? null,
    completionNotes: row.completion_notes ?? null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const listParticipants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Participant[]> => {
    const { data, error } = await context.supabase
      .from("participants")
      .select(SELECT_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRow);
  });

export const getParticipant = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }): Promise<Participant> => {
    const { data: row, error } = await context.supabase
      .from("participants")
      .select(SELECT_COLUMNS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Participant not found.");
    return mapRow(row);
  });

/** Screening-only intake — no study group is assigned here by design. */
export const createParticipant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { site?: string; notes?: string; screeningDate?: string; isTestRecord?: boolean }) => input)
  .handler(async ({ data, context }): Promise<Participant> => {
    const { data: latest } = await context.supabase
      .from("participants")
      .select("participant_code")
      .order("created_at", { ascending: false })
      .limit(200);

    let next = 1;
    for (const row of latest ?? []) {
      const match = /NCC-(\d+)/.exec(row.participant_code ?? "");
      if (match?.[1]) next = Math.max(next, Number(match[1]) + 1);
    }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = `NCC-${String(next + attempt).padStart(4, "0")}`;
      const { data: row, error } = await context.supabase
        .from("participants")
        .insert({
          participant_code: code,
          status: "screening",
          lifecycle_stage: "screening",
          created_by: context.userId,
          site: data.site?.trim() || null,
          notes: data.notes?.trim() || null,
          screening_date: data.screeningDate || null,
          is_test_record: data.isTestRecord === true,
        })
        .select(SELECT_COLUMNS)
        .single();
      if (!error && row) return mapRow(row);
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    }
    throw new Error("Could not generate a unique study participant ID. Please try again.");
  });

async function loadRecord(
  supabase: { from: (t: "participants") => any }, // eslint-disable-line @typescript-eslint/no-explicit-any
  id: string,
): Promise<Participant> {
  const { data, error } = await supabase
    .from("participants")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Participant not found.");
  return mapRow(data);
}

/** Logs the underlying database error and returns a researcher-safe message. */
function dbError(action: string, error: { message: string; code?: string }): Error {
  console.error(`[participants] ${action} failed`, error);
  // Messages raised by our own validation triggers are already researcher-friendly.
  if (error.code === "P0001") return new Error(error.message);
  if (error.code === "42501")
    return new Error(`${action} failed: you do not have permission to change this record.`);
  return new Error(`${action} failed: ${error.message}`);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function applyUpdate(
  supabase: any,
  id: string,
  current: Participant,
  patch: Record<string, unknown>,
  action = "Update",
): Promise<Participant> {
  const merged = { ...current, ...(patch["__derive"] as object) } as LifecycleRecord;
  delete (patch as Record<string, unknown>)["__derive"];
  const stage = deriveStage({
    eligibilityStatus: merged.eligibilityStatus,
    consentStatus: merged.consentStatus,
    consentConfirmed: merged.consentConfirmed,
    enrolmentConfirmed: merged.enrolmentConfirmed,
    enrolledAt: merged.enrolledAt,
    baselineCompletedAt: merged.baselineCompletedAt,
    randomizedAt: merged.randomizedAt,
    studyGroup: merged.studyGroup,
    day15OpenedAt: merged.day15OpenedAt,
    day15CompletedAt: merged.day15CompletedAt,
    day30CompletedAt: merged.day30CompletedAt,
  });
  const status =
    stage === "not_eligible"
      ? "withdrawn"
      : stage === "study_completed"
        ? "completed"
        : merged.enrolmentConfirmed
          ? "enrolled"
          : "screening";

  const { data, error } = await supabase
    .from("participants")
    .update({ ...patch, lifecycle_stage: stage, status })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw dbError(action, error);
  if (!data) throw new Error(`${action} failed: the record was not updated. Please reload and try again.`);

  // Re-read the persisted row so the UI only ever shows what the database holds.
  return loadRecord(supabase, id);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const recordScreening = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id: string;
      screeningDate: string | null;
      eligibilityStatus: EligibilityStatus;
      inclusionCriteriaMet: boolean;
      exclusionCriteriaPresent: boolean;
      screeningNotes: string | null;
    }) => input,
  )
  .handler(async ({ data, context }): Promise<Participant> => {
    const current = await loadRecord(context.supabase, data.id);
    const gate = canPerform(current, "screening");
    if (!gate.allowed) throw new Error(gate.reason);
    if (!["pending", "eligible", "not_eligible"].includes(data.eligibilityStatus))
      throw new Error("Invalid eligibility status.");
    return applyUpdate(
      context.supabase,
      data.id,
      current,
      {
        screening_date: data.screeningDate,
        eligibility_status: data.eligibilityStatus,
        inclusion_criteria_met: data.inclusionCriteriaMet,
        exclusion_criteria_present: data.exclusionCriteriaPresent,
        screening_notes: data.screeningNotes,
        __derive: { eligibilityStatus: data.eligibilityStatus },
      },
      "Saving screening",
    );
  });

export const recordConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id: string;
      consentStatus: ConsentStatus;
      consentDate: string | null;
      consentConfirmed: boolean;
      consentNotes: string | null;
    }) => input,
  )
  .handler(async ({ data, context }): Promise<Participant> => {
    const current = await loadRecord(context.supabase, data.id);
    const gate = canPerform(current, "consent");
    if (!gate.allowed) throw new Error(gate.reason);
    if (!["pending", "obtained", "not_obtained"].includes(data.consentStatus))
      throw new Error("Invalid consent status.");
    if (data.consentStatus === "pending" && data.consentConfirmed)
      throw new Error(
        'Consent confirmation is ticked but the consent status is still "Pending". Set the status to "Obtained" to record consent.',
      );
    if (data.consentStatus === "obtained" && !data.consentConfirmed)
      throw new Error("Tick the consent confirmation before marking consent as obtained.");
    if (data.consentStatus === "obtained" && !data.consentDate)
      throw new Error("Enter the consent date before marking consent as obtained.");
    const confirmed = data.consentStatus === "obtained" ? data.consentConfirmed : false;
    return applyUpdate(
      context.supabase,
      data.id,
      current,
      {
        consent_status: data.consentStatus,
        consent_date: data.consentDate,
        consent_confirmed: confirmed,
        consent_notes: data.consentNotes,
        __derive: { consentStatus: data.consentStatus, consentConfirmed: confirmed },
      },
      "Saving consent",
    );
  });

export const recordEnrolment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id: string;
      enrolledAt: string;
      enrolmentConfirmed: boolean;
      enrolmentNotes: string | null;
    }) => input,
  )
  .handler(async ({ data, context }): Promise<Participant> => {
    const current = await loadRecord(context.supabase, data.id);
    const gate = canPerform(current, "enrolment");
    if (!gate.allowed) throw new Error(gate.reason);
    if (!data.enrolledAt) throw new Error("Enrollment blocked: an enrollment date is required.");
    if (!data.enrolmentConfirmed)
      throw new Error("Enrollment blocked: tick the enrollment confirmation.");
    const saved = await applyUpdate(
      context.supabase,
      data.id,
      current,
      {
        enrolled_at: data.enrolledAt,
        enrolment_confirmed: true,
        enrolment_notes: data.enrolmentNotes,
        __derive: { enrolmentConfirmed: true, enrolledAt: data.enrolledAt },
      },
      "Enrollment",
    );
    if (!saved.enrolmentConfirmed)
      throw new Error("Enrollment could not be confirmed in the database. Please try again.");
    return saved;
  });

export const completeBaseline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }): Promise<Participant> => {
    const current = await loadRecord(context.supabase, data.id);
    const gate = canPerform(current, "baseline");
    if (!gate.allowed) throw new Error(gate.reason);
    const now = new Date().toISOString();
    // Participant first, so a refused completion never leaves the progress row marked completed.
    const updated = await applyUpdate(context.supabase, data.id, current, {
      baseline_completed_at: now,
      __derive: { baselineCompletedAt: now },
    });
    const { error: milestoneError } = await context.supabase.from("participant_milestones").upsert(
      { participant_id: data.id, milestone: "baseline", status: "completed", completed_at: now },
      { onConflict: "participant_id,milestone" },
    );
    if (milestoneError) throw new Error(milestoneError.message);
    return updated;
  });

export const randomizeParticipant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }): Promise<Participant> => {
    const current = await loadRecord(context.supabase, data.id);
    const gate = canPerform(current, "randomization");
    if (!gate.allowed) throw new Error(gate.reason);

    const { error } = await context.supabase.rpc("allocate_study_participant", { p_id: data.id });
    if (error) throw new Error(error.message);
    return loadRecord(context.supabase, data.id);
  });

export const completeFollowUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; milestone: "day_15" | "day_30" }) => input)
  .handler(async ({ data, context }): Promise<Participant> => {
    const current = await loadRecord(context.supabase, data.id);
    const gate = canPerform(current, data.milestone);
    if (!gate.allowed) throw new Error(gate.reason);
    const now = new Date().toISOString();
    const column = data.milestone === "day_15" ? "day_15_completed_at" : "day_30_completed_at";
    const derive =
      data.milestone === "day_15" ? { day15CompletedAt: now } : { day30CompletedAt: now };
    // Complete the participant first: the database may still refuse (e.g. a required
    // questionnaire is missing), and the visit-progress row must never claim otherwise.
    const updated = await applyUpdate(context.supabase, data.id, current, {
      [column]: now,
      __derive: derive,
    });
    const { error: milestoneError } = await context.supabase.from("participant_milestones").upsert(
      { participant_id: data.id, milestone: data.milestone, status: "completed", completed_at: now },
      { onConflict: "participant_id,milestone" },
    );
    if (milestoneError) throw new Error(milestoneError.message);
    return updated;
  });

export const openDay15 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }): Promise<Participant> => {
    const current = await loadRecord(context.supabase, data.id);
    const gate = canPerform(current, "day_15_open");
    if (!gate.allowed) throw new Error(gate.reason);
    const now = new Date().toISOString();
    const { error: milestoneError } = await context.supabase.from("participant_milestones").upsert(
      { participant_id: data.id, milestone: "day_15", status: "in_progress", started_at: now },
      { onConflict: "participant_id,milestone" },
    );
    if (milestoneError) throw new Error(milestoneError.message);
    return applyUpdate(context.supabase, data.id, current, {
      day_15_opened_at: now,
      __derive: { day15OpenedAt: now },
    });
  });

export const updateParticipantDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; site: string | null; notes: string | null }) => input)
  .handler(async ({ data, context }): Promise<Participant> => {
    const { data: row, error } = await context.supabase
      .from("participants")
      .update({ site: data.site, notes: data.notes })
      .eq("id", data.id)
      .select(SELECT_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return mapRow(row);
  });
