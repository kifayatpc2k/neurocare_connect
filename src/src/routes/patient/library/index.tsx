import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Search, ShieldAlert, X } from "lucide-react";
import { LibraryShell, PageIntro } from "@/components/library/LibraryShell";
import { PageContainer } from "@/components/layout/PageCanvas";
import { libraryIntro as libraryIntroEn, librarySections as librarySectionsEn, publicArticles, readingMinutes } from "@/content/patient/library";
import { searchLibrary } from "@/lib/library-search";
import { useLocalized, usePatientLanguage, useTx } from "@/i18n/PatientLanguage";
import { LearningPathway, MedicationReviewDiagram, NerveSignalDiagram } from "@/components/library/Diagrams";

const TITLE = "Neuropathic Pain Education Library — NeuroCare Connect";
const DESC = "Plain-language articles on nerve pain, assessment, causes, medicine safety, daily life and appointment preparation. No account needed.";

export const Route = createFileRoute("/patient/library/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LibraryHome,
});


function LibraryHome() {
  const tx = useTx();
  const { dict } = usePatientLanguage();
  const kindLabel = { article: tx("Article"), faq: tx("FAQ"), glossary: tx("Glossary"), medicine: tx("Medicine"), section: tx("Section") };
  const [q, setQ] = useState("");
  const hits = useMemo(() => searchLibrary(q, dict), [q, dict]);
  const allEn = publicArticles();
  const all = useLocalized(allEn);
  const libraryIntro = useLocalized(libraryIntroEn);
  const librarySections = useLocalized(librarySectionsEn);

  return (
    <LibraryShell back={false}>
      <PageContainer className="pb-10 pt-4">
        <PageIntro eyebrow={libraryIntro.eyebrow} title={libraryIntro.title} text={libraryIntro.text} />
        <div className="mt-6 flex max-w-3xl gap-3 rounded-2xl border border-hairline bg-surface p-4 text-sm leading-relaxed text-muted-foreground">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <p>{libraryIntro.notice}</p>
        </div>

        <div className="mt-8 max-w-3xl">
          <label htmlFor="lib-search" className="text-sm font-semibold">{tx("Search the library")}</label>
          <div className="relative mt-2">
            <Search aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input id="lib-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off"
              placeholder={tx("Try shingles, side effects or numbness…")}
              className="w-full rounded-full border border-input bg-card py-3.5 ps-11 pe-12 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden" />
            {q ? (
              <button type="button" onClick={() => setQ("")} aria-label={tx("Clear search")} className="absolute end-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          {q.trim() ? (
            <div className="mt-4" aria-live="polite">
              <p className="text-sm text-muted-foreground">{hits.length === 1 ? tx("1 result") : tx("{n} results", { n: hits.length })}</p>
              {hits.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-hairline p-4 text-sm">{tx("Nothing in the library matches that yet. Try a different word, or browse the sections below.")}</p>
              ) : (
                <ul className="mt-2 divide-y divide-hairline border-y border-hairline">
                  {hits.map((h, i) => {
                    const inner = (
                      <>
                        <span className="text-xs font-semibold uppercase tracking-wide text-primary">{kindLabel[h.kind]}</span>
                        <span className="block font-semibold">{h.title}</span>
                        <span className="block text-sm text-muted-foreground">{h.text}</span>
                      </>
                    );
                    const cls = "block px-1 py-3 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
                    const page = h.kind === "section" ? librarySectionsEn.find((s) => s.id === h.anchor)?.page : undefined;
                    return (
                      <li key={`${h.kind}-${i}`}>
                        {h.kind === "article" ? <Link to="/patient/library/$slug" params={{ slug: h.slug }} className={cls}>{inner}</Link>
                          : h.kind === "medicine" ? <Link to="/patient/medicines" search={{ m: h.slug }} className={cls}>{inner}</Link>
                          : h.kind === "faq" ? <Link to="/patient/library/faq" className={cls}>{inner}</Link>
                          : h.kind === "glossary" ? <Link to="/patient/library/glossary" hash={h.anchor ?? ""} className={cls}>{inner}</Link>
                          : page ? <Link to={page} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </PageContainer>

      <PageContainer className="pb-6">
        <Link to="/patient/library/help" className="flex items-center gap-4 rounded-2xl border border-warm/60 p-5 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
          <span className="flex-1"><span className="block font-display text-lg font-bold">{tx("When to seek medical help")}</span><span className="text-sm text-muted-foreground">{tx("This library is not an emergency service. See where to turn and how quickly.")}</span></span>
          <ArrowRight className="size-4 text-primary rtl:rotate-180" aria-hidden="true" />
        </Link>
      </PageContainer>

      <PageContainer className="pb-10">
        <h2 className="sr-only">{tx("Learning pathway")}</h2>
        <LearningPathway />
      </PageContainer>

      <nav aria-label={tx("Library sections")} className="border-y border-hairline bg-surface">
        <PageContainer className="py-8">
          <ol className="grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-5">
            {librarySections.map((s) => (
              <li key={s.id}>
                {s.page ? <Link to={s.page} className="flex gap-2 py-1.5 text-sm hover:text-primary"><span className="font-semibold text-muted-foreground">{s.letter}</span>{s.title}</Link>
                  : <a href={`#${s.id}`} className="flex gap-2 py-1.5 text-sm hover:text-primary"><span className="font-semibold text-muted-foreground">{s.letter}</span>{s.title}</a>}
              </li>
            ))}
          </ol>
        </PageContainer>
      </nav>

      <PageContainer className="py-14">
        <div className="space-y-14">
          {librarySections.filter((s) => !s.page).map((s) => {
            const list = all.filter((a) => a.category === s.id);
            if (!list.length) return null;
            return (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="grid scroll-mt-6 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <p className="font-display text-sm text-muted-foreground">{s.letter}</p>
                  <h2 id={`${s.id}-h`} className="font-display text-2xl font-bold">{s.title}</h2>
                  <p className="mt-2 text-muted-foreground">{s.description}</p>
                </div>
                <ul className="lg:col-span-8">
                  {list.map((a) => (
                    <li key={a.slug}>
                      <Link to="/patient/library/$slug" params={{ slug: a.slug }} className="group flex items-center justify-between gap-4 border-t border-hairline py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <span>
                          <span className="block font-display text-lg font-bold group-hover:text-primary">{a.title}</span>
                          <span className="mt-1 block text-sm text-muted-foreground">{a.summary} · {tx("{n} min read", { n: readingMinutes(allEn.find((x) => x.slug === a.slug) ?? a) })}</span>
                        </span>
                        <ArrowRight className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          <section aria-labelledby="vis-h">
            <h2 id="vis-h" className="font-display text-2xl font-bold">{tx("Visual guides")}</h2>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <NerveSignalDiagram />
              <MedicationReviewDiagram />
            </div>
          </section>

          <section aria-labelledby="more-h">
            <h2 id="more-h" className="font-display text-2xl font-bold">{tx("More in the library")}</h2>
            <ul className="mt-6 grid gap-px overflow-hidden rounded-3xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-5">
              {[...librarySections.filter((s) => s.page), { id: "leaflets", letter: "+", title: tx("Printable leaflets"), description: tx("A4-friendly leaflets built from these articles."), page: "/patient/library/leaflets" as const }].map((s) => (
                <li key={s.id} className="bg-background">
                  <Link to={s.page!} className="flex h-full flex-col gap-2 p-5 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                    <span className="text-xs text-muted-foreground">{s.letter}</span>
                    <span className="font-display font-bold">{s.title}</span>
                    <span className="text-sm text-muted-foreground">{s.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <p className="text-sm text-muted-foreground">{libraryIntro.languageNote}</p>
        </div>
      </PageContainer>
    </LibraryShell>
  );
}
