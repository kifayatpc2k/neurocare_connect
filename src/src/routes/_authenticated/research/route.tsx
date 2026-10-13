import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PageCanvas, PageContainer } from "@/components/layout/PageCanvas";
import { AccessDeniedState, LoadingState, ErrorState } from "@/components/common/States";
import { useAccount } from "@/hooks/useAccount";
import { isResearchStaff } from "@/lib/study";

export const Route = createFileRoute("/_authenticated/research")({
  component: ResearchGate,
});

function ResearchGate() {
  const { data, isPending, isError, refetch } = useAccount();

  if (isPending) {
    return (
      <PageCanvas>
        <PageContainer className="py-20">
          <LoadingState label="Checking your research access" />
        </PageContainer>
      </PageCanvas>
    );
  }

  if (isError) {
    return (
      <PageCanvas>
        <PageContainer className="py-20">
          <ErrorState
            description="We couldn't confirm your access to the research workspace."
            onRetry={() => {
              void refetch();
            }}
          />
        </PageContainer>
      </PageCanvas>
    );
  }

  if (!isResearchStaff(data?.roles ?? [])) {
    return (
      <PageCanvas>
        <PageContainer className="py-20">
          <AccessDeniedState />
        </PageContainer>
      </PageCanvas>
    );
  }

  return <Outlet />;
}
