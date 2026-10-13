import { createFileRoute, Link } from "@tanstack/react-router";
import { LibraryShell, PageIntro } from "@/components/library/LibraryShell";
import { PageContainer } from "@/components/layout/PageCanvas";
import { MedicineExplorer } from "@/components/patient/MedicineExplorer";
import { useTx } from "@/i18n/PatientLanguage";

const TITLE = "Understand Your Medicines — NeuroCare Connect";
const DESC = "Search general educational information about 20 medicines: uses, side effects, precautions and questions to ask your healthcare professional.";

export const Route = createFileRoute("/patient/medicines")({
  validateSearch: (s: Record<string, unknown>): { m?: string } => (typeof s["m"] === "string" && s["m"] ? { m: s["m"] } : {}),
  head: () => ({
    meta: [
      { title: TITLE }, { name: "description", content: DESC },
      { property: "og:title", content: TITLE }, { property: "og:description", content: DESC },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MedicinesPage,
});

function MedicinesPage() {
  const { m } = Route.useSearch();
  const navigate = Route.useNavigate();
  const tx = useTx();
  return (
    <LibraryShell back={false}>
      <PageContainer className="pb-20 pt-4">
        <nav aria-label={tx("Breadcrumb")} className="mb-4 text-sm text-muted-foreground">
          <Link to="/patient" className="hover:text-primary">{tx("Patient Education")}</Link> / {tx("Your medicines")}
        </nav>
        <PageIntro
          eyebrow={tx("Your medicines")}
          title={tx("Understand your medicines")}
          text={tx("Explore general information about medicines, including what they are used for, possible side effects, important precautions and questions to ask your healthcare professional.")}
        />
        <div className="mt-10">
          <MedicineExplorer selectedId={m ?? null} onSelect={(id) => navigate({ search: id ? { m: id } : {} })} />
        </div>
        <p className="mt-10 text-sm text-muted-foreground">
          {tx("For general ideas about medicine safety, see")}{" "}
          <Link to="/patient/library/$slug" params={{ slug: "side-effects-and-interactions" }} className="font-semibold text-primary hover:underline">{tx("side effects, adherence and interactions")}</Link>{" "}{tx("and")}{" "}
          <Link to="/patient/library/$slug" params={{ slug: "questions-about-medicines" }} className="font-semibold text-primary hover:underline">{tx("questions to ask about your medicines")}</Link>.
        </p>
      </PageContainer>
    </LibraryShell>
  );
}
