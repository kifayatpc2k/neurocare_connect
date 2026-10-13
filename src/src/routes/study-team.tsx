import { useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { PageCanvas, PageContainer } from "@/components/layout/PageCanvas";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BrandMark } from "@/components/brand/BrandMark";
import { Reveal } from "@/components/common/Reveal";
import { StudyTeamResearchNetwork } from "@/components/study-team/StudyTeamResearchNetwork";
import { branding } from "@/config/branding";
import { cn } from "@/lib/utils";
import {
  acknowledgements,
  closing,
  collaborationFlow,
  contributions,
  externalLinks,
  heroDetails,
  institution,
  pageInfo,
  projectAtAGlance,
  projectJourney,
  sectionText,
  studyTeam,
  type Person,
} from "@/content/study-team";

// All page text lives in src/content/study-team.ts — edit that file, not this one.

const TITLE = "Study Team & Contributors — NeuroCare Connect";
const DESC =
  "The student researchers, contributions and institutional support behind NeuroCare Connect, a Pharm.D research project in neuropathic pain.";

export const Route = createFileRoute("/study-team")({
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
  component: StudyTeamPage,
});

const isPlaceholder = (v: string) => /^\[.*\]$/.test(v.trim()) || /pending$/i.test(v.trim());
const pad = (i: number) => String(i + 1).padStart(2, "0");

/** Renders text; placeholders get a muted, dashed "pending" style. */
function T({ v, className }: { v: string; className?: string }) {
  if (!isPlaceholder(v)) return <span className={className}>{v}</span>;
  return (
    <span
      className={cn("rounded border border-dashed border-current/30 px-1 italic opacity-70", className)}
      title="Placeholder — details pending"
    >
      {v}
    </span>
  );
}

function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent", className)}>
      <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />
      {children}
    </p>
  );
}

function SectionHead({ id, eyebrow, title, intro }: { id: string; eyebrow: string; title: string; intro?: string | undefined }) {
  return (
    <Reveal>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id={`${id}-h`} className="mt-4 max-w-3xl font-display text-3xl font-extrabold tracking-tight md:text-5xl">
        {title}
      </h2>
      {intro && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro}</p>}
    </Reveal>
  );
}

/* ---------- PEOPLE ---------- */

function Portrait({ person, index }: { person: Person; index: number }) {
  if (person.image) {
    return <img src={person.image} alt={`Portrait of ${person.name}`} className="size-28 rounded-full object-cover md:size-36" loading="lazy" />;
  }
  return (
    <span aria-hidden="true" className="relative grid size-28 shrink-0 place-items-center md:size-36">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full text-primary transition-transform duration-700 group-hover:rotate-45 group-focus-within:rotate-45 motion-reduce:transition-none">
        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeOpacity="0.25" />
        <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeDasharray="2 5" />
        <circle cx="50" cy="2" r="2.5" className="fill-warm" />
        <circle cx="86" cy="50" r="1.8" fill="currentColor" />
      </svg>
      <span className="font-display text-3xl font-extrabold text-brand-deep md:text-4xl">{pad(index)}</span>
    </span>
  );
}

function TeamSection() {
  return (
    <section id="team" aria-labelledby="team-h" className="relative py-20 md:py-28">
      <PageContainer>
        <SectionHead id="team" eyebrow={sectionText.team.eyebrow} title={sectionText.team.title} />
        <ul className="relative mt-14 grid gap-14 md:grid-cols-2 md:gap-10">
          {studyTeam.map((p, i) => (
            <li key={`${p.name}-${i}`}>
              <Reveal delay={i * 120}>
                <article
                  tabIndex={0}
                  className="group relative rounded-[2rem] p-2 outline-none transition-transform duration-500 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                >
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    <Portrait person={p} index={i} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Researcher {pad(i)}</p>
                      <h3 className="mt-2 font-display text-2xl font-extrabold tracking-tight md:text-3xl"><T v={p.name} /></h3>
                      <p className="mt-1 font-semibold text-primary"><T v={p.role} /></p>
                      {p.credentials && <p className="text-xs text-muted-foreground">{p.credentials}</p>}
                      <p className="mt-2 text-sm text-muted-foreground"><T v={p.department} /> · <T v={p.institution} /></p>
                    </div>
                  </div>
                  <div className="mt-8 border-l border-hairline pl-5 transition-colors duration-500 group-hover:border-primary group-focus-visible:border-primary">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">ACADEMIC PROGRAMME</p>
                    <p className="mt-2 leading-relaxed text-foreground/75 transition-colors group-hover:text-foreground group-focus-visible:text-foreground"><T v={p.contribution} /></p>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </PageContainer>
    </section>
  );
}

/* ---------- CONTRIBUTIONS ECOSYSTEM ---------- */

function Ecosystem() {
  const [active, setActive] = useState<number | null>(null);
  const n = contributions.length;
  return (
    <section id="contributions" aria-labelledby="contributions-h" className="border-t border-hairline bg-card/50 py-20 md:py-28">
      <PageContainer>
        <SectionHead id="contributions" eyebrow={sectionText.work.eyebrow} title={sectionText.work.title} intro={sectionText.work.intro} />

        {/* Desktop: radial ecosystem */}
        <div className="relative mx-auto mt-16 hidden aspect-square max-w-3xl lg:block" onMouseLeave={() => setActive(null)}>
          <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 size-full text-primary">
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.15" strokeOpacity="0.35" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="0.12" strokeOpacity="0.3" strokeDasharray="0.4 1.2" />
            {contributions.map((_, i) => {
              const a = (i / n) * Math.PI * 2 - Math.PI / 2;
              return (
                <line
                  key={i}
                  x1="50" y1="50"
                  x2={50 + Math.cos(a) * 30} y2={50 + Math.sin(a) * 30}
                  stroke="currentColor"
                  strokeWidth={active === i ? 0.35 : 0.15}
                  strokeOpacity={active === null || active === i ? 0.5 : 0.12}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
          <div className="absolute left-1/2 top-1/2 grid size-40 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-hairline bg-background text-center shadow-sm">
            <span className="px-4 text-xs font-bold uppercase tracking-[0.2em] text-brand-deep">{sectionText.work.centre}</span>
          </div>
          {contributions.map((c, i) => {
            const a = (i / n) * Math.PI * 2 - Math.PI / 2;
            const x = 50 + Math.cos(a) * 30;
            const y = 50 + Math.sin(a) * 30;
            const on = active === i;
            const quiet = active !== null && !on;
            return (
              <button
                key={c.area}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-describedby={`area-${i}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                className={cn(
                  "absolute w-60 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-4 text-left transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                  on ? "z-10 scale-105 bg-background shadow-lg" : "bg-transparent",
                  quiet && "opacity-40",
                )}
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className={cn("size-2.5 rounded-full transition-colors", on ? "bg-warm" : "bg-primary")} />
                  <span className="text-[10px] font-bold text-muted-foreground">{pad(i)}</span>
                </span>
                <span className="mt-1 block font-display text-lg font-bold leading-snug">{c.area}</span>
                <ul id={`area-${i}`} className={cn("mt-2 space-y-1 text-sm transition-colors", on ? "text-foreground" : "text-muted-foreground")}>
                  {c.items.map((it) => <li key={it}>{it}</li>)}
                </ul>
                {c.people.length > 0 && <span className="mt-2 block text-xs font-semibold text-primary">{c.people.join(", ")}</span>}
              </button>
            );
          })}
        </div>

        {/* Mobile / tablet: stacked */}
        <ol className="mt-12 border-l border-primary/30 lg:hidden">
          {contributions.map((c, i) => (
            <li key={c.area} className="relative pb-10 pl-8 last:pb-0">
              <span aria-hidden="true" className="absolute -left-[5px] top-2 size-2.5 rounded-full bg-primary" />
              <Reveal>
                <p className="text-[10px] font-bold text-muted-foreground">{pad(i)}</p>
                <h3 className="font-display text-xl font-bold">{c.area}</h3>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {c.items.map((it) => <li key={it}>{it}</li>)}
                </ul>
                {c.people.length > 0 && <p className="mt-2 text-xs font-semibold text-primary">{c.people.join(", ")}</p>}
              </Reveal>
            </li>
          ))}
        </ol>
      </PageContainer>
    </section>
  );
}

/* ---------- SCROLL TIMELINE ---------- */

function ScrollTimeline({ steps, id, title, eyebrow, intro }: { steps: { title: string; text?: string }[]; id: string; title: string; eyebrow: string; intro?: string }) {
  const listRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(steps.length - 1);
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const list = listRef.current;
    if (!list || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onScroll = () => {
      const r = list.getBoundingClientRect();
      const focus = window.innerHeight * 0.55;
      const p = Math.max(0, Math.min(1, (focus - r.top) / r.height));
      setProgress(p);
      setActive(Math.min(steps.length - 1, Math.max(0, Math.floor(p * steps.length))));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [steps.length]);

  return (
    <section id={id} aria-labelledby={`${id}-h`} className="border-t border-hairline py-20 md:py-28">
      <PageContainer className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <SectionHead id={id} eyebrow={eyebrow} title={title} intro={intro} />
          </div>
        </div>
        <ol ref={listRef} className="relative lg:col-span-8">
          <span aria-hidden="true" className="absolute bottom-0 left-[1.15rem] top-0 w-px bg-hairline" />
          <span
            aria-hidden="true"
            className="absolute left-[1.15rem] top-0 w-px bg-primary transition-[height] duration-300"
            style={{ height: `${progress * 100}%` }}
          />
          {steps.map((s, i) => {
            const on = i <= active;
            return (
              <li key={s.title} className="relative flex gap-6 pb-12 last:pb-0" aria-current={i === active ? "step" : undefined}>
                <span
                  className={cn(
                    "relative z-10 grid size-10 shrink-0 place-items-center rounded-full border text-xs font-bold transition-colors duration-500",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-hairline bg-background text-muted-foreground",
                  )}
                >
                  {pad(i)}
                </span>
                <div className={cn("pt-1.5 transition-opacity duration-500", on ? "opacity-100" : "opacity-45")}>
                  <h3 className={cn("font-display font-bold tracking-tight transition-all duration-500", i === active ? "text-2xl md:text-3xl" : "text-xl")}>
                    {s.title}
                  </h3>
                  {s.text && <p className="mt-1 max-w-xl leading-relaxed text-muted-foreground">{s.text}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </PageContainer>
    </section>
  );
}

/* ---------- PAGE ---------- */

function StudyTeamPage() {
  const { college, university } = branding.logos;
  return (
    <PageCanvas>
      <header className="relative z-10">
        <PageContainer className="flex flex-wrap items-center justify-between gap-4 py-6">
          <Link to="/" aria-label="NeuroCare Connect home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <BrandMark />
          </Link>
          <nav aria-label="Primary" className="flex flex-wrap items-center gap-1 text-sm">
            <Link to="/" className="rounded-full px-3 py-2 text-muted-foreground hover:text-foreground">Home</Link>
            <Link to="/study" className="rounded-full px-3 py-2 text-muted-foreground hover:text-foreground">The Study</Link>
            <Link to="/study-team" aria-current="page" className="rounded-full px-3 py-2 font-semibold text-foreground">Study Team</Link>
          </nav>
        </PageContainer>
      </header>

      <main className="flex-1 overflow-x-clip">
        {/* HERO */}
        <section aria-labelledby="hero-h" className="relative overflow-hidden bg-ink py-16 text-ink-foreground md:py-24">
          <PageContainer className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-warm">{pageInfo.eyebrow}</p>
              <h1 id="hero-h" className="mt-5 font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl lg:text-7xl">
                {pageInfo.title}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">{pageInfo.intro}</p>
              <p className="mt-8 text-sm font-semibold text-ink-foreground">{heroDetails.context}</p>
              <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
                {heroDetails.facts.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-warm" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mx-auto w-full max-w-md lg:col-span-6 lg:max-w-none">
              <StudyTeamResearchNetwork labels={heroDetails.networkLabels} />
            </div>
          </PageContainer>
        </section>

        {/* ABOUT */}
        <section id="about" aria-labelledby="about-h" className="py-16 md:py-20">
          <PageContainer className="grid gap-8 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <Eyebrow>The project</Eyebrow>
              <h2 id="about-h" className="mt-4 font-display text-3xl font-extrabold tracking-tight">{pageInfo.aboutTitle}</h2>
            </Reveal>
            <Reveal delay={100} className="lg:col-span-7">
              <p className="text-lg leading-relaxed text-muted-foreground">{pageInfo.about}</p>
              <ol aria-label="Study workflow" className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm font-medium">
                {pageInfo.workflow.map((s, i) => (
                  <li key={s} className="flex items-center gap-2">
                    {s}
                    {i < pageInfo.workflow.length - 1 && <span aria-hidden="true" className="h-px w-5 bg-primary/50" />}
                  </li>
                ))}
              </ol>
            </Reveal>
          </PageContainer>
        </section>

        <TeamSection />
        <Ecosystem />
        <ScrollTimeline id="collaboration" eyebrow={sectionText.collaboration.eyebrow} title={sectionText.collaboration.title} steps={collaborationFlow.map((t) => ({ title: t }))} />

        {/* INSTITUTION */}
        <section id="institution" aria-labelledby="institution-h" className="relative overflow-hidden border-t border-hairline bg-ink py-20 text-ink-foreground md:py-28">
          <svg aria-hidden="true" viewBox="0 0 400 400" className="pointer-events-none absolute -right-24 top-1/2 size-[32rem] -translate-y-1/2 text-ink-line">
            {[60, 100, 140, 180].map((r) => <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="currentColor" strokeOpacity="0.5" />)}
            <line x1="20" y1="200" x2="380" y2="200" stroke="currentColor" strokeOpacity="0.4" />
            <line x1="200" y1="20" x2="200" y2="380" stroke="currentColor" strokeOpacity="0.4" />
          </svg>
          <PageContainer className="relative">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-warm">{sectionText.institution.eyebrow}</p>
              <h2 id="institution-h" className="mt-4 font-display text-3xl font-extrabold tracking-tight md:text-5xl">{sectionText.institution.title}</h2>
            </Reveal>
            <div className="mt-12 grid gap-12 lg:grid-cols-12">
              <Reveal className="flex gap-5 lg:col-span-4">
                {[college, university].map((l) => (
                  <figure key={l.alt} className="text-center">
                    <img src={l.src} alt={l.alt} width={96} height={96} className="size-24 rounded-2xl bg-ink-raised object-contain p-2 ring-1 ring-ink-line" loading="lazy" />
                  </figure>
                ))}
              </Reveal>
              <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:col-span-8">
                {[
                  ["College", institution.collegeName],
                  ["University", institution.universityName],
                  ["Department", institution.department],
                  ["Programme", institution.programme],
                  ["Address", institution.address],
                  ["Official contact", institution.email],
                  ["Phone", institution.phone],
                ].map(([k, v], i) => (
                  <Reveal key={k} delay={i * 50} className="border-t border-ink-line pt-3">
                    <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-muted">{k}</dt>
                    <dd className="mt-1.5 text-lg"><T v={v!} /></dd>
                  </Reveal>
                ))}
              </dl>
            </div>
          </PageContainer>
        </section>

        {/* STATEMENT */}
        <section id="statement" aria-labelledby="statement-h" className="py-20 md:py-28">
          <PageContainer className="max-w-4xl">
            <Reveal>
              <Eyebrow>{sectionText.statement.eyebrow}</Eyebrow>
              <h2 id="statement-h" className="mt-4 font-display text-3xl font-extrabold tracking-tight md:text-5xl">{pageInfo.statementTitle}</h2>
              <p className="mt-8 border-l-2 border-warm pl-6 text-xl leading-relaxed text-foreground/80 md:text-2xl">{pageInfo.statement}</p>
            </Reveal>
          </PageContainer>
        </section>

        <ScrollTimeline id="journey" eyebrow={sectionText.journey.eyebrow} title={sectionText.journey.title} steps={projectJourney} />

        {/* ACKNOWLEDGEMENTS */}
        <section id="acknowledgements" aria-labelledby="acknowledgements-h" className="border-t border-hairline bg-card/50 py-20 md:py-28">
          <PageContainer className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHead id="acknowledgements" eyebrow={sectionText.acknowledgements.eyebrow} title={sectionText.acknowledgements.title} intro={acknowledgements.intro} />
            </div>
            <dl className="lg:col-span-7">
              {acknowledgements.entries.map((e, i) => (
                <Reveal key={e.group} delay={i * 60} className="grid gap-1 border-t border-hairline py-5 sm:grid-cols-[14rem_1fr] sm:gap-6">
                  <dt className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{e.group}</dt>
                  <dd className="font-display text-lg font-semibold"><T v={e.names} /></dd>
                </Reveal>
              ))}
            </dl>
          </PageContainer>
        </section>

        {/* AT A GLANCE */}
        <section aria-labelledby="glance-h" className="py-20 md:py-28">
          <PageContainer>
            <Reveal>
              <Eyebrow>Summary</Eyebrow>
              <h2 id="glance-h" className="mt-4 font-display text-3xl font-extrabold tracking-tight md:text-5xl">{sectionText.glance.title}</h2>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{sectionText.glance.statement}</p>
            </Reveal>
            <dl className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
              {projectAtAGlance.map((f) => (
                <div key={f.label} className="bg-background p-6">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{f.label}</dt>
                  <dd className="mt-2 font-display text-xl font-bold">{f.value}</dd>
                </div>
              ))}
            </dl>
            {externalLinks.length > 0 && (
              <ul className="mt-6 space-y-1 text-sm">
                {externalLinks.map((l) => (
                  <li key={l.url}>
                    <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                      {l.label} <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </PageContainer>
        </section>

        {/* CLOSING */}
        <section aria-labelledby="closing-h" className="border-t border-hairline bg-ink py-16 text-ink-foreground">
          <PageContainer className="grid gap-10 md:grid-cols-12">
            <h2 id="closing-h" className="font-display text-2xl font-extrabold tracking-tight md:col-span-6 md:text-3xl">{closing.statement}</h2>
            <dl className="grid gap-6 sm:grid-cols-2 md:col-span-6">
              {closing.items.map((c) => (
                <div key={c.label} className="border-t border-ink-line pt-3">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-warm">{c.label}</dt>
                  <dd className="mt-1.5 text-ink-muted"><T v={c.value} /></dd>
                </div>
              ))}
            </dl>
          </PageContainer>
        </section>
      </main>
      <SiteFooter />
    </PageCanvas>
  );
}
