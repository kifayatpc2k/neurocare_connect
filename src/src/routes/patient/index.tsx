import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, BookOpen, ClipboardList, Compass, FileText, MessageCircle, Pill, Search, ShieldCheck, X } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { PageContainer } from "@/components/layout/PageCanvas";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { PatientHeroVisual } from "@/components/patient/PatientHeroVisual";
import { AskNeuroCare } from "@/components/patient/AskNeuroCare";
import { MedicineExplorer } from "@/components/patient/MedicineExplorer";
import { AppointmentChecklist } from "@/components/library/AppointmentChecklist";
import { checklist as checklistEn } from "@/content/patient/library";
import { LearningPathway, NerveSignalDiagram, StudyPathwayDiagram } from "@/components/library/Diagrams";
import { featuredTopics as featuredTopicsEn, findHere, hero, neuropathicPain as neuropathicPainEn, privacy as privacyEn, studyExplainer as studyExplainerEn } from "@/content/patient/education";
import { PatientLanguageSelector, TranslationNotice, useLocalized, usePatientLanguage, useTx } from "@/i18n/PatientLanguage";
import { catalogue } from "@/lib/medicine-catalogue";
import { searchLibrary } from "@/lib/library-search";
import { cn } from "@/lib/utils";

const TITLE = "Patient Education & Support — NeuroCare Connect";
const DESC = "Plain-language information about neuropathic pain, medicines, appointments and the study, with diagrams and printable leaflets. No account needed.";

export const Route = createFileRoute("/patient/")({
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
  component: PatientEducationPage,
});

const findIcons = { learn: BookOpen, medicines: Pill, ask: MessageCircle, prepare: ClipboardList, study: Compass } as const;
const openAsk = () => window.dispatchEvent(new Event("ask-neurocare:open"));

function SectionHead({ n, eyebrow, title, intro, id }: { n?: string; eyebrow: string; title: string; intro?: string; id: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {n ? <span className="me-2 text-muted-foreground">{n} —</span> : null}
        {eyebrow}
      </p>
      <h2 id={id} className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      {intro ? <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{intro}</p> : null}
    </div>
  );
}

function HomeSearch() {
  const { t, dict } = usePatientLanguage();
  const tx = useTx();
  const [q, setQ] = useState("");
  const hits = useMemo(() => searchLibrary(q, dict).slice(0, 6), [q, dict]);
  return (
    <div className="max-w-2xl">
      <label htmlFor="home-search" className="font-display text-xl font-bold">{t("searchLabel")}</label>
      <div className="relative mt-3">
        <Search aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input id="home-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" placeholder={t("searchPlaceholder")}
          className="w-full rounded-full border border-input bg-background py-3.5 ps-11 pe-12 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden" />
        {q ? <button type="button" onClick={() => setQ("")} aria-label={t("clearSearch")} className="absolute end-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted"><X className="size-4" aria-hidden="true" /></button> : null}
      </div>
      {q.trim() ? (
        <div aria-live="polite" className="mt-3">
          {hits.length === 0 ? <p className="text-sm text-muted-foreground">{tx("No matches. Try another word or")} <Link to="/patient/library" className="font-semibold text-primary">{tx("browse the library")}</Link>.</p> : (
            <ul className="divide-y divide-hairline rounded-2xl border border-hairline bg-background">
              {hits.map((h, i) => {
                const cls = "block px-4 py-3 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";
                const body = <><span className="block text-sm font-semibold">{h.title}</span><span className="block text-xs text-muted-foreground line-clamp-1">{h.text}</span></>;
                return (
                  <li key={i}>
                    {h.kind === "article" ? <Link to="/patient/library/$slug" params={{ slug: h.slug }} className={cls}>{body}</Link>
                      : h.kind === "medicine" ? <Link to="/patient/medicines" search={{ m: h.slug }} className={cls}>{body}</Link>
                      : h.kind === "glossary" ? <Link to="/patient/library/glossary" hash={h.anchor ?? ""} className={cls}>{body}</Link>
                      : h.kind === "faq" ? <Link to="/patient/library/faq" className={cls}>{body}</Link>
                      : <Link to="/patient/library" className={cls}>{body}</Link>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function PatientEducationPage() {
  const { t } = usePatientLanguage();
  const tx = useTx();
  const neuropathicPain = useLocalized(neuropathicPainEn);
  const featuredTopics = useLocalized(featuredTopicsEn);
  const checklist = useLocalized(checklistEn);
  const studyExplainer = useLocalized(studyExplainerEn);
  const privacy = useLocalized(privacyEn);
  const heroLines = [t("heroLine1"), t("heroLine2"), t("heroLine3")];
  const findText: Record<string, [string, string]> = {
    learn: [t("findLearn"), t("findLearnText")], medicines: [t("findMedicines"), t("findMedicinesText")],
    ask: [t("findAsk"), t("findAskText")], prepare: [t("findPrepare"), t("findPrepareText")], study: [t("findStudy"), t("findStudyText")],
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header>
        <PageContainer className="flex flex-wrap items-center justify-between gap-4 py-6">
          <Link to="/" aria-label="NeuroCare Connect home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <BrandMark />
          </Link>
          <nav aria-label="Primary" className="flex flex-wrap items-center gap-1 text-sm">
            <Link to="/study" className="rounded-full px-3 py-2 text-muted-foreground hover:text-foreground">{t("navStudy")}</Link>
            <Link to="/study-team" className="rounded-full px-3 py-2 text-muted-foreground hover:text-foreground">{t("navStudyTeam")}</Link>
            <Link to="/patient" aria-current="page" className="rounded-full px-3 py-2 font-semibold text-foreground">{t("navPatientEducation")}</Link>
            <Link to="/patient/library" className="rounded-full px-3 py-2 text-muted-foreground hover:text-foreground">{t("navLibrary")}</Link>
            <Link to="/research/login" className="rounded-full px-3 py-2 text-muted-foreground hover:text-foreground">{t("navResearchPortal")}</Link>
            <PatientLanguageSelector className="ms-1" />
          </nav>
        </PageContainer>
      </header>

      <main className="flex-1">
        <PageContainer className="empty:hidden"><TranslationNotice /></PageContainer>
        {/* HERO */}
        <section aria-labelledby="hero-h" className="relative overflow-hidden">
          <PageContainer className="grid items-center gap-10 pb-16 pt-6 lg:grid-cols-12 lg:pb-20">
            <div className="lg:col-span-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{hero.eyebrow}</p>
              <h1 id="hero-h" className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                {heroLines.map((l, i) => (
                  <span key={l} className={cn("block", i === 2 && "text-muted-foreground")}>{l}</span>
                ))}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{t("heroText")}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <a href={hero.primaryCta.anchor}>{t("heroPrimary")}<ArrowRight className="ms-1 size-4 rtl:rotate-180" aria-hidden="true" /></a>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link to={hero.secondaryCta.to}>{t("heroSecondary")}</Link>
                </Button>
              </div>
              <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0 text-accent" aria-hidden="true" />
                {t("heroReassurance")}
              </p>
            </div>
            <div className="flex justify-center lg:col-span-6">
              <PatientHeroVisual />
            </div>
          </PageContainer>
        </section>

        {/* 1. SEARCH + SHORTCUTS */}
        <section aria-labelledby="find-h" className="border-y border-hairline bg-surface">
          <PageContainer className="grid gap-10 py-12 lg:grid-cols-12">
            <div className="lg:col-span-5"><HomeSearch /></div>
            <div className="lg:col-span-7">
              <h2 id="find-h" className="font-display text-xl font-bold">{t("findTitle")}</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {findHere.items.map((it) => {
                  const Icon = findIcons[it.key];
                  const inner = (<><Icon className="size-5 shrink-0 text-primary" aria-hidden="true" /><span><span className="block font-semibold">{findText[it.key]?.[0]}</span><span className="block text-sm text-muted-foreground">{findText[it.key]?.[1]}</span></span></>);
                  const cls = "flex h-full w-full items-start gap-3 rounded-2xl border border-hairline bg-background p-4 text-start hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
                  return <li key={it.key}>{it.to ? <Link to={it.to} className={cls}>{inner}</Link> : <button type="button" onClick={openAsk} className={cls}>{inner}</button>}</li>;
                })}
              </ul>
            </div>
          </PageContainer>
        </section>

        {/* 2–3. FEATURED VISUAL + 01 LEARN */}
        <section id="learn" aria-labelledby="learn-h" className="scroll-mt-6">
          <PageContainer className="py-20">
            <SectionHead id="learn-h" n={neuropathicPain.number} eyebrow={neuropathicPain.eyebrow} title={neuropathicPain.title} intro={neuropathicPain.intro} />
            <div className="mt-10 grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-6"><NerveSignalDiagram /></div>
              <ol className="lg:col-span-6">
                {neuropathicPain.topics.map((t, i) => (
                  <li key={t.title}>
                    <Link to="/patient/library/$slug" params={{ slug: t.slug ?? "help" }}
                      className="group grid grid-cols-[2.5rem_1fr_auto] items-start gap-x-3 border-t border-hairline py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className="pt-1 font-display text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      <span>
                        <span className="block font-display text-lg font-bold group-hover:text-primary">{t.title}</span>
                        <span className="mt-1 block text-base leading-relaxed text-muted-foreground">{t.text}</span>
                      </span>
                      <ArrowRight className="mt-1.5 size-4 text-primary transition-transform group-hover:translate-x-1 rtl:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-14">
              <h3 className="font-display text-xl font-bold">{tx("Your learning pathway")}</h3>
              <p className="mt-1 text-muted-foreground">{tx("Follow these steps in order, or jump to what you need.")}</p>
              <div className="mt-5"><LearningPathway /></div>
            </div>
          </PageContainer>
        </section>

        {/* 4. FEATURED TOPICS + MEDICINES */}
        <section aria-labelledby="feat-h" className="bg-surface">
          <PageContainer className="grid gap-12 py-20 lg:grid-cols-12">
            <div className="lg:col-span-12">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <SectionHead id="feat-h" eyebrow={tx("Education library")} title={tx("Explore and understand")} />
                <Button asChild variant="outline" className="rounded-full"><Link to="/patient/library">{tx("Open the full library")}<ArrowRight className="ms-1 size-4 rtl:rotate-180" aria-hidden="true" /></Link></Button>
              </div>
              <ul className="mt-8 grid gap-x-10 md:grid-cols-2">
                {featuredTopics.map((a) => (
                  <li key={a.slug}>
                    <Link to="/patient/library/$slug" params={{ slug: a.slug }} className="group flex items-center justify-between gap-4 border-t border-hairline py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span><span className="block font-display text-lg font-bold group-hover:text-primary">{a.title}</span><span className="mt-1 block text-sm text-muted-foreground">{a.summary}</span></span>
                      <ArrowRight className="size-4 shrink-0 text-primary rtl:rotate-180" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </PageContainer>
        </section>

        {/* 02 MEDICINES */}
        <section id="medicines" aria-labelledby="med-h" className="scroll-mt-6">
          <PageContainer className="py-20">
            <SectionHead id="med-h" n="02" eyebrow={t("medEyebrow")} title={t("medTitle")}
              intro={t("medIntro")} />
            <p role="note" className="mt-6 flex max-w-3xl gap-3 rounded-2xl border border-warm/60 p-4 text-sm leading-relaxed">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {t("medWarning")}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">{tx("This is a general catalogue, not a complete list of medicines for neuropathic pain — some entries relate to other health conditions.")}</p>
            <div className="mt-10"><MedicineExplorer /></div>
          </PageContainer>
        </section>

        {/* 03 PREPARE */}
        <section id="prepare" aria-labelledby="prep-h" className="scroll-mt-6 bg-surface">
          <PageContainer className="py-20">
            <div className="mx-auto max-w-3xl">
              <div className="print:hidden">
                <SectionHead id="prep-h" n="03" eyebrow={tx("Prepare for your appointment")} title={checklist.title} intro={checklist.intro} />
              </div>
              <div className="mt-8"><AppointmentChecklist /></div>
            </div>
          </PageContainer>
        </section>

        {/* HELP */}
        <section id="help" aria-labelledby="help-h">
          <PageContainer className="py-16">
            <div className="flex flex-col gap-4 rounded-3xl border-2 border-warm p-7 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-4">
                <AlertTriangle className="mt-1 size-6 shrink-0" aria-hidden="true" />
                <div>
                  <h2 id="help-h" className="font-display text-2xl font-bold">{tx("Know when to ask for help")}</h2>
                  <p className="mt-1 text-muted-foreground">{tx("This website is not an emergency service. In an emergency in India, call 112.")}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline" className="rounded-full"><Link to="/patient/library/help">{tx("When to seek medical help")}<ArrowRight className="ms-1 size-4 rtl:rotate-180" aria-hidden="true" /></Link></Button>
                <Button asChild variant="ghost" className="rounded-full"><Link to="/patient/library/leaflets"><FileText className="me-1 size-4" aria-hidden="true" />{tx("Printable leaflets")}</Link></Button>
              </div>
            </div>
          </PageContainer>
        </section>

        {/* 7. STUDY */}
        <section id="study" aria-labelledby="st-h" className="scroll-mt-6 bg-surface">
          <PageContainer className="grid gap-10 py-20 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHead id="st-h" eyebrow={tx("The research study")} title={studyExplainer.title} intro={studyExplainer.text} />
              <ul className="mt-6">
                {studyExplainer.links.map((l) => (
                  <li key={l.label}>
                    <Link to="/study" hash={l.hash} className="group flex items-center justify-between gap-4 border-t border-hairline py-3 font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      {l.label}<ArrowRight className="size-4 text-primary rtl:rotate-180" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-7"><StudyPathwayDiagram /></div>
          </PageContainer>
        </section>

        {/* 8. LANGUAGE + PRIVACY */}
        <section id="language" aria-labelledby="lang-h" className="border-t border-hairline">
          <PageContainer className="grid gap-12 py-20 lg:grid-cols-2">
            <div>
              <h2 id="lang-h" className="font-display text-2xl font-bold">{t("languageSectionTitle")}</h2>
              <p className="mt-2 text-muted-foreground">{t("languageSectionIntro")}</p>
              <div className="mt-6"><PatientLanguageSelector /></div>
            </div>
            <div id="privacy">
              <h2 className="font-display text-2xl font-bold">{privacy.title}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{privacy.text}</p>
            </div>
          </PageContainer>
        </section>
      </main>
      <SiteFooter />
      <AskNeuroCare />
    </div>
  );
}
