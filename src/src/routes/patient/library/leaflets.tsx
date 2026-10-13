import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { LibraryShell, PageIntro } from "@/components/library/LibraryShell";
import { PageContainer } from "@/components/layout/PageCanvas";
import { leaflets } from "@/content/patient/library";

import { useLocalized, useTx } from "@/i18n/PatientLanguage";
import { msg } from "@/i18n/localize";

const TITLE = "Printable Leaflets — NeuroCare Connect Library";
const DESC = "A4-friendly patient leaflets on neuropathic pain, medicines, appointments, medication review and the study.";

export const Route = createFileRoute("/patient/library/leaflets")({
  head: () => ({
    meta: [
      { title: TITLE }, { name: "description", content: DESC },
      { property: "og:title", content: TITLE }, { property: "og:description", content: DESC },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LeafletsPage,
});

const allEn = [...leaflets, { id: "study", title: msg("Understanding the study"), summary: msg("The steps of the research study, from screening to Day 30."), articleSlugs: [] as string[] }];

function LeafletsPage() {
  const tx = useTx();
  const all = useLocalized(allEn);
  return (
    <LibraryShell>
      <PageContainer className="py-8">
        <div className="mx-auto max-w-3xl">
          <PageIntro eyebrow={tx("Printable leaflets")} title={tx("Leaflets to print or save")} text={tx("Each leaflet is built from the library articles, so it always matches what is on the website. Open one and use the print button.")} />
          <ul className="mt-8">
            {all.map((l) => (
              <li key={l.id}>
                <Link to="/patient/library/leaflet/$id" params={{ id: l.id }} className="group flex items-center gap-4 border-t border-hairline py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <FileText className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span><span className="block font-display text-lg font-bold group-hover:text-primary">{l.title}</span><span className="text-sm text-muted-foreground">{l.summary}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </PageContainer>
    </LibraryShell>
  );
}
