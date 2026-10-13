import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ClipboardList,
  FileSearch,
  GitBranch,
  HeartHandshake,
  KeyRound,
  Languages,
  Layers,
  LayoutDashboard,
  Lock,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { NeuralSculpture } from "@/components/home/NeuralSculpture";
import { Reveal, useInView } from "@/components/common/Reveal";
import { Button } from "@/components/ui/button";
import { branding } from "@/config/branding";
import { cn } from "@/lib/utils";
import {
  assessments,
  cta,
  groups,
  hero,
  medicationReview,
  platform,
  principles,
  security,
  studyJourney,
} from "@/content/home";

// All homepage wording lives in src/content/home.ts.

const TITLE = "NeuroCare Connect — Neuropathic Pain Research Platform";
const DESC =
  "A structured digital platform connecting patient education with the workflow of an academic neuropathic pain research study.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

/* ---------------- shared bits ---------------- */

function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-6 lg:px-10", className)}>{children}</div>;
}

function Eyebrow({ children, onInk }: { children: ReactNode; onInk?: boolean }) {
  return (
    <p className={cn("text-[11px] font-semibold uppercase tracking-[0.22em]", onInk ? "text-warm" : "text-accent")}>
      {children}
    </p>
  );
}

function H2({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} className={cn("mt-4 max-w-3xl font-display text-3xl font-semibold leading-[1.1] tracking-tight md:text-5xl", className)}>
      {children}
    </h2>
  );
}

const navLinks = [
  { to: "/study", label: "The Study" },
  { to: "/study-team", label: "Study Team" },
  { to: "/patient", label: "Patient Education" },
  { to: "/research/login", label: "Research Portal" },
  { to: "/patient/language", label: "Language" },
] as const;

/* ---------------- page ---------------- */

function Landing() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <Hero />
      <main className="flex-1">
        <PlatformSection />
        <StudySection />
        <AssessmentSection />
        <MedicationSection />
        <GroupsSection />
        <SecuritySection />
        <PrinciplesSection />
        <CtaSection />
      </main>
      <HomeFooter />
    </div>
  );
}

/* ---------------- 1. hero ---------------- */

function Hero() {
  return (
    <section aria-labelledby="hero-h" className="relative isolate overflow-hidden bg-ink text-ink-foreground">
      {/* atmosphere: fine grid + soft light, no neon */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(var(--ink-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--ink-foreground) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 70% 40%, black 20%, transparent 70%)",
          }}
        />
        <div className="absolute -right-40 top-10 size-[640px] rounded-full opacity-25 blur-3xl" style={{ background: "var(--primary)" }} />
        <div className="absolute -left-32 bottom-0 size-[420px] rounded-full opacity-10 blur-3xl" style={{ background: "var(--warm)" }} />
      </div>

      <Container className="nc-rise flex flex-wrap items-center justify-between gap-4 py-6">
        <Link to="/" aria-label="NeuroCare Connect home" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm">
          <BrandMark subtitle={null} />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-3.5 py-2 text-sm text-ink-muted transition-colors hover:text-ink-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="sm" variant="secondary" className="rounded-full">
          <Link to="/patient">Enter portals</Link>
        </Button>
        <nav aria-label="Primary (mobile)" className="-mx-1 flex w-full gap-1 overflow-x-auto pb-1 lg:hidden">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="shrink-0 rounded-full border border-ink-line px-3 py-1.5 text-xs text-ink-muted">
              {l.label}
            </Link>
          ))}
        </nav>
      </Container>

      <Container className="grid items-center gap-10 pb-24 pt-8 lg:grid-cols-12 lg:pb-32 lg:pt-14">
        <div className="lg:col-span-6">
          <div className="nc-rise" style={{ animationDelay: "80ms" }}>
            <Eyebrow onInk>{hero.eyebrow}</Eyebrow>
          </div>
          <h1
            id="hero-h"
            className="nc-rise mt-6 font-display text-[2.6rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.4rem]"
            style={{ animationDelay: "160ms" }}
          >
            {hero.headingLine1}
            <span className="mt-2 block text-ink-muted">{hero.headingLine2}</span>
          </h1>
          <p className="nc-rise mt-7 max-w-lg text-lg leading-relaxed text-ink-muted" style={{ animationDelay: "260ms" }}>
            {hero.text}
          </p>
          <div className="nc-rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "360ms" }}>
            <Button asChild size="lg" className="rounded-full">
              <Link to="/study">
                {hero.primaryCta} <ArrowRight className="ml-1 size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-full">
              <Link to="/patient">{hero.secondaryCta}</Link>
            </Button>
            <Link
              to="/research/login"
              className="ml-1 inline-flex items-center gap-1 rounded text-sm text-ink-muted underline-offset-4 hover:text-ink-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm"
            >
              {hero.tertiaryLink} <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="nc-rise relative lg:col-span-6" style={{ animationDelay: "500ms" }}>
          <NeuralSculpture stages={hero.workflowStages} />
        </div>
      </Container>

      <a
        href="#platform"
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 rounded text-[11px] uppercase tracking-[0.2em] text-ink-muted hover:text-ink-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm md:flex"
      >
        {hero.scrollHint}
        <ArrowDown className="nc-nudge size-4" aria-hidden="true" />
      </a>
    </section>
  );
}

/* ---------------- 2. platform / two portals ---------------- */

function PlatformSection() {
  const [active, setActive] = useState<"patient" | "research" | null>(null);
  const sides = [
    { key: "patient" as const, data: platform.patient, icons: [BookOpen, HeartHandshake, Languages], to: "/patient" as const },
    { key: "research" as const, data: platform.research, icons: [ClipboardList, FileSearch, LayoutDashboard], to: "/research/login" as const },
  ];
  return (
    <section id="platform" aria-labelledby="platform-h" className="scroll-mt-6 py-24 md:py-32">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Eyebrow>{platform.eyebrow}</Eyebrow>
            <H2 id="platform-h">{platform.heading}</H2>
          </div>
          <p className="self-end text-lg leading-relaxed text-muted-foreground lg:col-span-5">{platform.text}</p>
        </div>

        <div className="mt-14 flex flex-col gap-4 md:h-[440px] md:flex-row" onMouseLeave={() => setActive(null)}>
          {sides.map(({ key, data, icons, to }) => {
            const isResearch = key === "research";
            const grow = active === null ? "md:flex-1" : active === key ? "md:flex-[1.45]" : "md:flex-[0.8]";
            return (
              <article
                key={key}
                onMouseEnter={() => setActive(key)}
                onFocus={() => setActive(key)}
                className={cn(
                  "group relative flex flex-col justify-between overflow-hidden rounded-[2rem] p-8 transition-all duration-500 ease-out motion-reduce:transition-none md:p-10",
                  grow,
                  isResearch ? "bg-ink text-ink-foreground" : "border border-hairline bg-card",
                )}
              >
                <div>
                  <p className={cn("text-[11px] font-semibold uppercase tracking-[0.2em]", isResearch ? "text-warm" : "text-accent")}>
                    {data.traits.join(" · ")}
                  </p>
                  <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight">{data.title}</h3>
                  <p className={cn("mt-2 text-lg", isResearch ? "text-ink-muted" : "text-muted-foreground")}>{data.tagline}</p>
                </div>
                <ul className="mt-8 space-y-3">
                  {data.features.map((f, i) => {
                    const Icon = icons[i]!;
                    return (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "grid size-9 place-items-center rounded-xl transition-transform duration-500 group-hover:scale-105",
                            isResearch ? "bg-ink-raised text-warm" : "bg-mist text-brand-deep",
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        {f}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-8">
                  <Button asChild variant={isResearch ? "secondary" : "default"} className="rounded-full">
                    <Link to={to}>
                      {data.cta} <ArrowRight className="ml-1 size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ---------------- 3. study timeline ---------------- */

function StudySection() {
  const [sel, setSel] = useState(0);
  const stage = studyJourney.stages[sel]!;
  return (
    <section aria-labelledby="study-h" className="border-y border-hairline bg-card/60 py-24 md:py-32">
      <Container>
        <Eyebrow>{studyJourney.eyebrow}</Eyebrow>
        <H2 id="study-h">{studyJourney.heading}</H2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{studyJourney.text}</p>

        <div className="mt-14 grid gap-10 lg:grid-cols-12">
          <ol className="relative lg:col-span-8" aria-label="Study stages">
            <span aria-hidden="true" className="absolute bottom-3 left-[11px] top-3 w-px bg-border" />
            {studyJourney.stages.map((s, i) => (
              <li key={s.name}>
                <button
                  type="button"
                  onClick={() => setSel(i)}
                  onMouseEnter={() => setSel(i)}
                  aria-pressed={sel === i}
                  className="group relative flex w-full items-center gap-5 rounded-xl py-2.5 pr-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative z-10 grid size-6 place-items-center rounded-full border-2 transition-all",
                      sel === i ? "scale-110 border-primary bg-primary" : i < sel ? "border-primary bg-card" : "border-border bg-card",
                    )}
                  >
                    {sel === i && <span className="size-1.5 rounded-full bg-primary-foreground" />}
                  </span>
                  <span className="w-8 text-xs tabular-nums text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span
                    className={cn(
                      "font-display text-xl tracking-tight transition-colors md:text-2xl",
                      sel === i ? "font-semibold text-foreground" : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {s.name}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div className="lg:col-span-4">
            <div className="sticky top-8 rounded-3xl bg-ink p-8 text-ink-foreground" aria-live="polite">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-warm">
                Stage {String(sel + 1).padStart(2, "0")} of {studyJourney.stages.length}
              </p>
              <p className="mt-4 font-display text-3xl font-semibold">{stage.name}</p>
              <p className="mt-3 leading-relaxed text-ink-muted">{stage.note}</p>
              <div className="mt-6 h-1 overflow-hidden rounded-full bg-ink-raised">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${((sel + 1) / studyJourney.stages.length) * 100}%` }} />
              </div>
              <Link to="/study" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-warm hover:underline">
                Read about the study <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------------- 4. assessments ---------------- */

function AssessmentSection() {
  return (
    <section aria-labelledby="assess-h" className="py-24 md:py-32">
      <Container className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow>{assessments.eyebrow}</Eyebrow>
          <H2 id="assess-h">{assessments.heading}</H2>
        </div>
        <div className="lg:col-span-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{assessments.capabilityLabel}</p>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {assessments.items.map((a, i) => (
              <li key={a.code}>
                <Reveal delay={i * 80} className="group flex items-center justify-between gap-6 py-6">
                  <div className="flex items-baseline gap-5">
                    <span className="w-6 text-xs tabular-nums text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="font-display text-2xl font-semibold tracking-tight transition-colors group-hover:text-primary md:text-3xl">{a.code}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{a.label}</p>
                    </div>
                  </div>
                  <span aria-label="Supported" className="grid size-9 shrink-0 place-items-center rounded-full bg-mist text-brand-deep">
                    <Check className="size-4" aria-hidden="true" />
                  </span>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

/* ---------------- 5. medication review flow ---------------- */

function MedicationSection() {
  const [ref, inView] = useInView<HTMLOListElement>();
  return (
    <section aria-labelledby="med-h" className="bg-mist/60 py-24 md:py-32">
      <Container>
        <Eyebrow>{medicationReview.eyebrow}</Eyebrow>
        <H2 id="med-h">{medicationReview.heading}</H2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{medicationReview.text}</p>

        <ol ref={ref} className="relative mt-16 grid gap-8 lg:grid-cols-6 lg:gap-4">
          <span aria-hidden="true" className="absolute left-[19px] top-0 h-full w-px bg-border lg:left-0 lg:top-[19px] lg:h-px lg:w-full" />
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-[19px] top-0 w-px bg-primary transition-all duration-[1600ms] ease-out motion-reduce:transition-none lg:left-0 lg:top-[19px] lg:h-px",
              inView ? "h-full lg:w-full" : "h-0 lg:w-0",
            )}
          />
          {medicationReview.steps.map((s, i) => (
            <li key={s} className="relative flex items-start gap-5 lg:flex-col lg:gap-5">
              <span
                className={cn(
                  "relative z-10 grid size-10 shrink-0 place-items-center rounded-full border font-display text-sm font-semibold transition-all duration-500",
                  inView ? "border-primary bg-card text-primary" : "border-border bg-card text-muted-foreground",
                )}
                style={{ transitionDelay: `${i * 220}ms` }}
              >
                {i + 1}
              </span>
              <p className="pt-2 font-display text-lg font-medium leading-snug lg:pt-0">{s}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* ---------------- 6. groups / branching pathway ---------------- */

function GroupsSection() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const path = (d: string, delay: number) => (
    <path
      d={d}
      pathLength={1}
      className="stroke-primary"
      strokeWidth="2"
      fill="none"
      strokeDasharray="1"
      strokeDashoffset={inView ? 0 : 1}
      style={{ transition: `stroke-dashoffset 1.2s ease-out ${delay}ms` }}
    />
  );
  return (
    <section aria-labelledby="groups-h" className="py-24 md:py-32">
      <Container>
        <div className="text-center">
          <Eyebrow>{groups.eyebrow}</Eyebrow>
          <H2 id="groups-h" className="mx-auto">{groups.heading}</H2>
        </div>

        <div ref={ref} className="mx-auto mt-16 max-w-4xl">
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground">
              <GitBranch className="size-4 text-warm" aria-hidden="true" /> Randomisation
            </span>
          </div>
          <svg viewBox="0 0 400 60" className="h-14 w-full" preserveAspectRatio="none" aria-hidden="true">
            {path("M200 0 C200 30, 100 30, 100 60", 0)}
            {path("M200 0 C200 30, 300 30, 300 60", 0)}
          </svg>
          <div className="grid gap-4 sm:grid-cols-2">
            {[groups.control, groups.intervention].map((g, gi) => (
              <div key={g.title} className={cn("rounded-3xl p-7", gi ? "border border-primary/30 bg-card" : "border border-hairline bg-card")}>
                <p className={cn("text-[11px] font-semibold uppercase tracking-[0.2em]", gi ? "text-primary" : "text-muted-foreground")}>{g.title}</p>
                <ol className="mt-5 space-y-0">
                  {g.steps.map((s, i) => (
                    <li key={s} className="relative flex items-center gap-3 pb-3 text-sm last:pb-0">
                      {i < g.steps.length - 1 && <span aria-hidden="true" className="absolute left-[5px] top-4 h-full w-px bg-border" />}
                      <span aria-hidden="true" className={cn("relative z-10 size-[11px] rounded-full border-2 bg-card", s.startsWith("Day") ? "border-primary" : "border-border")} />
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          <svg viewBox="0 0 400 60" className="h-14 w-full" preserveAspectRatio="none" aria-hidden="true">
            {path("M100 0 C100 30, 200 30, 200 60", 600)}
            {path("M300 0 C300 30, 200 30, 200 60", 600)}
          </svg>
          <div className="flex justify-center">
            <span className="rounded-full border border-primary/40 bg-card px-5 py-2.5 text-sm font-semibold">Follow-up · Day 15 · Day 30</span>
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">{groups.note}</p>
        </div>
      </Container>
    </section>
  );
}

/* ---------------- 7. security ---------------- */

function SecuritySection() {
  const icons = [Layers, KeyRound, ShieldCheck];
  return (
    <section aria-labelledby="sec-h" className="border-t border-hairline bg-card/60 py-24 md:py-32">
      <Container className="grid items-center gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow>{security.eyebrow}</Eyebrow>
          <H2 id="sec-h">{security.heading}</H2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{security.text}</p>
          <ul className="mt-10 space-y-6">
            {security.principles.map((p, i) => {
              const Icon = icons[i]!;
              return (
                <li key={p.title} className="flex gap-4">
                  <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-mist text-brand-deep">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="font-display font-semibold">{p.title}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{p.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="lg:col-span-7">
          <SeparationDiagram />
        </div>
      </Container>
    </section>
  );
}

function SeparationDiagram() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const Node = ({ children, dark, className }: { children: ReactNode; dark?: boolean; className?: string }) => (
    <div className={cn("rounded-2xl px-4 py-3 text-center text-sm font-medium", dark ? "bg-ink text-ink-foreground" : "border border-hairline bg-card", className)}>
      {children}
    </div>
  );
  const Line = ({ delay = 0 }: { delay?: number }) => (
    <div aria-hidden="true" className="mx-auto h-8 w-px overflow-hidden bg-border">
      <div className={cn("w-px bg-primary transition-all duration-700 motion-reduce:transition-none", inView ? "h-full" : "h-0")} style={{ transitionDelay: `${delay}ms` }} />
    </div>
  );
  return (
    <div ref={ref} role="img" aria-label="Diagram: NeuroCare Connect splits into a public patient experience and a restricted research experience protected by sign-in and permissions" className="rounded-[2rem] border border-hairline bg-background p-6 md:p-10">
      <Node dark className="mx-auto max-w-xs">NeuroCare Connect</Node>
      <Line />
      <div className="mx-auto h-px w-1/2 bg-border" aria-hidden="true" />
      <div className="grid grid-cols-2 gap-4 md:gap-10">
        <div>
          <Line delay={200} />
          <Node>Patient experience</Node>
          <Line delay={400} />
          <Node className="text-muted-foreground">Public / patient</Node>
          <Line delay={600} />
          <Node className="text-muted-foreground">Education &amp; information</Node>
        </div>
        <div>
          <Line delay={200} />
          <Node dark>Research experience</Node>
          <Line delay={400} />
          <Node className="flex items-center justify-center gap-1.5">
            <Lock className="size-3.5 text-primary" aria-hidden="true" /> Restricted
          </Node>
          <Line delay={600} />
          <Node className="text-muted-foreground">Study records</Node>
          <Line delay={800} />
          <Node className="flex items-center justify-center gap-1.5 text-muted-foreground">
            <KeyRound className="size-3.5" aria-hidden="true" /> Sign-in + permissions
          </Node>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 8. principles strip ---------------- */

function PrinciplesSection() {
  return (
    <section aria-labelledby="pr-h" className="py-24 md:py-28">
      <Container>
        <h2 id="pr-h" className="max-w-2xl font-display text-3xl font-semibold tracking-tight md:text-4xl">{principles.heading}</h2>
        <ul className="mt-12 grid border-t border-border sm:grid-cols-2 lg:grid-cols-5">
          {principles.items.map((p, i) => (
            <li key={p.title} className="border-b border-border py-7 pr-6 lg:border-b-0 lg:border-r lg:pl-6 lg:first:pl-0 lg:last:border-r-0">
              <Reveal delay={i * 90}>
                <p className="text-xs tabular-nums text-accent">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-3 font-display text-xl font-semibold">{p.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------------- 9. CTA ---------------- */

function CtaSection() {
  const cards = [
    { ...cta.study, to: "/study" as const, icon: RouteIcon },
    { ...cta.patient, to: "/patient" as const, icon: HeartHandshake },
    { ...cta.research, to: "/research/login" as const, icon: Lock },
  ];
  return (
    <section aria-labelledby="cta-h" className="px-4 pb-8 sm:px-6">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-ink px-6 py-20 text-ink-foreground md:px-14">
        <div aria-hidden="true" className="absolute -right-24 -top-24 size-96 rounded-full opacity-20 blur-3xl" style={{ background: "var(--primary)" }} />
        <div className="relative">
          <Eyebrow onInk>
            <span className="inline-flex items-center gap-2"><Sparkles className="size-3.5" aria-hidden="true" /> Get started</span>
          </Eyebrow>
          <h2 id="cta-h" className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-6xl">{cta.heading}</h2>
          <p className="mt-4 max-w-xl text-lg text-ink-muted">{cta.text}</p>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {cards.map((c) => (
              <Link
                key={c.title}
                to={c.to}
                className="group rounded-3xl border border-ink-line bg-ink-raised/60 p-6 transition-all hover:-translate-y-1 hover:border-warm/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm motion-reduce:hover:translate-y-0"
              >
                <c.icon className="size-5 text-warm" aria-hidden="true" />
                <p className="mt-6 flex items-center justify-between font-display text-xl font-semibold">
                  {c.title}
                  <ArrowUpRight className="size-5 text-ink-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink-foreground" aria-hidden="true" />
                </p>
                <p className="mt-2 text-sm text-ink-muted">{c.text}</p>
              </Link>
            ))}
          </div>
          <Link to="/study-team" className="mt-10 inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink-foreground hover:underline">
            <Users className="size-4" aria-hidden="true" /> {cta.teamLink} <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- footer ---------------- */

function HomeFooter() {
  return (
    <footer className="py-12">
      <Container className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-lg font-semibold">{branding.app.name}</p>
          <p className="text-sm text-muted-foreground">{branding.app.tagline}</p>
          <p className="mt-4 text-xs text-muted-foreground">© {new Date().getFullYear()} {branding.app.name}.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
      </Container>
    </footer>
  );
}
