import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { StudyGroup } from "@/lib/study";

/**
 * Restricted randomisation override.
 * Every function re-checks research staff + the `randomisation_override`
 * permission server-side; the database function re-checks again and performs
 * the override, its history row and its audit event in one transaction.
 */

type Ctx = { supabase: any; userId: string };

async function requireOverridePermission({ supabase, userId }: Ctx) {
  const [{ data: isStaff, error: e1 }, { data: allowed, error: e2 }] = await Promise.all([
    supabase.rpc("is_research_staff", { _user_id: userId }),
    supabase.rpc("has_permission", { _user_id: userId, _permission: "randomisation_override" }),
  ]);
  if (e1 || e2) {
    console.error("[allocation] permission check:", e1 ?? e2);
    throw new Error("Could not confirm your permissions.");
  }
  if (isStaff !== true || allowed !== true) {
    throw new Error("Randomisation override permission is required.");
  }
}

export type AllocationEvent = {
  kind: "initial" | "override";
  group: StudyGroup;
  previousGroup: StudyGroup | null;
  at: string;
  reason: string | null;
  method: string | null;
  byName: string | null;
};

export type AllocationRecord = {
  participantId: string;
  participantCode: string;
  status: string;
  randomised: boolean;
  currentGroup: StudyGroup | null;
  originalGroup: StudyGroup | null;
  randomisedAt: string | null;
  overrideCount: number;
  history: AllocationEvent[];
};

export const loadAllocationRecord = (supabase: any, participantId: string) => loadRecord(supabase, participantId);

async function loadRecord(supabase: any, participantId: string): Promise<AllocationRecord | null> {
  const { data: p, error } = await supabase
    .from("participants")
    .select("id, participant_code, status, study_group, randomized_at")
    .eq("id", participantId)
    .maybeSingle();
  if (error) throw new Error("Could not load the participant.");
  if (!p) return null;

  const [{ data: rand, error: rErr }, { data: overrides, error: oErr }] = await Promise.all([
    supabase.from("randomizations").select("study_group, method, assigned_at").eq("participant_id", participantId).maybeSingle(),
    supabase
      .from("allocation_overrides")
      .select("previous_group, new_group, reason, overridden_by, overridden_at")
      .eq("participant_id", participantId)
      .order("overridden_at"),
  ]);
  if (rErr || oErr) throw new Error("Could not load the allocation history.");

  const actorIds = [...new Set((overrides ?? []).map((o: any) => o.overridden_by as string))];
  const names = new Map<string, string>();
  if (actorIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", actorIds);
    for (const pr of profiles ?? []) names.set(pr.id, pr.full_name || pr.email || "Research staff");
  }

  const history: AllocationEvent[] = [];
  if (rand) {
    history.push({ kind: "initial", group: rand.study_group, previousGroup: null, at: rand.assigned_at, reason: null, method: rand.method, byName: null });
  }
  for (const o of overrides ?? []) {
    history.push({
      kind: "override",
      group: o.new_group,
      previousGroup: o.previous_group,
      at: o.overridden_at,
      reason: o.reason,
      method: null,
      byName: names.get(o.overridden_by) ?? "Research staff",
    });
  }

  return {
    participantId: p.id,
    participantCode: p.participant_code,
    status: p.status,
    randomised: Boolean(rand && p.randomized_at && p.study_group),
    currentGroup: p.study_group,
    originalGroup: rand?.study_group ?? null,
    randomisedAt: rand?.assigned_at ?? p.randomized_at ?? null,
    overrideCount: (overrides ?? []).length,
    history,
  };
}

export const searchAllocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ query: z.string().trim().min(1).max(40) }).parse(d))
  .handler(async ({ data, context }) => {
    await requireOverridePermission(context as Ctx);
    const q = data.query.replace(/[%_,()]/g, "");
    const { data: rows, error } = await context.supabase
      .from("participants")
      .select("id, participant_code, study_group, randomized_at")
      .ilike("participant_code", `%${q}%`)
      .order("participant_code")
      .limit(10);
    if (error) throw new Error("Could not search participants.");
    return (rows ?? []).map((r) => ({
      id: r.id,
      participantCode: r.participant_code,
      currentGroup: r.study_group as StudyGroup | null,
      randomised: Boolean(r.randomized_at),
    }));
  });

export const getAllocationRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ participantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireOverridePermission(context as Ctx);
    const record = await loadRecord(context.supabase, data.participantId);
    if (!record) throw new Error("Participant not found.");
    return record;
  });

/** Staff-visible flag only (no history): whether an override exists. */
export const getOverrideStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ participantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { count, error } = await context.supabase
      .from("allocation_overrides")
      .select("id", { count: "exact", head: true })
      .eq("participant_id", data.participantId);
    if (error) return { overridden: false };
    return { overridden: (count ?? 0) > 0 };
  });

export const overrideAllocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        participantId: z.string().uuid(),
        expectedGroup: z.enum(["control", "intervention"]),
        newGroup: z.enum(["control", "intervention"]),
        reason: z.string().trim().min(1, "A reason is required.").max(2000),
        protocolReviewed: z.literal(true, { message: "Confirm the protocol review first." }),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireOverridePermission(context as Ctx);
    const { error } = await context.supabase.rpc("correct_participant_allocation", {
      p_id: data.participantId,
      p_expected_group: data.expectedGroup,
      p_new_group: data.newGroup,
      p_reason: data.reason,
    });
    if (error) {
      console.error("[allocation] override:", error);
      throw new Error(error.message || "The allocation could not be changed.");
    }
    // Return persisted state only.
    const record = await loadRecord(context.supabase, data.participantId);
    if (!record) throw new Error("Participant not found.");
    return record;
  });
