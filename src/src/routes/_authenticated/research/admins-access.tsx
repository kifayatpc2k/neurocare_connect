import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, LockKeyhole, LogOut } from "lucide-react";
import { ResearchShell } from "@/components/layout/ResearchShell";
import { ErrorState, LoadingState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AllocationWorkspace } from "@/components/research/AllocationWorkspace";
import {
  adminCorrectAllocation,
  adminGetAllocation,
  adminListParticipants,
  adminSignIn,
  adminSignOut,
  adminStatus,
} from "@/lib/admin-access.functions";

export const Route = createFileRoute("/_authenticated/research/admins-access")({
  head: () => ({
    meta: [
      { title: "Admins Access — NeuroCare Connect" },
      {
        name: "description",
        content: "Protected administrator sign-in for documented allocation corrections.",
      },
      { property: "og:title", content: "Admins Access — NeuroCare Connect" },
      {
        property: "og:description",
        content: "Protected administrator area for audited allocation corrections.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminsAccessPage,
});

const statusKey = ["admin-status"] as const;

function AdminsAccessPage() {
  const fetchStatus = useServerFn(adminStatus);
  const status = useQuery({
    queryKey: statusKey,
    queryFn: () => fetchStatus(),
    retry: false,
    staleTime: 0,
  });
  const qc = useQueryClient();
  const signOut = useServerFn(adminSignOut);

  const body = status.isPending ? (
    <LoadingState label="Checking administrator session" />
  ) : status.error ? (
    <ErrorState description={status.error.message} onRetry={() => void status.refetch()} />
  ) : status.data.signedIn ? (
    <div className="space-y-6">
      <div className="frost flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-3 text-sm">
        <span>
          Signed in as administrator <strong>{status.data.login}</strong> · session ends after 30
          minutes
        </span>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={async () => {
            await signOut();
            qc.removeQueries({ queryKey: ["allocation-search", "admin"] });
            qc.removeQueries({ queryKey: ["allocation-record", "admin"] });
            await qc.invalidateQueries({ queryKey: statusKey });
          }}
        >
          <LogOut aria-hidden="true" className="size-4" /> Sign out
        </Button>
      </div>
      <AllocationWorkspace
        listAll
        api={{
          key: "admin",
          search: adminListParticipants,
          get: adminGetAllocation,
          override: adminCorrectAllocation,
        }}
      />
    </div>
  ) : (
    <AdminLogin onSignedIn={() => void qc.invalidateQueries({ queryKey: statusKey })} />
  );

  return (
    <ResearchShell
      title="Admins Access"
      description="Administrator area for documented allocation corrections. Every change needs a reason and is permanently recorded."
      breadcrumbs={[
        { label: "Research" },
        { label: "Study administration" },
        { label: "Admins Access" },
      ]}
    >
      {body}
    </ResearchShell>
  );
}

function AdminLogin({ onSignedIn }: { onSignedIn: () => void }) {
  const signIn = useServerFn(adminSignIn);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: () => signIn({ data: { loginId: loginId.trim(), password } }),
    onSuccess: (r) => {
      setPassword("");
      if (r.ok) onSignedIn();
      else setError(r.message);
    },
    onError: (e) => {
      setPassword("");
      setError(e instanceof Error ? e.message : "Sign-in failed. Please try again.");
    },
  });

  return (
    <section className="frost mx-auto w-full max-w-md rounded-3xl p-6 sm:p-8">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <LockKeyhole aria-hidden="true" className="size-4" /> Administrator sign-in
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Separate from your research team sign-in. Credentials are checked on the server.
      </p>
      <form
        method="post"
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (!loginId.trim() || !password) {
            setError("Enter both the login ID and password.");
            return;
          }
          m.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="admin-login">Login ID</Label>
          <Input
            id="admin-login"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            autoComplete="username"
            maxLength={120}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-password">Password</Label>
          <div className="relative">
            <Input
              id="admin-password"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              maxLength={200}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full rounded-xl" disabled={m.isPending}>
          {m.isPending ? "Signing in…" : "Sign In"}
        </Button>
      </form>
      <p className="mt-6 text-xs text-muted-foreground">
        To view the study's fixed allocation settings, open{" "}
        <Link to="/research/randomisation-configuration" className="underline underline-offset-2">
          Randomisation Configuration
        </Link>
        .
      </p>
    </section>
  );
}
