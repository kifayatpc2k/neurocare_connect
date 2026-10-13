import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { ArticleDiagram } from "@/components/library/Diagrams";
import { LibraryShell, ReviewLabel, SourceList } from "@/components/library/LibraryShell";
import { PageContainer } from "@/components/layout/PageCanvas";
import { articleBySlug, libraryIntro as libraryIntroEn, readingMinutes, relatedFor, sectionById } from "@/content/patient/library";
import { useLocalized, useTx } from "@/i18n/PatientLanguage";

export const Route = createFileRoute("/patient/library/$slug")({
  loader: ({ params }) => {
    const a = articleBySlug(params.slug);
    if (!a || a.reviewStatus === "draft") throw notFound();
    return { slug: a.slug };
  },
  head: ({ loaderData }) => {
    const a = loaderData ? articleBySlug(loaderData.slug) : undefined;
    if (!a) return { meta: [{ title: "Article not found — NeuroCare Connect" }, { name: "robots", content: "noindex" }] };
    const t = `${a.title} — NeuroCare Connect Library`;
    return {
      meta: [
        { title: t },
        { name: "description", content: a.summary },
        { property: "og:title", content: t },
        { property: "og:description", content: a.summary },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: ArticleNotFound,
  component: ArticlePage,
});

function ArticleNotFound() {
  const tx = useTx();
  return (
    <LibraryShell>
      <PageContainer className="py-16">
        <h1 className="font-display text-3xl font-bold">{tx("Article not found")}</h1>
        <p className="mt-3 text-muted-foreground">{tx("This article is not in the library.")}</p>
      </PageContainer>
    </LibraryShell>
  );
}

function ArticlePage() {
  const { slug } = Route.useLoaderData();
  const tx = useTx();
  const aEn = articleBySlug(slug)!;
  const minutes = readingMinutes(aEn);
  const a = useLocalized(aEn);
  const sec = useLocalized(sectionById(aEn.category) ?? { title: "Article" });
  const related = useLocalized(relatedFor(aEn));
  const libraryIntro = useLocalized(libraryIntroEn);

  return (
    <LibraryShell>
      <PageContainer className="py-8">
        <article className="mx-auto max-w-3xl">
          <header>
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
              <ol className="flex flex-wrap gap-1.5">
                <li><Link to="/patient" className="hover:text-primary">{tx("Patient Education")}</Link> /</li>
                <li><Link to="/patient/library" className="hover:text-primary">{tx("Library")}</Link> /</li>
                <li>{sec.title}</li>
              </ol>
            </nav>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">{a.title}</h1>
            <p className="mt-4 text-xl leading-relaxed text-muted-foreground">{a.summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>{tx("About {n} min read", { n: minutes })}</span>
              <ReviewLabel status={a.reviewStatus} />
              {a.reviewedAt ? <span>{tx("Reviewed")} <bdi>{a.reviewedAt}</bdi></span> : null}
            </div>
          </header>

          {a.diagram ? <div className="mt-8"><ArticleDiagram id={a.diagram} /></div> : null}
          <div className="mt-10 space-y-8 text-lg leading-relaxed">
            {a.content.map((b) => (
              <section key={b.heading}>
                <h2 className="font-display text-2xl font-bold">{b.heading}</h2>
                {b.paragraphs?.map((p) => <p key={p} className="mt-3">{p}</p>)}
                {b.list ? (
                  <ul className="mt-3 space-y-2">
                    {b.list.map((x) => <li key={x} className="flex gap-3"><span aria-hidden="true" className="mt-3 size-1.5 shrink-0 rounded-full bg-accent" />{x}</li>)}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          {a.category === "medicines" || a.category === "appointment" ? (
            <p className="mt-8"><Link to="/patient/medicines" className="font-semibold text-primary hover:underline">{tx("Look up a specific medicine in “Your medicines”")}</Link></p>
          ) : null}
          {a.category === "appointment" || a.category === "assessment" ? (
            <p className="mt-3"><Link to="/patient/library/checklist" className="font-semibold text-primary hover:underline">{tx("Open the printable appointment checklist")}</Link></p>
          ) : null}

          <section aria-labelledby="kt-h" className="mt-10 rounded-3xl bg-surface p-6 md:p-8">
            <h2 id="kt-h" className="font-display text-xl font-bold">{tx("Key takeaways")}</h2>
            <ul className="mt-4 space-y-2">
              {a.takeaways.map((t) => <li key={t} className="flex gap-3"><CheckCircle2 className="mt-1 size-4 shrink-0 text-accent" aria-hidden="true" />{t}</li>)}
            </ul>
          </section>

          <div className="mt-8 flex gap-3 rounded-2xl border border-hairline p-4 text-sm leading-relaxed text-muted-foreground">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
            <p>{libraryIntro.notice} <Link to="/patient/library/help" className="font-semibold text-primary hover:underline">{tx("When to seek medical help")}</Link></p>
          </div>

          {related.length ? (
            <section aria-labelledby="rel-h" className="mt-10 print:hidden">
              <h2 id="rel-h" className="font-display text-xl font-bold">{tx("Related articles")}</h2>
              <ul className="mt-3">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link to="/patient/library/$slug" params={{ slug: r.slug }} className="group flex items-center justify-between gap-4 border-t border-hairline py-3 font-semibold hover:text-primary">
                      {r.title}<ArrowRight className="size-4 text-primary rtl:rotate-180" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="src-h" className="mt-10 border-t border-hairline pt-6">
            <h2 id="src-h" className="font-display text-xl font-bold">{tx("Sources and review")}</h2>
            <div className="mt-3"><SourceList sources={a.sources} /></div>
            <p className="mt-4 text-sm text-muted-foreground">{tx("Written from the public sources above in plain language. This article has not yet been reviewed by a clinician or pharmacist.")}</p>
          </section>
        </article>
      </PageContainer>
    </LibraryShell>
  );
}
