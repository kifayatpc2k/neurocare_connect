import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { PageCanvas, PageContainer } from "@/components/layout/PageCanvas";
import { PortalHeader } from "@/components/layout/PortalHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHeader } from "@/components/layout/PageHeader";
import { AuthForm } from "@/components/auth/AuthForm";

export const Route = createFileRoute("/research/login")({
  head: () => ({
    meta: [
      { title: "Research Team Sign In — NeuroCare Connect" },
      {
        name: "description",
        content:
          "Authorised research personnel sign in to manage participants, randomisation, assessments and study data export.",
      },
      { property: "og:title", content: "Research Team Sign In — NeuroCare Connect" },
      {
        property: "og:description",
        content: "Authorised study personnel access to the NeuroCare Connect workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResearchLogin,
});

function ResearchLogin() {
  return (
    <PageCanvas>
      <PortalHeader portalLabel="Research team portal" />
      <main className="flex-1">
        <PageContainer width="narrow" className="space-y-8">
          <PageHeader
            eyebrow="Research team portal"
            title="Authorised access"
            description="Study personnel only. Research roles are granted by the study team and verified on the server for every request."
            breadcrumbs={[{ label: "Research" }, { label: "Sign in" }]}
          />
          <div className="frost rounded-3xl p-7">
            <div className="mb-5 flex items-start gap-3 rounded-2xl bg-brand/10 p-4 text-sm text-brand-deep">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <p>
                Signing in does not grant research permissions. Participant data stays
                unreachable until a research role is assigned to your account.
              </p>
            </div>
            <AuthForm redirectTo="/research/dashboard" />
          </div>
          <p className="text-sm text-muted-foreground">
            Looking for the{" "}
            <Link to="/patient" className="font-semibold text-brand-deep">
              patient education pages
            </Link>
            ?
          </p>
        </PageContainer>
      </main>
      <SiteFooter />
    </PageCanvas>
  );
}
