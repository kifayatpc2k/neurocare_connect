import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { ArticleDiagram, StudyPathwayDiagram } from "@/components/library/Diagrams";
import { LibraryShell, ReviewLabel, SourceList } from "@/components/library/LibraryShell";
import { PageContainer } from "@/components/layout/PageCanvas";
import { articleBySlug, leaflets, libraryIntro as libraryIntroEn, type Article, type Source } from "@/content/patient/library";
import { studyExplainer } from "@/content/patient/education";

import { useLocalized, useTx } from "@/i18n/PatientLanguage";
import { msg } from "@/i18n/localize";

const STUDY = { id: "study", title: msg("Understanding the study"), summary: studyExplainer.text, articleSlugs: [] as string[] };

export const Route = createFileRoute("/patient/library/leaflet/$id")({
  loader: ({ params }) => {
    const l = params.id === "study" ? STUDY : leaflets.find((x) => x.id === params.id);
    if (!l) throw notFound();
    return { id: l.id, title: l.title, summary: l.summary };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Leaflet not found — NeuroCare Connect" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.title} (printable leaflet) — NeuroCare Connect`;
    return { meta: [
      { title: t }, { name: "description", content: loaderData.summary },
      { property: "og:title", content: t }, { property: "og:description", content: loaderData.summary },
      { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  notFoundComponent: () => (
    <LibraryShell><PageContainer className="py-16"><h1 className="font-display text-3xl font-bold">Leaflet not found</h1></PageContainer></LibraryShell>
  ),
  component: LeafletPage,
});

function LeafletPage() {
  const { id } = Route.useLoaderData();
  const tx = useTx();
  const lEn = id === "study" ? STUDY : leaflets.find((x) => x.id === id)!;
  const partsEn = lEn.articleSlugs.map(articleBySlug).filter((a): a is Article => !!a);
  const l = useLocalized(lEn);
  const parts = useLocalized(partsEn);
  const libraryIntro = useLocalized(libraryIntroEn);
  const sources = [...new Map(partsEn.flatMap((a) => a.sources).map((s) => [s.url, s] as [string, Source])).values()];

  return (
    <LibraryShell>
      <PageContainer className="py-8 print:p-0">
        <div className="mx-auto max-w-3xl print:max-w-none">
          <div className="mb-6 flex flex-wrap gap-3 print:hidden">
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Printer className="size-4" aria-hidden="true" />{tx("Print leaflet")}
            </button>
            <Link to="/patient/library/leaflets" className="rounded-full border border-hairline px-5 py-2.5 text-sm font-semibold hover:border-primary">{tx("All leaflets")}</Link>
          </div>
          <article className="rounded-3xl border border-hairline bg-card p-6 md:p-10 print:rounded-none print:border-0 print:p-0">
            <header className="flex flex-wrap items-start justify-between gap-4 border-b border-hairline pb-5">
              <BrandMark />
              <ReviewLabel status="awaiting-review" />
            </header>
            <h1 className="mt-6 font-display text-3xl font-bold">{l.title}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{l.summary}</p>

            {id === "study" ? (
              <div className="mt-6 space-y-4">
                <StudyPathwayDiagram />
                <p>{tx("For full details, visit the Study page on the NeuroCare Connect website or speak to the study team.")}</p>
              </div>
            ) : parts.map((a) => (
              <section key={a.slug} className="mt-8 print:break-inside-avoid-page">
                <h2 className="font-display text-2xl font-bold">{a.title}</h2>
                {a.diagram ? <div className="mt-4"><ArticleDiagram id={a.diagram} /></div> : null}
                {a.content.map((b) => (
                  <div key={b.heading} className="mt-4">
                    <h3 className="font-semibold">{b.heading}</h3>
                    {b.paragraphs?.map((p) => <p key={p} className="mt-1">{p}</p>)}
                    {b.list ? <ul className="mt-1 list-disc space-y-1 ps-5">{b.list.map((x) => <li key={x}>{x}</li>)}</ul> : null}
                  </div>
                ))}
                <div className="mt-4 rounded-2xl bg-surface p-4">
                  <p className="font-semibold">{tx("Key points")}</p>
                  <ul className="mt-1 list-disc ps-5">{a.takeaways.map((t) => <li key={t}>{t}</li>)}</ul>
                </div>
              </section>
            ))}

            <p className="mt-8 border-t border-hairline pt-5 text-sm text-muted-foreground">{libraryIntro.notice}</p>
            {sources.length ? (
              <div className="mt-4 text-sm"><p className="font-semibold">{tx("Sources")}</p><div className="mt-2"><SourceList sources={sources} /></div></div>
            ) : null}
          </article>
        </div>
      </PageContainer>
    </LibraryShell>
  );
}
