import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Clock, MessageCircle, Phone, Printer, ShieldCheck, ArrowRight } from "lucide-react";
import { LibraryShell, PageIntro, ReviewLabel, SourceList } from "@/components/library/LibraryShell";
import { PageContainer } from "@/components/layout/PageCanvas";
import { seekHelp, type HelpGroup, type HelpLevel } from "@/content/patient/library";
import { cn } from "@/lib/utils";
import { useLocalized, usePatientLanguage, useTx } from "@/i18n/PatientLanguage";
import { helpL10n, type HelpL10n } from "@/i18n/patient-help";

const TITLE = "When to Seek Medical Help — NeuroCare Connect Library";
const DESC = "General guidance for patients in India on which nerve-related symptoms need emergency help (112), prompt assessment or a routine appointment.";

export const Route = createFileRoute("/patient/library/help")({
  head: () => ({
    meta: [
      { title: TITLE }, { name: "description", content: DESC },
      { property: "og:title", content: TITLE }, { property: "og:description", content: DESC },
      { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HelpPage,
});

const levelStyle: Record<HelpLevel["id"], { icon: typeof AlertTriangle; border: string }> = {
  emergency: { icon: AlertTriangle, border: "border-destructive" },
  prompt: { icon: Clock, border: "border-warm" },
  routine: { icon: MessageCircle, border: "border-hairline" },
};

function HelpPage() {
  const { lang, t } = usePatientLanguage();
  const tx = useTx();
  const L = helpL10n[lang];
  const sh = useLocalized(seekHelp);
  const nav = (["emergency", "prompt", "routine", "faqs", "sources"] as const).map((k) => ({ href: `#${k}`, label: L.nav[k] }));
  return (
    <LibraryShell>
      <PageContainer className="py-8">
        <div className="mx-auto max-w-3xl">
          <PageIntro eyebrow={tx("G — Safety")} title={L.title} />
          {L.intro.map((p) => <p key={p} className="mt-4 text-lg leading-relaxed">{p}</p>)}

          <aside aria-labelledby="sos" className="mt-6 rounded-3xl border-2 border-destructive bg-destructive/5 p-6">
            <h2 id="sos" className="flex items-center gap-2 font-display text-2xl font-bold"><Phone className="size-6 text-destructive" aria-hidden="true" />{L.panelTitle}</h2>
            <p className="mt-2 text-lg leading-relaxed">{L.panelText}</p>
            <a href={`tel:${seekHelp.emergencyNumber}`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-3 text-lg font-bold text-destructive-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring print:hidden">
              <Phone className="size-5" aria-hidden="true" />{L.call} <bdi>{seekHelp.emergencyNumber}</bdi>
            </a>
          </aside>

          <p role="note" className="mt-4 rounded-2xl border border-hairline p-4 text-base leading-relaxed">{L.disclaimer}</p>

          <nav aria-label={t("onThisPage")} className="mt-6 flex flex-wrap items-center gap-2 print:hidden">
            {nav.map((n) => <a key={n.href} href={n.href} className="rounded-full border border-hairline px-4 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{n.label}</a>)}
            <button type="button" onClick={() => window.print()} className="ms-auto inline-flex items-center gap-2 rounded-full border border-hairline px-4 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Printer className="size-4" aria-hidden="true" />{t("printPage")}
            </button>
          </nav>

          <section aria-labelledby="guide" className="mt-8">
            <h2 id="guide" className="font-display text-2xl font-bold">{L.quickGuide}</h2>
            <DecisionPathway L={L} />
            <p className="mt-3 text-base text-muted-foreground">{L.guideNote}</p>
          </section>

          <div className="mt-8 space-y-8">
            {sh.levels.map((lvl) => <LevelSection key={lvl.id} level={lvl} L={L} />)}
          </div>

          <section aria-labelledby="steps" className="mt-10 rounded-3xl border-2 border-hairline p-6">
            <h2 id="steps" className="flex items-center gap-2 font-display text-2xl font-bold"><ShieldCheck className="size-6" aria-hidden="true" />{L.safeSteps.title}</h2>
            <ul className="mt-3 space-y-2 text-lg">{L.safeSteps.items.map((x) => <Bullet key={x}>{x}</Bullet>)}</ul>
          </section>

          <section id="faqs" aria-labelledby="faq-h" className="mt-10 scroll-mt-24">
            <h2 id="faq-h" className="font-display text-2xl font-bold">{L.nav.faqs}</h2>
            <div className="mt-4 space-y-3">
              {sh.faqs.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-hairline p-4 print:open">
                  <summary className="cursor-pointer text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{f.q}</summary>
                  <p className="mt-2 text-lg leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section id="sources" aria-labelledby="src-h" className="mt-10 scroll-mt-24 border-t border-hairline pt-6">
            <h2 id="src-h" className="font-display text-xl font-bold">{L.nav.sources}</h2>
            <p className="mt-2 text-base text-muted-foreground">{tx("Several sources are UK guidance; local practice in India may differ. Your healthcare team can explain what applies to you.")}</p>
            <div className="mt-3"><SourceList sources={seekHelp.sources} /></div>
            <p className="mt-4"><ReviewLabel status={seekHelp.reviewStatus} /></p>
          </section>
        </div>
      </PageContainer>
    </LibraryShell>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return <li className="flex gap-3"><span aria-hidden="true" className="mt-3 size-1.5 shrink-0 rounded-full bg-foreground" />{children}</li>;
}

function LevelSection({ level, L }: { level: HelpLevel; L: HelpL10n }) {
  const { icon: Icon, border } = levelStyle[level.id];
  const head = L.levels[level.id];
  const localized = level.id === "emergency";
  return (
    <section id={level.id} aria-labelledby={`${level.id}-h`} className={cn("scroll-mt-24 rounded-3xl border-2 p-6 break-inside-avoid-page", border)}>
      <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em]"><Icon className="size-4" aria-hidden="true" />{head.level}</p>
      <h2 id={`${level.id}-h`} className="mt-2 font-display text-2xl font-bold">{head.title}</h2>
      <p className="mt-2 text-lg leading-relaxed">{head.action}</p>
      {localized ? (
        <div className="mt-5 space-y-6">
          {level.groups.map((g, i) => <GroupBlock key={g.title} group={{ ...g, ...L.emergencyGroups[i] }} />)}
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {level.groups.map((g) => <GroupBlock key={g.title} group={g} />)}
        </div>
      )}
    </section>
  );
}

function GroupBlock({ group }: { group: HelpGroup }) {
  return (
    <div className={cn("grid gap-4", group.diagram && "sm:grid-cols-[1fr_160px]")}>
      <div>
        <h3 className="font-display text-xl font-bold">{group.title}</h3>
        <ul className="mt-2 space-y-2 text-lg">{group.items.map((x) => <Bullet key={x}>{x}</Bullet>)}</ul>
        {group.note ? <p className="mt-3 rounded-xl bg-muted p-3 text-base leading-relaxed">{group.note}</p> : null}
      </div>
      {group.diagram === "stroke" ? <StrokeDiagram /> : group.diagram === "spine" ? <SpineDiagram /> : group.diagram === "allergy" ? <AllergyDiagram /> : null}
    </div>
  );
}

const svgCls = "mx-auto h-auto w-40 text-foreground";

function StrokeDiagram() {
  const tx = useTx();
  return (
    <figure>
      <svg viewBox="0 0 160 160" role="img" aria-labelledby="sd-t" className={svgCls}>
        <title id="sd-t">{tx("Illustration of stroke warning signs: a face drooping on one side, one arm drifting down, and a speech bubble showing slurred speech.")}</title>
        <circle cx="55" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="44" cy="44" r="3" fill="currentColor" /><circle cx="66" cy="47" r="3" fill="currentColor" />
        <path d="M40 64 Q52 70 70 72" fill="none" stroke="var(--destructive)" strokeWidth="3" strokeLinecap="round" />
        <path d="M30 120 H70" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <path d="M80 112 L118 130" stroke="var(--destructive)" strokeWidth="5" strokeLinecap="round" />
        <rect x="98" y="18" width="54" height="30" rx="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path d="M106 34 q5 -6 10 0 t10 0 t10 0" fill="none" stroke="var(--destructive)" strokeWidth="2.5" />
      </svg>
      <figcaption className="mt-1 text-center text-sm text-muted-foreground">{tx("Face · Arm · Speech — sudden change")}</figcaption>
    </figure>
  );
}

function SpineDiagram() {
  const tx = useTx();
  return (
    <figure>
      <svg viewBox="0 0 160 180" role="img" aria-labelledby="sp-t" className={svgCls}>
        <title id="sp-t">{tx("Simplified drawing of the lower spine. A bundle of nerves runs down from the bottom of the spinal cord to the bladder, bowel, saddle area and legs. It does not show or diagnose any condition.")}</title>
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x="62" y={10 + i * 26} width="36" height="20" rx="6" fill="none" stroke="currentColor" strokeWidth="2.5" />)}
        <path d="M80 8 V140" stroke="var(--primary)" strokeWidth="3" />
        {[-30, -15, 0, 15, 30].map((dx) => <path key={dx} d={`M80 120 Q${80 + dx} 150 ${80 + dx * 1.8} 172`} fill="none" stroke="var(--primary)" strokeWidth="2" />)}
        <text x="4" y="168" fontSize="10" fill="currentColor">{tx("bladder · bowel")}</text>
        <text x="112" y="168" fontSize="10" fill="currentColor">{tx("legs")}</text>
      </svg>
      <figcaption className="mt-1 text-center text-sm text-muted-foreground">{tx("Nerves at the base of the spine (simplified)")}</figcaption>
    </figure>
  );
}

function AllergyDiagram() {
  const tx = useTx();
  return (
    <figure>
      <svg viewBox="0 0 160 160" role="img" aria-labelledby="al-t" className={svgCls}>
        <title id="al-t">{tx("Illustration of a severe allergic reaction: swollen lips and throat, with wavy lines showing difficulty breathing.")}</title>
        <path d="M50 20 Q20 40 30 80 Q36 110 60 118 V150 H100 V118 Q124 110 130 80 Q140 40 110 20 Z" fill="none" stroke="currentColor" strokeWidth="3" />
        <ellipse cx="80" cy="92" rx="18" ry="9" fill="none" stroke="var(--destructive)" strokeWidth="4" />
        <path d="M68 128 Q80 122 92 128" fill="none" stroke="var(--destructive)" strokeWidth="4" />
        <path d="M138 60 q6 6 0 12 t0 12 M148 56 q6 6 0 12 t0 12" fill="none" stroke="var(--destructive)" strokeWidth="2.5" />
      </svg>
      <figcaption className="mt-1 text-center text-sm text-muted-foreground">{tx("Swelling and breathing difficulty")}</figcaption>
    </figure>
  );
}

function DecisionPathway({ L }: { L: HelpL10n }) {
  const tx = useTx();
  const tone: Record<string, string> = { emergency: "border-destructive", prompt: "border-warm", routine: "border-hairline" };
  return (
    <ol aria-label={tx("Levels of urgency, from most to least urgent")} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-stretch">
      {seekHelp.decisionGuide.map((d, i) => (
        <li key={d.id} className="contents">
          <a href={`#${d.id}`} className={cn("rounded-2xl border-2 p-4 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", tone[d.id])}>
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{L.step} {i + 1}</span>
            <span className="mt-1 block font-display text-lg font-bold">{L.guide[i]?.label ?? d.label}</span>
            <span className="mt-1 block text-base">{L.guide[i]?.text ?? d.text}</span>
          </a>
          {i < seekHelp.decisionGuide.length - 1 ? <ArrowRight aria-hidden="true" className="hidden size-5 self-center sm:block rtl:rotate-180" /> : null}
        </li>
      ))}
    </ol>
  );
}
