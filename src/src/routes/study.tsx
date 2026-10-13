import { useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  HeartHandshake,
  Info,
  Lock,
  Shuffle,
} from "lucide-react";
import { PageCanvas, PageContainer } from "@/components/layout/PageCanvas";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StudyHeroVisual } from "@/components/study/StudyHeroVisual";
import {
  about,
  assessments,
  assessmentsSection,
  changeOverTime,
  concepts,
  education,
  faqs,
  faqSection,
  finalCta,
  glance,
  groupsSection,
  hero,
  journeySection,
  journeyStages,
  medicationReview,
  privacy,
  progressRail,
  safetyNotice,
  visits,
  visitsSection,
} from "@/content/study";

const TITLE = "The NeuroCare Connect Study — Neuropathic Pain Research";
const DESC =
  "Learn what the NeuroCare Connect neuropathic pain study involves: the participant journey, assessments, study groups, visits at Baseline, Day 15 and Day 30, and medication review.";

export const Route = createFileRoute("/study")({
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
  component: StudyPage,
});

/* ---------- small helpers ---------- */

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setShown(false);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  tone = "light",
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  tone?: "light" | "plain" | "warm";
}) {
  const bg = tone === "light" ? "bg-card/60" : tone === "warm" ? "bg-warm/15" : "";
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={`scroll-mt-24 py-14 md:py-20 ${bg}`}>
      <PageContainer>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
        <h2 id={`${id}-h`} className="mt-3 max-w-3xl font-display text-3xl font-extrabold tracking-tight md:text-4xl">
          {title}
        </h2>
        {intro && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro}</p>}
        <div className="mt-10">{children}</div>
      </PageContainer>
    </section>
  );
}

/** Tracks which listed element is currently active while scrolling. */
function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? "");
  useEffect(() => {
    const onScroll = () => {
      let current = ids[0] ?? "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ids]);
  return active;
}

/** Activates list items sequentially as they enter the viewport. */
function useStepActivation(count: number) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [activeCount, setActiveCount] = useState(count); // SSR: all visible
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setActiveCount(0);
    const seen = new Set<number>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const idx = Number((e.target as HTMLElement).dataset["step"]);
          if (e.isIntersecting) seen.add(idx);
        });
        setActiveCount(seen.size === 0 ? 0 : Math.max(...seen) + 1);
      },
      { threshold: 0.4 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [count]);
  return { refs, activeCount };
}

/* ---------- assessment visuals (conceptual, no fake content) ---------- */

function AssessmentVisual({ kind }: { kind: (typeof assessments)[number]["kind"] }) {
  const common = "h-20 w-full";
  switch (kind) {
    case "scale":
      return (
        <svg viewBox="0 0 200 80" aria-hidden="true" className={common}>
          <line x1="16" y1="48" x2="184" y2="48" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" />
          {Array.from({ length: 11 }, (_, i) => (
            <line key={i} x1={16 + i * 16.8} y1="40" x2={16 + i * 16.8} y2="56" stroke="var(--brand-deep)" strokeWidth="2" opacity={0.3 + i * 0.07} />
          ))}
        </svg>
      );
    case "document":
      return (
        <svg viewBox="0 0 200 80" aria-hidden="true" className={common}>
          <rect x="60" y="6" width="80" height="68" rx="8" fill="var(--mist)" stroke="var(--brand)" strokeWidth="2" />
          {[20, 34, 48, 62].map((y) => (
            <g key={y}>
              <circle cx="74" cy={y} r="3" fill="var(--brand)" opacity="0.7" />
              <line x1="84" y1={y} x2="128" y2={y} stroke="var(--brand-deep)" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
            </g>
          ))}
        </svg>
      );
    case "life":
      return (
        <svg viewBox="0 0 200 80" aria-hidden="true" className={common}>
          <circle cx="100" cy="40" r="26" fill="none" stroke="var(--brand)" strokeWidth="2.5" />
          <circle cx="100" cy="40" r="10" fill="var(--warm)" opacity="0.8" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <circle
              key={a}
              cx={(100 + 26 * Math.cos((a * Math.PI) / 180)).toFixed(2)}
              cy={(40 + 26 * Math.sin((a * Math.PI) / 180)).toFixed(2)}
              r="4"
              fill="var(--brand)"
              opacity="0.65"
            />
          ))}
        </svg>
      );
    case "review":
      return (
        <svg viewBox="0 0 200 80" aria-hidden="true" className={common}>
          {[18, 38, 58].map((y, i) => (
            <g key={y}>
              <rect x="30" y={y - 6} width="14" height="12" rx="6" fill="var(--brand)" opacity={0.5 + i * 0.15} />
              <line x1="54" y1={y} x2="120" y2={y} stroke="var(--brand-deep)" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
            </g>
          ))}
          <circle cx="140" cy="44" r="18" fill="none" stroke="var(--warm)" strokeWidth="3" />
          <line x1="153" y1="57" x2="166" y2="70" stroke="var(--warm)" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "network":
      return (
        <svg viewBox="0 0 200 80" aria-hidden="true" className={common}>
          <circle cx="100" cy="40" r="8" fill="var(--brand)" />
          {[[40, 18], [40, 62], [160, 18], [160, 62], [100, 10]].map(([x, y], i) => (
            <g key={i}>
              <line x1="100" y1="40" x2={x} y2={y} stroke="var(--brand)" strokeWidth="1.5" opacity="0.5" />
              <circle cx={x} cy={y} r="5" fill="var(--warm)" opacity="0.8" />
            </g>
          ))}
        </svg>
      );
  }
}

/* ---------- page ---------- */

function StudyPage() {
  const railIds = progressRail.map((r) => r.id);
  const activeSection = useScrollSpy(railIds);
  const journey = useStepActivation(journeyStages.length);
  const drp = useStepActivation(medicationReview.flow.length);
  const [arm, setArm] = useState<"control" | "intervention">("intervention");

  return (
    <PageCanvas>
      <header className="relative z-10">
        <PageContainer className="flex flex-wrap items-center justify-between gap-4 py-6">
          <Link to="/" aria-label="NeuroCare Connect home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <BrandMark />
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
            <Link to="/study" className="rounded-full px-3 py-2 font-semibold text-foreground" activeProps={{ "aria-current": "page" }}>
              Study
            </Link>
            <Link to="/study-team" className="rounded-full px-3 py-2 text-muted-foreground hover:text-foreground">
              Study team
            </Link>
            <Link to="/patient" className="rounded-full px-3 py-2 text-muted-foreground hover:text-foreground">
              Patient Education
            </Link>
            <Link to="/research/login" className="hidden rounded-full px-3 py-2 text-muted-foreground hover:text-foreground sm:inline">
              Research portal
            </Link>
          </nav>
        </PageContainer>
      </header>

      {/* scroll progress rail (desktop) */}
      <nav aria-label="Study page sections" className="fixed left-4 top-1/2 z-20 hidden -translate-y-1/2 min-[1560px]:block">
        <ol className="space-y-3">
          {progressRail.map((r, i) => (
            <li key={r.id}>
              <a
                href={`#${r.id}`}
                aria-current={activeSection === r.id ? "true" : undefined}
                className={`group flex items-center gap-2 text-[11px] font-semibold transition-colors ${
                  activeSection === r.id ? "text-primary" : "text-muted-foreground/50 hover:text-muted-foreground"
                }`}
              >
                <span className={`h-px transition-all ${activeSection === r.id ? "w-6 bg-primary" : "w-3 bg-border group-hover:bg-muted-foreground"}`} />
                {String(i + 1).padStart(2, "0")} {r.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <main className="flex-1">
        {/* HERO — dark / atmospheric */}
        <section aria-labelledby="hero-h" className="relative overflow-hidden bg-ink pb-16 pt-10 text-ink-foreground md:pb-24">
          <PageContainer className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-warm">{hero.eyebrow}</p>
              <h1 id="hero-h" className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                {hero.titleA}
                <br />
                <span className="text-brand">{hero.titleB}</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">{hero.intro}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <a href="#journey">
                    {hero.primaryCta} <ArrowDown className="ml-1 size-4" aria-hidden="true" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-ink-line bg-transparent text-ink-foreground hover:bg-ink-raised hover:text-ink-foreground">
                  <Link to="/patient">{hero.secondaryCta}</Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="rounded-full text-ink-muted hover:bg-ink-raised hover:text-ink-foreground">
                  <Link to="/study-team">{hero.tertiaryCta}</Link>
                </Button>
              </div>
            </div>
            <div className="mx-auto w-full max-w-md lg:col-span-6 lg:max-w-none">
              <StudyHeroVisual labels={hero.orbitLabels} />
            </div>
          </PageContainer>
        </section>

        {/* STUDY AT A GLANCE */}
        <section id="study" aria-labelledby="study-h" className="scroll-mt-24 border-b border-hairline bg-card/60 py-12">
          <PageContainer>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{glance.eyebrow}</p>
            <h2 id="study-h" className="mt-3 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
              {glance.title}
            </h2>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {glance.pillars.map((p, k) => (
                <Reveal key={p.label} delay={k * 70}>
                  <div className="h-full rounded-2xl border border-hairline bg-card p-5">
                    <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{p.label}</dt>
                    <dd className="mt-2 font-display text-base font-bold leading-snug">{p.value}</dd>
                  </div>
                </Reveal>
              ))}
            </dl>
          </PageContainer>
        </section>

        {/* WHAT IS THE STUDY — editorial */}
        <Section id="about" eyebrow={about.eyebrow} title={about.title} tone="plain">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <p className="font-display text-2xl font-bold leading-snug tracking-tight text-brand-deep md:text-3xl">
              {about.statement}
            </p>
            <div className="rounded-3xl border border-hairline bg-card p-8">
              <ol className="space-y-0">
                {about.flow.map((step, k) => (
                  <li key={step} className="flex flex-col items-center text-center">
                    <span className={`rounded-full px-5 py-2.5 text-sm font-bold ${k === 2 ? "bg-primary text-primary-foreground" : "bg-mist text-brand-deep"}`}>
                      {step}
                    </span>
                    {k < about.flow.length - 1 && <ArrowDown aria-hidden="true" className="my-2 size-4 text-primary/60" />}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          {/* three core concepts */}
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {concepts.map((c, k) => (
              <Reveal key={c.title} delay={k * 100}>
                <div className={`h-full rounded-3xl border p-7 ${k === 1 ? "border-primary/30 bg-primary/5" : "border-hairline bg-card"}`}>
                  <span aria-hidden="true" className="font-display text-4xl font-extrabold text-primary/25">
                    {String(k + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* PARTICIPANT JOURNEY — scroll-linked timeline */}
        <Section id="journey" eyebrow={journeySection.eyebrow} title={journeySection.title} intro={journeySection.intro} tone="light">
          <div className="grid gap-10 lg:grid-cols-12">
            <ol className="relative space-y-1 lg:col-span-7">
              <span aria-hidden="true" className="absolute bottom-5 left-[1.35rem] top-5 w-px bg-border" />
              <span
                aria-hidden="true"
                className="absolute left-[1.35rem] top-5 w-px bg-primary transition-all duration-500"
                style={{ height: `${Math.max(0, (journey.activeCount - 1) / (journeyStages.length - 1)) * 100}%` }}
              />
              {journeyStages.map((s, k) => {
                const active = k < journey.activeCount;
                const isRand = s.t === "Computerised Randomisation";
                return (
                  <li key={s.n} data-step={k} ref={(el) => { journey.refs.current[k] = el; }}>
                    <div className={`relative flex items-center gap-4 rounded-2xl px-2 py-3 transition-colors ${active ? "" : "opacity-50"}`}>
                      <span
                        className={`relative z-10 grid size-11 shrink-0 place-items-center rounded-full border-2 font-display text-sm font-bold transition-colors ${
                          isRand
                            ? "border-primary bg-primary text-primary-foreground"
                            : active
                              ? "border-primary bg-card text-brand-deep"
                              : "border-border bg-card text-muted-foreground"
                        }`}
                      >
                        {s.n}
                      </span>
                      <span className={`text-sm font-semibold leading-snug md:text-base ${isRand ? "text-primary" : ""}`}>{s.t}</span>
                    </div>
                    {isRand && (
                      <div className="ml-14 mt-1 rounded-2xl border border-primary/30 bg-card p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{groupsSection.randomisation}</p>
                        <div className="mt-3 flex items-center gap-4">
                          <ArrowDown aria-hidden="true" className="size-4 text-primary" />
                          <div className="flex gap-3">
                            <span className="rounded-full bg-mist px-4 py-1.5 text-xs font-bold text-brand-deep">{groupsSection.control.label}</span>
                            <span className="rounded-full bg-primary/15 px-4 py-1.5 text-xs font-bold text-brand-deep">{groupsSection.intervention.label}</span>
                          </div>
                        </div>
                        <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                          <Shuffle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                          {journeySection.randomisationNote}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
            {/* study progress concept */}
            <aside className="lg:col-span-5">
              <div className="sticky top-24 rounded-3xl border border-hairline bg-card p-8">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Study progress</p>
                <ol className="mt-5 space-y-0">
                  {journeySection.progressConcept.map((p, k) => (
                    <li key={p} className="flex flex-col items-start">
                      <span className="flex items-center gap-3">
                        <span aria-hidden="true" className={`size-2.5 rounded-full ${k === 2 ? "bg-primary" : "bg-accent"}`} />
                        <span className="text-sm font-semibold">{p}</span>
                      </span>
                      {k < journeySection.progressConcept.length - 1 && (
                        <span aria-hidden="true" className="ml-[4px] h-6 w-px bg-border" />
                      )}
                    </li>
                  ))}
                </ol>
                <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                  A conceptual view of the workflow — no completion percentages or participant counts are shown.
                </p>
              </div>
            </aside>
          </div>
        </Section>

        {/* ASSESSMENTS — distinct visual objects */}
        <Section id="assessments" eyebrow={assessmentsSection.eyebrow} title={assessmentsSection.title} tone="plain">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {assessments.map((a, k) => (
              <Reveal key={a.t} delay={k * 80} className={k === 3 ? "lg:col-span-2" : ""}>
                <div className="h-full rounded-3xl border border-hairline bg-card p-6">
                  <AssessmentVisual kind={a.kind} />
                  <h3 className="mt-4 font-display text-lg font-bold">{a.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* STUDY GROUPS — branching + toggle */}
        <Section id="groups" eyebrow={groupsSection.eyebrow} title={groupsSection.title} tone="light">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
              <Shuffle className="size-4" aria-hidden="true" /> {groupsSection.randomisation}
            </span>
            <div aria-hidden="true" className="mx-auto mt-1 flex w-full max-w-md items-start justify-center">
              <span className="h-8 w-px bg-primary/50" />
            </div>
            <div aria-hidden="true" className="mx-auto grid w-full max-w-md grid-cols-2">
              <span className="h-px self-start bg-primary/50" />
              <span className="h-px self-start bg-primary/50" />
            </div>
          </div>
          <div role="group" aria-label="Select a study pathway" className="mx-auto mt-6 flex w-fit rounded-full border border-hairline bg-card p-1">
            {(["control", "intervention"] as const).map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={arm === a}
                onClick={() => setArm(a)}
                className={`rounded-full px-5 py-2 text-sm font-bold capitalize transition-colors ${
                  arm === a ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {a === "control" ? groupsSection.control.label : groupsSection.intervention.label}
              </button>
            ))}
          </div>
          <div className="mx-auto mt-6 grid max-w-4xl gap-5 md:grid-cols-2">
            <div
              className={`rounded-3xl border p-7 transition-all duration-500 ${
                arm === "control" ? "border-primary/40 bg-card shadow-md" : "border-hairline bg-card/60 opacity-60"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{groupsSection.control.label}</p>
              <p className="mt-3 leading-relaxed">{groupsSection.control.text}</p>
            </div>
            <div
              className={`rounded-3xl border p-7 transition-all duration-500 ${
                arm === "intervention" ? "border-primary/40 bg-card shadow-md" : "border-hairline bg-card/60 opacity-60"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{groupsSection.intervention.label}</p>
              <p className="mt-3 leading-relaxed">{groupsSection.intervention.text}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {groupsSection.intervention.items.map((x) => (
                  <li key={x} className="flex gap-2">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-6 text-center font-semibold">{groupsSection.assignmentNote}</p>
        </Section>

        {/* STUDY VISITS — three-stage timeline */}
        <Section id="visits" eyebrow={visitsSection.eyebrow} title={visitsSection.title} intro={visitsSection.intro} tone="plain">
          <ol className="grid gap-5 md:grid-cols-3">
            {visits.map((v, k) => (
              <li key={v.t}>
                <Reveal delay={k * 120} className="h-full">
                  <div className="relative h-full overflow-hidden rounded-3xl border border-hairline bg-card p-7">
                    <span aria-hidden="true" className="font-display text-6xl font-extrabold text-primary/15">
                      {String(k + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-2 font-display text-2xl font-extrabold">{v.t}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{v.d}</p>
                    {k < visits.length - 1 && (
                      <ArrowRight aria-hidden="true" className="absolute -right-3 top-1/2 hidden size-6 -translate-y-1/2 text-primary/40 md:block" />
                    )}
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </Section>

        {/* CHANGE OVER TIME */}
        <Section id="change" eyebrow={changeOverTime.eyebrow} title={changeOverTime.title} tone="light">
          <div className="rounded-3xl border border-hairline bg-card p-8">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-5">
              {visits.map((v, k) => (
                <div key={v.t} className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
                  <span className="rounded-full border-2 border-primary/40 px-6 py-3 font-display text-lg font-bold">{v.t}</span>
                  {k < visits.length - 1 && <ArrowRight aria-hidden="true" className="size-5 rotate-90 text-primary sm:rotate-0" />}
                </div>
              ))}
            </div>
            {/* abstract changing data points — no numbers */}
            <svg viewBox="0 0 600 90" aria-hidden="true" className="mx-auto mt-8 w-full max-w-xl">
              <line x1="60" y1="70" x2="540" y2="70" stroke="var(--border)" strokeWidth="2" />
              {[60, 300, 540].map((x) => (
                <line key={x} x1={x} y1="62" x2={x} y2="78" stroke="var(--brand-deep)" strokeWidth="2" />
              ))}
              <path d="M60 55 C 160 55, 200 35, 300 40 C 400 45, 460 22, 540 28" fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 7" />
              {[[60, 55], [300, 40], [540, 28]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="5" fill="var(--brand)" />
              ))}
            </svg>
            <p className="mx-auto mt-6 max-w-2xl text-center leading-relaxed text-muted-foreground">{changeOverTime.text}</p>
          </div>
        </Section>

        {/* MEDICATION REVIEW / DRP WORKFLOW — scroll-activated */}
        <Section id="medication-review" eyebrow={medicationReview.eyebrow} title={medicationReview.title} tone="plain">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-primary/30 bg-primary/5 p-7">
                <Info className="size-6 text-primary" aria-hidden="true" />
                <p className="mt-4 font-display text-lg font-bold leading-relaxed">{medicationReview.explanation}</p>
              </div>
              <div className="mt-5 rounded-3xl border border-hairline bg-card p-7">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{medicationReview.pcneLabel}</p>
                <svg viewBox="0 0 240 70" aria-hidden="true" className="mt-4 w-full">
                  <rect x="4" y="8" width="70" height="24" rx="6" fill="var(--mist)" stroke="var(--brand)" strokeWidth="1.5" />
                  <rect x="86" y="8" width="70" height="24" rx="6" fill="var(--mist)" stroke="var(--brand)" strokeWidth="1.5" />
                  <rect x="168" y="8" width="68" height="24" rx="6" fill="var(--mist)" stroke="var(--brand)" strokeWidth="1.5" />
                  <rect x="45" y="40" width="70" height="24" rx="6" fill="var(--warm)" opacity="0.35" stroke="var(--warm)" strokeWidth="1.5" />
                  <rect x="127" y="40" width="70" height="24" rx="6" fill="var(--warm)" opacity="0.35" stroke="var(--warm)" strokeWidth="1.5" />
                </svg>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{medicationReview.pcneNote}</p>
              </div>
            </div>
            <ol className="relative space-y-2 lg:col-span-7">
              <span aria-hidden="true" className="absolute bottom-6 left-[1.15rem] top-6 w-px bg-border" />
              {medicationReview.flow.map((step, k) => {
                const active = k < drp.activeCount;
                return (
                  <li key={step} data-step={k} ref={(el) => { drp.refs.current[k] = el; }} className={`relative flex items-center gap-4 transition-opacity duration-500 ${active ? "" : "opacity-40"}`}>
                    <span
                      className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-full border-2 font-display text-xs font-bold ${
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"
                      }`}
                    >
                      {k + 1}
                    </span>
                    <span className={`rounded-2xl border px-5 py-3 text-sm font-semibold ${active ? "border-hairline bg-card" : "border-transparent"}`}>
                      {step}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </Section>

        {/* EDUCATION — warm transition */}
        <Section id="education" eyebrow={education.eyebrow} title={education.title} intro={education.text} tone="warm">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-hairline bg-card p-7">
              <BookOpen className="size-6 text-primary" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg font-bold">{education.preparationTitle}</h3>
              <p className="mt-2 font-semibold text-brand-deep">{education.preparationText}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{education.preparationDetail}</p>
            </div>
            <div className="flex flex-col justify-between rounded-3xl border border-hairline bg-card p-7">
              <div>
                <HeartHandshake className="size-6 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-display text-lg font-bold">{hero.secondaryCta}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Visit the patient area for resources available to patients.
                </p>
              </div>
              <Button asChild className="mt-6 w-fit rounded-full">
                <Link to="/patient">
                  {education.patientAreaCta} <ArrowRight className="ml-1 size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </Section>

        {/* SAFETY NOTICE — prominent but calm */}
        <section aria-labelledby="safety-h" className="py-12">
          <PageContainer>
            <div className="rounded-3xl border border-hairline bg-mist p-8 md:p-10">
              <h2 id="safety-h" className="flex items-center gap-3 font-display text-2xl font-extrabold">
                <Info className="size-6 text-primary" aria-hidden="true" /> {safetyNotice.title}
              </h2>
              <ul className="mt-5 grid gap-3 text-base leading-relaxed text-foreground/80 md:grid-cols-2">
                {safetyNotice.items.map((x) => (
                  <li key={x} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </PageContainer>
        </section>

        {/* PRIVACY */}
        <section id="privacy" aria-labelledby="privacy-h" className="scroll-mt-24 py-12">
          <PageContainer>
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <h2 id="privacy-h" className="flex items-center gap-3 font-display text-2xl font-extrabold md:text-3xl">
                  <Lock className="size-6 text-primary" aria-hidden="true" /> {privacy.title}
                </h2>
                <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">{privacy.text}</p>
                <div className="mt-6 rounded-2xl border border-hairline bg-card p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{privacy.statusTitle}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{privacy.statusText}</p>
                </div>
              </div>
              <ol className="mx-auto w-full max-w-sm">
                {privacy.flow.map((step, k) => (
                  <li key={step} className="flex flex-col items-center text-center">
                    <span className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold ${k === 1 ? "border-primary/40 bg-primary/5 text-brand-deep" : "border-hairline bg-card"}`}>
                      {step}
                    </span>
                    {k < privacy.flow.length - 1 && <ArrowDown aria-hidden="true" className="my-2 size-4 text-primary/60" />}
                  </li>
                ))}
              </ol>
            </div>
          </PageContainer>
        </section>

        {/* FAQ */}
        <Section id="faq" eyebrow={faqSection.eyebrow} title={faqSection.title} tone="light">
          <Accordion type="single" collapsible className="max-w-3xl rounded-3xl border border-hairline bg-card px-6">
            {faqs.map(([q, a], k) => (
              <AccordionItem key={q} value={`q${k}`} className={k === faqs.length - 1 ? "border-b-0" : ""}>
                <AccordionTrigger className="text-left font-semibold">{q}</AccordionTrigger>
                <AccordionContent className="leading-relaxed text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>

        {/* FINAL CTA */}
        <section id="contact" aria-labelledby="cta-h" className="scroll-mt-24 py-14">
          <PageContainer>
            <div className="rounded-[2rem] bg-ink px-6 py-14 text-center text-ink-foreground md:px-12">
              <h2 id="cta-h" className="font-display text-3xl font-extrabold md:text-4xl">{finalCta.title}</h2>
              <p className="mx-auto mt-3 max-w-xl text-ink-muted">{finalCta.text}</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
                {finalCta.actions.map((a) =>
                  "anchor" in a ? (
                    <Button key={a.label} asChild size="lg" variant="secondary" className="rounded-full">
                      <a href={a.anchor}>{a.label}</a>
                    </Button>
                  ) : (
                    <Button key={a.label} asChild size="lg" variant="secondary" className="rounded-full">
                      <Link to={a.to}>{a.label}</Link>
                    </Button>
                  ),
                )}
              </div>
              <div className="mx-auto mt-10 max-w-md rounded-2xl border border-ink-line bg-ink-raised/60 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-muted">{finalCta.contactTitle}</p>
                <p className="mt-2 text-sm text-ink-muted">{finalCta.contactText}</p>
              </div>
            </div>
          </PageContainer>
        </section>
      </main>
      <SiteFooter />
    </PageCanvas>
  );
}
