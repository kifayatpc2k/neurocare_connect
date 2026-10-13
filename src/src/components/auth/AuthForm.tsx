import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccount } from "@/lib/account.functions";
import { isResearchStaff } from "@/lib/study";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/**
 * Research sign-in only. There is deliberately no sign-up or social login:
 * research accounts are created by the protected server-side setup process,
 * and public sign-up is disabled at the backend.
 */

const credentialsSchema = z.object({
  email: z.string().trim().min(1, "Enter your research email").email("Enter a valid research email").max(255),
  password: z.string().min(1, "Enter your password").max(128),
});

type CredentialsValues = z.infer<typeof credentialsSchema>;

const MESSAGES = {
  invalid: "Incorrect email or password. Please check your details and try again.",
  noAccess: "You signed in, but this account does not have Research Portal access. Please contact the study administrator.",
  unavailable: "We couldn't complete the sign-in request. Please try again in a moment.",
  configuration: "Research sign-in is temporarily unavailable. Please contact the study administrator.",
} as const;

/** Safe diagnostic: records which stage failed — never credentials or tokens. */
type Stage = "authentication" | "provider" | "authorization-check" | "no-research-role" | "navigation";
function logStage(stage: Stage, detail?: string | number) {
  console.warn(`[research-login] failed at stage=${stage}${detail !== undefined ? ` (${detail})` : ""}`);
}

export function AuthForm({ redirectTo }: { redirectTo: "/research/dashboard" }) {
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inFlight = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  // Block submission until React has hydrated, so the browser can never fall
  // back to a native form submit that would put credentials in the URL.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Already signed in with research access (e.g. after a reload)? Skip the form.
  useEffect(() => {
    let live = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!live || !data.user) return;
      try {
        const account = await getMyAccount();
        if (live && isResearchStaff(account.roles)) await navigate({ to: redirectTo });
      } catch { /* expired or invalid session: stay on the form */ }
    })();
    return () => { live = false; };
  }, [navigate, redirectTo]);

  const form = useForm<CredentialsValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: CredentialsValues) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) {
        const invalid = error.status === 400 || /invalid|credentials|not confirmed/i.test(error.message);
        logStage(invalid ? "authentication" : "provider", error.status ?? "network");
        setMessage(invalid ? MESSAGES.invalid : error.status && error.status >= 500 ? MESSAGES.configuration : MESSAGES.unavailable);
        return;
      }

      // Server-side role check before entering the portal.
      let account;
      try {
        account = await getMyAccount();
      } catch {
        logStage("authorization-check");
        await supabase.auth.signOut();
        setMessage(MESSAGES.unavailable);
        return;
      }
      if (!isResearchStaff(account.roles)) {
        logStage("no-research-role");
        await supabase.auth.signOut();
        queryClient.clear();
        setMessage(MESSAGES.noAccess);
        return;
      }

      await queryClient.invalidateQueries();
      await navigate({ to: redirectTo });
    } catch {
      logStage("navigation");
      setMessage(MESSAGES.unavailable);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Form {...form}>
        <form method="post" action="#" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Research email</FormLabel>
                <FormControl>
                  <Input type="email" inputMode="email" autoComplete="username" spellCheck={false} required {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input type={showPassword ? "text" : "password"} autoComplete="current-password" required className="pe-11" {...field} />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 end-0 grid w-11 place-items-center rounded-e-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {message ? (
            <p role="alert" aria-live="assertive" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {message}
            </p>
          ) : null}

          <Button type="submit" className="w-full rounded-full" disabled={busy || !hydrated}>
            {busy ? <><Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Signing in…</> : "Sign in"}
          </Button>
        </form>
      </Form>

      <p className="text-xs text-muted-foreground">Research team access only.</p>
    </div>
  );
}
