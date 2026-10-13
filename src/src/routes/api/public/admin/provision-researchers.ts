import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/**
 * Protected, idempotent setup of the predefined research team accounts.
 *
 * Accounts are read only from the server-side secret `RESEARCH_ACCOUNTS`
 * (never from the request, never from client code), a JSON array:
 *   [{ "key": "account1", "email": "...", "password": "...", "role": "researcher" }, ...]
 *
 * - `key` is a permanent label stored on the login account, so changing an
 *   email later updates the same underlying user (audit history is keyed by
 *   the stable user ID, never by email).
 * - `role` is "researcher" or "admin". Exactly that research role is kept.
 * - `"disabled": true` removes research access without deleting the user.
 * - Never grants fine-grained permissions such as `randomisation_override`.
 * - Passwords go straight to the sign-in system; they are never returned or logged.
 *
 * Protected by the platform's server-only secret; there is no public
 * registration path.
 */

const accountSchema = z.object({
  key: z.string().trim().regex(/^[a-z0-9_-]{1,40}$/i),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(10).max(128).optional(),
  role: z.enum(["researcher", "admin"]),
  fullName: z.string().trim().max(120).optional(),
  disabled: z.boolean().optional(),
});
const configSchema = z.array(accountSchema).min(1).max(50);

type Result = { key: string; status: string; role: string | null; error?: string };

export const Route = createFileRoute("/api/public/admin/provision-researchers")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;

        // Two sources, both server-side secrets:
        // - RESEARCH_TEAM_EMAIL + RESEARCH_TEAM_PASSWORD (+ optional RESEARCH_TEAM_ROLE):
        //   the single fixed research-team login, stable key "research-team".
        // - RESEARCH_ACCOUNTS: optional JSON list for additional accounts.
        const raw = process.env["RESEARCH_ACCOUNTS"];
        const teamEmail = process.env["RESEARCH_TEAM_EMAIL"];
        const teamPassword = process.env["RESEARCH_TEAM_PASSWORD"];
        if (!raw && !teamEmail) return Response.json({ error: "No research accounts are configured (RESEARCH_TEAM_EMAIL / RESEARCH_TEAM_PASSWORD or RESEARCH_ACCOUNTS)." }, { status: 400 });
        let accounts: z.infer<typeof configSchema>;
        try {
          const list: unknown[] = raw ? JSON.parse(raw) : [];
          if (teamEmail) {
            list.unshift({ key: "research-team", email: teamEmail, ...(teamPassword ? { password: teamPassword } : {}), role: process.env["RESEARCH_TEAM_ROLE"] === "admin" ? "admin" : "researcher", fullName: "Research team" });
          }
          accounts = configSchema.parse(list);
        } catch {
          // Do not echo the config: it contains passwords.
          return Response.json({ error: "Research account configuration is not valid. Check emails, roles and password length (10+ characters)." }, { status: 400 });
        }
        const keys = new Set(accounts.map((a) => a.key.toLowerCase()));
        const emails = new Set(accounts.map((a) => a.email));
        if (keys.size !== accounts.length || emails.size !== accounts.length) {
          return Response.json({ error: "Each account needs a unique key and email." }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        if (listError) {
          console.error("[provision] listUsers failed");
          return Response.json({ error: "Could not read accounts." }, { status: 500 });
        }

        const results: Result[] = [];
        for (const a of accounts) {
          try {
            const byKey = list.users.find((u) => (u.app_metadata as Record<string, unknown>)?.["research_account_key"] === a.key);
            const byEmail = list.users.find((u) => u.email?.toLowerCase() === a.email);
            if (byKey && byEmail && byKey.id !== byEmail.id) {
              results.push({ key: a.key, status: "error", role: null, error: "Email already belongs to another account." });
              continue;
            }
            const existing = byKey ?? byEmail;
            let userId: string;
            let status: string;

            if (existing) {
              const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
                email: a.email,
                email_confirm: true,
                ...(a.password ? { password: a.password } : {}),
                app_metadata: { ...(existing.app_metadata ?? {}), research_account_key: a.key },
                ...(a.fullName ? { user_metadata: { ...(existing.user_metadata ?? {}), full_name: a.fullName } } : {}),
              });
              if (error) throw new Error("update failed");
              userId = existing.id;
              status = "updated";
            } else {
              if (a.disabled) {
                results.push({ key: a.key, status: "skipped (disabled, not created)", role: null });
                continue;
              }
              if (!a.password) {
                results.push({ key: a.key, status: "error", role: null, error: "A password is required for a new account." });
                continue;
              }
              const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email: a.email,
                password: a.password,
                email_confirm: true,
                app_metadata: { research_account_key: a.key },
                user_metadata: { full_name: a.fullName ?? null },
              });
              if (error || !data.user) throw new Error("create failed");
              userId = data.user.id;
              status = "created";
            }

            // Keep profile email in step with the login email (same stable ID).
            await supabaseAdmin.from("profiles").update({ email: a.email, ...(a.fullName ? { full_name: a.fullName } : {}) }).eq("id", userId);

            // Exactly one research role (or none when disabled).
            const remove = a.disabled ? ["researcher", "admin"] : (["researcher", "admin"] as const).filter((r) => r !== a.role);
            const { error: delErr } = await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).in("role", remove as ("researcher" | "admin")[]);
            if (delErr) throw new Error("role update failed");
            if (!a.disabled) {
              const { error: roleErr } = await supabaseAdmin
                .from("user_roles")
                .upsert({ user_id: userId, role: a.role }, { onConflict: "user_id,role" });
              if (roleErr) throw new Error("role update failed");
            }
            results.push({ key: a.key, status: a.disabled ? `${status} (research access removed)` : status, role: a.disabled ? null : a.role });
          } catch (e) {
            console.error(`[provision] ${a.key}:`, e instanceof Error ? e.message : "failed");
            results.push({ key: a.key, status: "error", role: null, error: "Could not create or update this account." });
          }
        }

        return Response.json({ results });
      },
    },
  },
});
