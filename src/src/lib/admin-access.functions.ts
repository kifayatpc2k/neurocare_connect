import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { loadAllocationRecord } from "@/lib/allocation.functions";
import type { StudyGroup } from "@/lib/study";

/**
 * Admins Access: second, separate sign-in on top of a research session.
 * Every function re-checks research staff + a valid server-side admin session.
 */
type Ctx = { supabase: any; userId: string };

async function requireStaff({ supabase, userId }: Ctx) {
  const { data, error } = await supabase.rpc("is_research_staff", { _user_id: userId });
  if (error || data !== true) throw new Error("Research staff access required.");
}

async function guard(ctx: Ctx) {
  await requireStaff(ctx);
  const { requireAdmin } = await import("@/lib/admin-session.server");
  return requireAdmin(ctx.userId);
}

const MAX_FAILURES = 5;
const WINDOW_MIN = 15;

export const adminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context as Ctx);
    const { readValidAdmin } = await import("@/lib/admin-session.server");
    const a = await readValidAdmin(context.userId);
    return { signedIn: Boolean(a), login: a?.login ?? null };
  });

export const adminSignIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({ loginId: z.string().min(1).max(120), password: z.string().min(1).max(200) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireStaff(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { verifyAdminCredentials, getAdminSession } = await import("@/lib/admin-session.server");

    const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
    const { count } = await supabaseAdmin
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("success", false)
      .gte("attempted_at", since);
    if ((count ?? 0) >= MAX_FAILURES) {
      return {
        ok: false as const,
        message: `Too many failed attempts. Try again in ${WINDOW_MIN} minutes.`,
      };
    }

    const ok = await verifyAdminCredentials(data.loginId, data.password);
    await supabaseAdmin.from("admin_login_attempts").insert({ success: ok });
    if (!ok) return { ok: false as const, message: "Incorrect login ID or password." };

    const s = await getAdminSession();
    await s.update({
      login: process.env["NEUROCARE_ADMIN_LOGIN_ID"] ?? "",
      userId: context.userId,
      issuedAt: Date.now(),
    });
    return { ok: true as const, message: null };
  });

export const adminSignOut = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { getAdminSession } = await import("@/lib/admin-session.server");
    const s = await getAdminSession();
    await s.clear();
    return { ok: true };
  });

export const adminListParticipants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ query: z.string().trim().max(40) }).parse(d))
  .handler(async ({ data, context }) => {
    await guard(context as Ctx);
    let q = context.supabase
      .from("participants")
      .select("id, participant_code, study_group, randomized_at")
      .order("participant_code")
      .limit(50);
    const term = data.query.replace(/[%_,()]/g, "");
    if (term) q = q.ilike("participant_code", `%${term}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error("Could not load participants.");
    return (rows ?? []).map((r: any) => ({
      id: r.id as string,
      participantCode: r.participant_code as string,
      currentGroup: r.study_group as StudyGroup | null,
      randomised: Boolean(r.randomized_at),
    }));
  });

export const adminGetAllocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ participantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await guard(context as Ctx);
    const r = await loadAllocationRecord(context.supabase, data.participantId);
    if (!r) throw new Error("Participant not found.");
    return r;
  });

export const adminCorrectAllocation = createServerFn({ method: "POST" })
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
    const admin = await guard(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("admin_correct_participant_allocation", {
      p_id: data.participantId,
      p_expected_group: data.expectedGroup,
      p_new_group: data.newGroup,
      p_reason: data.reason,
      p_actor: context.userId,
      p_admin_login: admin.login,
    });
    if (error) throw new Error(error.message || "The allocation could not be changed.");
    const r = await loadAllocationRecord(context.supabase, data.participantId);
    if (!r) throw new Error("Participant not found.");
    return r;
  });
