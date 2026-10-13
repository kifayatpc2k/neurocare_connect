import { splitByDataset, type Dataset } from "@/lib/test-records";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeAnalytics, type Analytics, type Raw } from "@/lib/analytics";

const filtersSchema = z.object({
  group: z.enum(["all", "control", "intervention"]).default("all"),
  status: z.enum(["all", "screening", "enrolled", "withdrawn", "completed"]).default("all"),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .default(null),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .default(null),
  activityLimit: z.number().int().min(1).max(100).default(12),
  // Official reporting default is "study"; "test"/"all" are explicit development views.
  dataset: z.enum(["study", "test", "all"]).default("study"),
});

/**
 * Research dashboard + analytics aggregates. Checks research staff through the
 * caller's RLS client, reads only through that client, and returns aggregates
 * only — never raw participant rows or account identifiers.
 */
export const getResearchAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => filtersSchema.parse(input ?? {}))
  .handler(
    async ({ context, data }): Promise<Analytics & { testRecordsExcluded: number; dataset: Dataset }> => {
    const supabase = context.supabase;
    const { data: isStaff, error: roleError } = await supabase.rpc("is_research_staff", {
      _user_id: context.userId,
    });
    if (roleError) {
      console.error("[analytics] role check:", roleError);
      throw new Error("Could not confirm research access.");
    }
    if (isStaff !== true) throw new Error("Research staff permission is required.");

    const read = async (
      name: string,
      query: PromiseLike<{ data: unknown; error: { message: string } | null }>,
    ) => {
      const { data: rows, error } = await query;
      if (error) {
        console.error(`[analytics] ${name}:`, error);
        throw new Error(`Could not read ${name}.`);
      }
      return (rows ?? []) as Record<string, unknown>[];
    };

    const [
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
      audit,
    ] = await Promise.all([
      read(
        "participants",
        supabase
          .from("participants")
          .select(
            "id, is_test_record, participant_code, status, study_group, lifecycle_stage, eligibility_status, consent_status, screening_date, consent_date, enrolled_at, baseline_completed_at, randomized_at, day_15_opened_at, day_15_completed_at, day_30_completed_at, created_at",
          ),
      ),
      read("randomisation", supabase.from("randomizations").select("participant_id, study_group")),
      read(
        "milestones",
        supabase.from("participant_milestones").select("participant_id, milestone, status"),
      ),
      read(
        "assessments",
        supabase
          .from("assessments")
          .select("participant_id, milestone, instrument, status, conducted_at, responses"),
      ),
      read("demographics", supabase.from("demographics").select("participant_id")),
      read("clinical data", supabase.from("clinical_data").select("participant_id")),
      read("medications", supabase.from("medications").select("participant_id, is_current")),
      read(
        "drug interactions",
        supabase.from("drug_interactions").select("participant_id, severity"),
      ),
      read(
        "DRPs",
        supabase
          .from("drps")
          .select(
            "participant_id, problem_type, status, pcne_problem_code, pcne_cause_codes, pcne_intervention_codes, pcne_acceptance_code, identified_at",
          ),
      ),
      read(
        "physician recommendations",
        supabase
          .from("physician_recommendations")
          .select("participant_id, acceptance_status, created_at"),
      ),
      read(
        "counselling",
        supabase.from("counselling_sessions").select("participant_id, milestone, session_date"),
      ),
      read(
        "follow-ups",
        supabase.from("follow_ups").select("participant_id, milestone, contacted_at"),
      ),
      read(
        "activity",
        supabase
          .from("audit_events")
          .select("action, entity_id, created_at")
          .in("action", ["research_export_generated", "patient_study_report_generated"])
          .order("created_at", { ascending: false })
          .limit(100),
      ),
    ]);

    // Dataset scope is explicit: official reporting uses "study"; development
    // views must opt in to "test" or "all".
    const split = splitByDataset(
      participants,
      {
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
      },
      data.dataset,
    );
    const raw: Raw = { participants: split.participants, ...split.children, audit };
    const { activityLimit, dataset, ...filters } = data;
    return {
      ...computeAnalytics(raw, filters, activityLimit),
      testRecordsExcluded: split.excludedCount,
      dataset,
    };
  });
