import { createFileRoute } from "@tanstack/react-router";
import { ResearchShell } from "@/components/layout/ResearchShell";
import { AccessDeniedState, LoadingState } from "@/components/common/States";
import { useAccount } from "@/hooks/useAccount";
import { AllocationWorkspace } from "@/components/research/AllocationWorkspace";
import { canOverrideAllocation } from "@/lib/study";
import {
  getAllocationRecord,
  overrideAllocation,
  searchAllocation,
} from "@/lib/allocation.functions";

export const Route = createFileRoute("/_authenticated/research/admin/randomisation-control")({
  head: () => ({
    meta: [
      { title: "Randomisation Control — NeuroCare Connect" },
      {
        name: "description",
        content: "Restricted research administration for documented, audited allocation changes.",
      },
      { property: "og:title", content: "Randomisation Control — NeuroCare Connect" },
      {
        property: "og:description",
        content: "Restricted, audited administration of participant allocation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RandomisationControlPage,
});

function RandomisationControlPage() {
  const { data: account, isPending } = useAccount();
  const shell = (children: React.ReactNode) => (
    <ResearchShell
      title="Randomisation Control"
      description="Restricted research administration. Changes to participant allocation require a documented reason and are permanently recorded."
      breadcrumbs={[
        { label: "Research" },
        { label: "Study administration" },
        { label: "Randomisation Control" },
      ]}
    >
      {children}
    </ResearchShell>
  );

  if (isPending) return shell(<LoadingState label="Checking your permissions" />);
  if (!canOverrideAllocation(account)) {
    return shell(
      <AccessDeniedState description="This area is restricted to research administrators with the randomisation override permission." />,
    );
  }
  return shell(
    <AllocationWorkspace
      api={{
        key: "control",
        search: searchAllocation,
        get: getAllocationRecord,
        override: overrideAllocation,
      }}
    />,
  );
}
