import { createFileRoute, Link } from "@tanstack/react-router";
import { LibraryShell, PageIntro } from "@/components/library/LibraryShell";
import { PageContainer } from "@/components/layout/PageCanvas";
import { glossary, termId, type GlossaryTerm } from "@/content/patient/glossary";
import { articleBySlug, libraryGlossary } from "@/content/patient/library";
import { useLocalized, usePatientLanguage, useTx } from "@/i18n/PatientLanguage";

const TITLE = "Medical Glossary — NeuroCare Connect Library";
const DESC = "Health, nerve and study words explained simply, with links to related articles.";

export const Route = createFileRoute("/patient/library/glossary")({
  head: () => ({
    meta: [
      { title: TITLE }, { name: "description", content: DESC },
      { property: "og:title", content: TITLE }, { property: "og:description", content: DESC },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GlossaryPage,
});

const seen = new Set<string>();
const termsEn: GlossaryTerm[] = [...glossary, ...libraryGlossary]
  .filter((g) => (seen.has(g.term) ? false : (seen.add(g.term), true)))
  .sort((a, b) => a.term.localeCompare(b.term));

function GlossaryPage() {
  const tx = useTx();
  const { lang } = usePatientLanguage();
  const termsL = useLocalized(termsEn);
  const terms = termsEn;
  const letters = [...new Set(terms.map((t) => t.term[0]!.toUpperCase()))];
  return (
    <LibraryShell>
      <PageContainer className="py-8">
        <div className="mx-auto max-w-3xl">
          <PageIntro eyebrow={tx("I — Glossary")} title={tx("Medical glossary")} text={tx("Health words used in this library and in the study, explained simply.")} />
          {lang === "en" ? <nav aria-label="Jump to letter" className="mt-6 flex flex-wrap gap-1.5">
            {letters.map((l) => (
              <a key={l} href={`#letter-${l}`} className="grid size-9 place-items-center rounded-full border border-hairline text-sm font-semibold hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{l}</a>
            ))}
          </nav> : null}
          <dl className="mt-8">
            {terms.map((g, i) => {
              const first = i === 0 || terms[i - 1]!.term[0]!.toUpperCase() !== g.term[0]!.toUpperCase();
              const rel = (g.related ?? []).map(articleBySlug).filter((a) => !!a).map((a) => ({ slug: a!.slug, title: tx(a!.title) }));
              const gl = termsL[i] ?? g;
              return (
                <div key={g.term} id={termId(g.term)} className="scroll-mt-6 grid gap-1 border-t border-hairline py-5 target:bg-primary/5 sm:grid-cols-[14rem_1fr] sm:gap-6">
                  <dt className="font-display text-lg font-bold">
                    {first ? <span id={`letter-${g.term[0]!.toUpperCase()}`} className="scroll-mt-6" /> : null}
                    {gl.term}
                  </dt>
                  <dd className="text-lg leading-relaxed text-muted-foreground">
                    <p>{gl.text}</p>
                    {gl.inStudy ? <p className="mt-2 text-base"><span className="font-semibold text-foreground">{tx("In the study:")} </span>{gl.inStudy}</p> : null}
                    {rel.length ? (
                      <p className="mt-2 text-base">
                        {tx("Read more:")}{" "}
                        {rel.map((a, j) => (
                          <span key={a!.slug}>{j ? " · " : ""}<Link to="/patient/library/$slug" params={{ slug: a!.slug }} className="font-semibold text-primary hover:underline">{a!.title}</Link></span>
                        ))}
                      </p>
                    ) : null}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </PageContainer>
    </LibraryShell>
  );
}
