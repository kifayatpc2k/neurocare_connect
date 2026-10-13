import { Link } from "@tanstack/react-router";
import { ArrowRight, Brain, ClipboardList, Flame, Hand, MessageCircle, Pill, Stethoscope, Zap, Waves, CircleSlash, Search, Users, RefreshCw } from "lucide-react";
import type { DiagramId } from "@/content/patient/library";
import { journeyStages } from "@/content/study";
import { useTx } from "@/i18n/PatientLanguage";

function Figure({ title, caption, children }: { title: string; caption: string; children: React.ReactNode }) {
  const tx = useTx();
  return (
    <figure className="rounded-3xl border border-hairline bg-surface p-5 md:p-7 print:break-inside-avoid">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{tx("Diagram")}</p>
      <p className="mt-1 font-display text-lg font-bold">{title}</p>
      <div className="mt-5">{children}</div>
      <figcaption className="mt-5 text-sm leading-relaxed text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

/** Visual 1 — body → nerve → spinal cord → brain. Text alternative is the ordered list itself. */
export function NerveSignalDiagram() {
  const tx = useTx();
  const steps = [
    { icon: Hand, label: tx("Body sensation"), text: tx("Skin and tissues detect touch, temperature and pain.") },
    { icon: Waves, label: tx("Peripheral nerve"), text: tx("Nerves carry the signal towards the spinal cord.") },
    { icon: Zap, label: tx("Spinal cord"), text: tx("Signals pass up through the spinal cord.") },
    { icon: Brain, label: tx("Brain"), text: tx("The brain processes the signal into what you feel.") },
  ];
  return (
    <Figure title={tx("How nerve signals travel")} caption={tx("A simplified picture. Changes in how nerves send signals, or how the nervous system processes them, can change what a person feels. Nerve pain does not always come from one single place along this path.")}>
      <ol className="grid gap-3 sm:grid-cols-4" aria-label={tx("Path of a nerve signal")}>
        {steps.map((s, i) => (
          <li key={s.label} className="relative flex gap-3 sm:flex-col">
            <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-primary bg-background text-primary">
              <s.icon className="size-5" />
            </span>
            {i < steps.length - 1 ? <span aria-hidden="true" className="absolute start-[calc(3rem+0.25rem)] end-1 top-6 hidden h-0.5 bg-primary/40 sm:block" /> : null}
            <span>
              <span className="block font-semibold">{i + 1}. {s.label}</span>
              <span className="block text-sm text-muted-foreground">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </Figure>
  );
}

/** Visual 2 — ways nerve pain may feel. */
export function SensationsDiagram() {
  const tx = useTx();
  const items = [
    { icon: Flame, label: tx("Burning"), text: tx("A hot or burning feeling") },
    { icon: Waves, label: tx("Tingling"), text: tx("Pins and needles") },
    { icon: Zap, label: tx("Shooting"), text: tx("Sudden, electric-shock-like pain") },
    { icon: CircleSlash, label: tx("Numbness"), text: tx("Reduced or lost feeling") },
    { icon: Hand, label: tx("Sensitive to touch"), text: tx("Light touch or temperature feels painful") },
  ];
  return (
    <Figure title={tx("Different ways nerve pain may feel")} caption={tx("Examples only. People experience nerve pain differently, and not everyone has all of these. This is not a diagnostic tool.")}>
      <ul className="grid gap-3 sm:grid-cols-5">
        {items.map((s) => (
          <li key={s.label} className="flex items-center gap-3 rounded-2xl border border-hairline bg-background p-3 sm:flex-col sm:text-center">
            <s.icon aria-hidden="true" className="size-6 shrink-0 text-accent" />
            <span><span className="block font-semibold">{s.label}</span><span className="block text-xs text-muted-foreground">{s.text}</span></span>
          </li>
        ))}
      </ul>
    </Figure>
  );
}

/** Visual 4 — what happens during a medication review. */
export function MedicationReviewDiagram() {
  const tx = useTx();
  const steps = [
    { icon: Pill, label: tx("Current medicines and relevant history") },
    { icon: Search, label: tx("Structured review") },
    { icon: ClipboardList, label: tx("Possible medicine-related problems identified") },
    { icon: Users, label: tx("Discussion with the healthcare team") },
    { icon: RefreshCw, label: tx("Follow-up where appropriate") },
  ];
  return (
    <Figure title={tx("What happens during a medication review?")} caption={tx("A general outline — reviews do not all follow exactly the same steps. Finding a possible problem does not automatically mean a medicine is wrong or will be changed.")}>
      <ol className="flex flex-col gap-2 md:flex-row md:items-stretch">
        {steps.map((s, i) => (
          <li key={s.label} className="flex flex-1 items-center gap-2 md:flex-col">
            <span className="flex flex-1 items-center gap-3 rounded-2xl border border-hairline bg-background p-3 md:w-full md:flex-col md:text-center">
              <s.icon aria-hidden="true" className="size-5 shrink-0 text-primary" />
              <span className="text-sm font-semibold">{s.label}</span>
            </span>
            {i < steps.length - 1 ? <ArrowRight aria-hidden="true" className="hidden size-4 shrink-0 text-muted-foreground md:hidden" /> : null}
          </li>
        ))}
      </ol>
    </Figure>
  );
}

/** Visual 3 — learning pathway; every stage links to a real page. */
export function LearningPathway() {
  const tx = useTx();
  const stages = [
    { icon: Hand, label: tx("Understand symptoms"), slug: "how-nerve-pain-can-feel" },
    { icon: Stethoscope, label: tx("Learn about assessment"), slug: "how-assessment-works" },
    { icon: Pill, label: tx("Understand medicines"), slug: "why-nerve-pain-medicines-differ" },
    { icon: ClipboardList, label: tx("Prepare questions"), slug: "questions-about-medicines" },
    { icon: MessageCircle, label: tx("Speak with a healthcare professional"), slug: "appointment-preparation" },
  ];
  return (
    <nav aria-label={tx("Learning pathway")}>
      <ol className="grid gap-px overflow-hidden rounded-3xl border border-hairline bg-hairline sm:grid-cols-5">
        {stages.map((s, i) => (
          <li key={s.label} className="bg-background">
            <Link to="/patient/library/$slug" params={{ slug: s.slug }} className="group flex h-full items-center gap-3 p-5 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-col sm:items-start">
              <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary"><s.icon className="size-4" /></span>
                {tx("Step {n}", { n: i + 1 })}
              </span>
              <span className="font-display font-bold group-hover:text-primary">{s.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Visual 6 — public study pathway from the approved study page content. */
export function StudyPathwayDiagram() {
  const tx = useTx();
  return (
    <Figure title={tx("Understanding the study")} caption={tx("Research visits are separate from this education area. Not everyone is eligible, taking part is voluntary, and the study does not promise a treatment benefit.")}>
      <ol className="flex flex-wrap gap-2" aria-label={tx("Study steps")}>
        {journeyStages.map((s, i) => (
          <li key={s.n} className="flex items-center gap-2">
            <span className="rounded-full border border-hairline bg-background px-3 py-1.5 text-sm"><span className="me-1.5 text-xs text-muted-foreground">{s.n}</span>{tx(s.t)}</span>
            {i < journeyStages.length - 1 ? <ArrowRight aria-hidden="true" className="size-3.5 text-muted-foreground rtl:rotate-180" /> : null}
          </li>
        ))}
      </ol>
    </Figure>
  );
}

export function ArticleDiagram({ id }: { id?: DiagramId }) {
  if (id === "signal") return <NerveSignalDiagram />;
  if (id === "sensations") return <SensationsDiagram />;
  if (id === "review") return <MedicationReviewDiagram />;
  return null;
}
