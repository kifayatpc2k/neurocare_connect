import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AppPermission, AppRole } from "@/lib/study";

export type Account = {
  userId: string;
  email: string | null;
  fullName: string | null;
  preferredLanguage: string;
  roles: AppRole[];
  permissions: AppPermission[];
};

/**
 * Single source of truth for "who am I and what may I do".
 * Role and permission information is resolved server-side under RLS — never
 * from client state. The UI uses it only to show/hide; the backend re-checks.
 */
export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Account> => {
    const [{ data: profile }, { data: roleRows }, { data: permRows }] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("email, full_name, preferred_language")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
      context.supabase.from("user_permissions").select("permission").eq("user_id", context.userId),
    ]);

    return {
      userId: context.userId,
      email: profile?.email ?? null,
      fullName: profile?.full_name ?? null,
      preferredLanguage: profile?.preferred_language ?? "en",
      roles: (roleRows ?? []).map((r) => r.role as AppRole),
      permissions: (permRows ?? []).map((r) => r.permission as AppPermission),
    };
  });
