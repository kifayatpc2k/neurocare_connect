import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, ExternalLink, Info } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { PageContainer } from "@/components/layout/PageCanvas";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { type ReviewStatus, type Source } from "@/content/patient/library";
import { PatientLanguageSelector, TranslationNotice, usePatientLanguage } from "@/i18n/PatientLanguage";
import type { UiKey } from "@/i18n/patient-ui";

const reviewKey: Record<ReviewStatus, UiKey> = { draft: "reviewDraft", "awaiting-review": "reviewAwaiting", reviewed: "reviewReviewed", published: "reviewPublished" };

export function LibraryShell({ children, back = true, fullyTranslated = false }: { children: ReactNode; back?: boolean; fullyTranslated?: boolean }) {
  const { t } = usePatientLanguage();
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="print:hidden">
        <PageContainer className="flex flex-wrap items-center justify-between gap-4 py-6">
          <Link to="/" aria-label="NeuroCare Connect home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <BrandMark />
          </Link>
          <nav aria-label="Primary" className="flex flex-wrap items-center gap-1 text-sm">
            <Link to="/patient" className="rounded-full px-3 py-2 text-muted-foreground hover:text-foreground">{t("navPatientEducation")}</Link>
            <Link to="/patient/library" activeOptions={{ exact: true }} activeProps={{ className: "font-semibold text-foreground", "aria-current": "page" }} className="rounded-full px-3 py-2 text-muted-foreground hover:text-foreground">{t("navLibrary")}</Link>
            <Link to="/patient/library/help" className="inline-flex items-center gap-1.5 rounded-full border border-warm/60 px-3 py-2 font-semibold hover:bg-muted">
              <AlertTriangle className="size-3.5" aria-hidden="true" />{t("navSeekHelp")}
            </Link>
            <PatientLanguageSelector className="ms-1" />
          </nav>
        </PageContainer>
      </header>
      <main className="flex-1">
        {back ? (
          <PageContainer className="print:hidden">
            <Link to="/patient/library" className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />{t("backToLibrary")}
            </Link>
          </PageContainer>
        ) : null}
        <PageContainer className="mt-4 empty:hidden print:mt-0"><TranslationNotice fullyTranslated={fullyTranslated} /></PageContainer>
        {children}
      </main>
      <div className="print:hidden"><SiteFooter /></div>
    </div>
  );
}

export function ReviewLabel({ status }: { status: ReviewStatus }) {
  const { t } = usePatientLanguage();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/40 px-2.5 py-0.5 text-xs text-muted-foreground">
      <Info className="size-3" aria-hidden="true" />
      {t(reviewKey[status])}
    </span>
  );
}

export function SourceList({ sources }: { sources: Source[] }) {
  const { t } = usePatientLanguage();
  if (!sources.length) return <p className="text-muted-foreground">{t("sourcesReviewing")}</p>;
  return (
    <ul className="space-y-2" lang="en" dir="ltr">
      {sources.map((s) => (
        <li key={s.url}>
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span>{s.title} — {s.publisher}</span>
            <ExternalLink className="mt-1 size-3 shrink-0" aria-hidden="true" />
          </a>
          <span className="hidden text-xs print:block">{s.url}</span>
        </li>
      ))}
    </ul>
  );
}

export function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
      {text ? <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{text}</p> : null}
    </div>
  );
}
