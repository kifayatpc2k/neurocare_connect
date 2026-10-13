import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Read-only view of the study's allocation configuration.
 * The configuration is fixed in the `allocate_study_participant` database
 * function (simple 1:1 random parity draw, no group input). This function only
 * reports it — there is deliberately no write path.
 */
export type RandomisationConfig = {
  method: string;
  ratio: string;
  groups: string[];
  recordedMethods: string[];
  allocatedCount: number;
};

export const getRandomisationConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RandomisationConfig> => {
    const { data: isStaff, error: e1 } = await context.supabase.rpc("is_research_staff", {
      _user_id: context.userId,
    });
    if (e1 || isStaff !== true) throw new Error("Research staff access required.");

    const { data: rows, error } = await context.supabase.from("randomizations").select("method");
    if (error) throw new Error("Could not load allocation records.");

    return {
      method: "Simple computer-generated random allocation",
      ratio: "1:1",
      groups: ["Control / Usual Care", "Intervention"],
      recordedMethods: [...new Set((rows ?? []).map((r) => r.method).filter((m): m is string => Boolean(m)))],
      allocatedCount: rows?.length ?? 0,
    };
  });
