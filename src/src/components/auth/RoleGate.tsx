import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AccessDeniedState, ErrorState, LoadingState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/hooks/useAccount";
import { isResearchStaff, type AppRole } from "@/lib/study";

/**
 * UI-level portal separation. This is a convenience layer only — the
 * authoritative enforcement lives in Row Level Security policies and in
 * authenticated server functions, so a patient cannot reach research data
 * even by navigating directly to a research route.
 */
export function RoleGate({
  allow,
  children,
}: {
  allow: "research" | AppRole[];
  children: ReactNode;
}) {
  const { data: account, isPending, isError, refetch } = useAccount();

  if (isPending) return <LoadingState label="Checking your access…" />;
  if (isError || !account) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  const permitted =
    allow === "research"
      ? isResearchStaff(account.roles)
      : allow.some((role) => account.roles.includes(role));

  if (!permitted) {
    return (
      <AccessDeniedState
        description={
          allow === "research"
            ? "This area is restricted to authorised research personnel. Your account does not hold a research role."
            : "Your account does not have access to this area."
        }
        action={
          <Button asChild variant="outline">
            <Link to="/">Return to the landing page</Link>
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
