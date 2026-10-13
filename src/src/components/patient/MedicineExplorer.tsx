import { useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, ExternalLink, Info, Search, ShieldAlert, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { catalogue, filterMedicines, isSafeUrl, type CatalogueMedicine } from "@/lib/medicine-catalogue";
import { cn } from "@/lib/utils";
import { useLocalized, usePatientLanguage, useTx } from "@/i18n/PatientLanguage";
import { localizeDeep, msg } from "@/i18n/localize";

const PENDING_LABEL = msg("Educational content — clinical review pending");
const NOT_FOUND = msg(
  "We couldn't find that medicine in this educational catalogue. This list includes selected medicines and is not exhaustive. Ask your doctor or pharmacist for information about your medicine.");

const urgencyStyle: Record<string, { label: string; cls: string }> = {
  emergency: { label: msg("Emergency"), cls: "border-destructive bg-destructive/10 text-destructive" },
  urgent: { label: msg("Urgent"), cls: "border-warm bg-warm/15 text-foreground" },
  prompt: { label: msg("Seek advice promptly"), cls: "border-hairline bg-muted text-foreground" },
};

function ReviewBadge() {
  const tx = useTx();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/40 px-2.5 py-0.5 text-xs text-muted-foreground">
      <Info className="size-3" aria-hidden="true" />
      {tx(PENDING_LABEL)}
    </span>
  );
}

function Disclaimer({ text }: { text: string }) {
  const tx = useTx();
  return (
    <div className="flex gap-3 rounded-2xl border border-hairline bg-background p-4 text-sm leading-relaxed text-muted-foreground">
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
      <div>
        <p>{text}</p>
        <p className="mt-1.5">
          {tx("Your own treatment depends on your clinical circumstances. This catalogue is not exhaustive, does not diagnose conditions, does not recommend individual treatment and is not a personalised interaction checker.")}
        </p>
      </div>
    </div>
  );
}

/** When selectedId/onSelect are given (e.g. from the URL), the open medicine is controlled by the parent. */
export function MedicineExplorer({ selectedId, onSelect }: { selectedId?: string | null; onSelect?: (id: string | null) => void } = {}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [localId, setLocalId] = useState<string | null>(null);
  const openId = onSelect ? (selectedId ?? null) : localId;
  const setOpenId = onSelect ?? setLocalId;
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const tx = useTx();
  const { dict } = usePatientLanguage();

  const catsEn = useMemo(() => (catalogue ? [...catalogue.categories].sort((a, b) => a.displayOrder - b.displayOrder) : []), []);
  const catsL = useLocalized(catsEn);
  const cats = useMemo(() => catsL.map((c) => ({ ...c, name: tx(c.name) })), [catsL, tx]);
  const medsLocalized = useLocalized(catalogue?.medicines ?? EMPTY_MEDS);
  const resultsEn = useMemo(() => {
    if (!catalogue) return [];
    const extra = (m: CatalogueMedicine) => {
      const l = localizeDeep(m, dict);
      const c = m.categoryIds.map((id) => dict[catsEn.find((x) => x.id === id)?.name ?? ""] ?? "");
      return [l.medicineGroup, l.summary, ...l.whatIsItUsedFor, ...c].join(" ");
    };
    return filterMedicines(catalogue.medicines, catsEn, query, cat, Object.keys(dict).length ? extra : undefined);
  }, [query, cat, catsEn, dict]);
  const results = resultsEn.map((m) => medsLocalized.find((x) => x.id === m.id) ?? m);

  if (!catalogue) {
    return (
      <div role="alert" className="rounded-3xl border border-hairline bg-card p-8 text-muted-foreground">
        {tx("Medicine information is temporarily unavailable. Please ask your doctor or pharmacist about your medicine.")}
      </div>
    );
  }

  const total = catalogue.medicines.length;
  const selected = medsLocalized.find((m) => m.id === openId) ?? null;
  const reset = () => { setQuery(""); setCat(null); };
  const catName = (id: string) => cats.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="min-w-0">
      <p className="text-sm font-semibold text-primary">{tx("{n} medicines in this educational catalogue", { n: total })}</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <label htmlFor="med-search" className="text-sm font-semibold">{tx("Search medicines")}</label>
          <div className="relative mt-2">
            <Search aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="med-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tx("Try pregabalin, metformin or nerve pain…")}
              autoComplete="off"
              className="w-full rounded-full border border-input bg-card py-3.5 ps-11 pe-12 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label={tx("Clear search")} className="absolute end-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
        <div className="lg:col-span-5">
          <Disclaimer text={tx(catalogue.catalogueMetadata.medicalDisclaimer)} />
        </div>
      </div>

      <div role="group" aria-label={tx("Filter by category")} className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-2">
        {[{ id: null as string | null, name: tx("All medicines") }, ...cats].map((c) => {
          const on = cat === c.id;
          return (
            <button
              key={c.id ?? "all"}
              type="button"
              aria-pressed={on}
              onClick={() => setCat(c.id)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                on ? "border-primary bg-primary text-primary-foreground" : "border-hairline bg-card hover:border-muted-foreground/40",
              )}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" aria-live="polite">{tx("Showing {n} of {total} medicines", { n: results.length, total })}</p>
        {query || cat ? (
          <button type="button" onClick={reset} className="text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{tx("Reset search and filters")}</button>
        ) : null}
      </div>

      {results.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-hairline bg-card p-8 text-center">
          <p className="font-display text-xl font-bold">{tx("No medicines found")}</p>
          <p className="mt-2 text-muted-foreground">{tx("Try another medicine name or keyword, or clear your selected filters.")}</p>
          {query ? <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">{tx(NOT_FOUND)}</p> : null}
          <button type="button" onClick={reset} className="mt-5 rounded-full border border-hairline px-5 py-2 text-sm font-semibold hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{tx("Clear search and filters")}</button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                ref={(el) => { triggers.current[m.id] = el; }}
                onClick={() => { lastOpened.current = m.id; setOpenId(m.id); }}
                className="group flex h-full w-full flex-col rounded-3xl border border-hairline bg-card p-6 text-start shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <span className="font-display text-xl font-bold">{m.displayName}</span>
                {m.genericName && m.genericName.toLowerCase() !== m.displayName.toLowerCase() ? (
                  <span className="text-sm text-muted-foreground">{m.genericName}</span>
                ) : null}
                <span className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-primary">{m.medicineGroup}</span>
                <span className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.summary}</span>
                <span className="mt-4 flex flex-wrap gap-1.5">
                  {m.categoryIds.map((id) => (
                    <span key={id} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{catName(id)}</span>
                  ))}
                </span>
                <span className="mt-auto flex items-center gap-1 pt-5 text-sm font-semibold text-primary">
                  {tx("View information")}
                  <ArrowRight className="size-4 transition-transform rtl:rotate-180 group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!openId} onOpenChange={(o) => { if (!o) setOpenId(null); }}>
        <DialogContent
          className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-3xl overflow-y-auto rounded-3xl p-6 md:p-8"
          onCloseAutoFocus={(e) => {
            const last = lastOpened.current ? triggers.current[lastOpened.current] : null;
            if (last) { e.preventDefault(); last.focus(); }
          }}
        >
          {selected ? <MedicineDetail m={selected} catName={catName} disclaimer={tx(catalogue.catalogueMetadata.medicalDisclaimer)} /> : (
            <><DialogTitle>{tx("Medicine not found")}</DialogTitle><DialogDescription>{tx("This medicine is not in this educational catalogue. Close this window to browse the full list.")}</DialogDescription></>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const lastOpened: { current: string | null } = { current: null };
const EMPTY_MEDS: CatalogueMedicine[] = [];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-hairline pt-5">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <div className="mt-3 text-base leading-relaxed">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((x, i) => (
        <li key={i} className="flex gap-2"><span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />{x}</li>
      ))}
    </ul>
  );
}

function MedicineDetail({ m, catName, disclaimer }: { m: CatalogueMedicine; catName: (id: string) => string; disclaimer: string }) {
  const has = <T,>(a: T[] | undefined): a is T[] => Array.isArray(a) && a.length > 0;
  const pending = m.contentReview?.reviewStatus !== "approved";
  const tx = useTx();
  return (
    <article className="min-w-0 space-y-6">
      <header className="pe-8">
        {pending ? <ReviewBadge /> : null}
        <DialogTitle className="mt-3 font-display text-3xl font-bold">{m.displayName}</DialogTitle>
        {m.genericName ? <p className="text-sm text-muted-foreground">{tx("Generic name:")} <bdi lang="en">{m.genericName}</bdi></p> : null}
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-primary">{m.medicineGroup}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {m.categoryIds.map((id) => <span key={id} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{catName(id)}</span>)}
        </div>
        <DialogDescription className="mt-4 text-base leading-relaxed text-foreground">{m.summary}</DialogDescription>
      </header>

      {has(m.whatIsItUsedFor) ? <Block title={tx("What is this medicine used for?")}><Bullets items={m.whatIsItUsedFor} /></Block> : null}
      {m.howDoesItWork ? <Block title={tx("How does it work?")}><p>{m.howDoesItWork}</p></Block> : null}
      {has(m.whatShouldIKnowBeforeTakingIt) ? <Block title={tx("What should I know before taking it?")}><Bullets items={m.whatShouldIKnowBeforeTakingIt} /></Block> : null}

      {has(m.possibleSideEffects) ? (
        <Block title={tx("Possible side effects")}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {m.possibleSideEffects.map((s, i) => (
              <li key={i} className="rounded-xl border border-hairline p-3">
                <p className="font-semibold">{s.description}</p>
                {s.severity && s.severity !== "unspecified" ? <p className="text-xs text-muted-foreground">{tx("Severity:")} {tx(s.severity)}</p> : null}
                {s.action ? <p className="mt-1 text-sm text-muted-foreground">{s.action}</p> : null}
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      {has(m.whenToSeekMedicalHelp) ? (
        <Block title={tx("When should I seek medical help?")}>
          <ul className="space-y-2">
            {m.whenToSeekMedicalHelp.map((w, i) => {
              const u0 = urgencyStyle[w.urgency] ?? { label: w.urgency, cls: "border-hairline" };
              const u = { ...u0, label: tx(u0.label) };
              return (
                <li key={i} className={cn("flex gap-3 rounded-xl border p-3", u.cls)}>
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p><span className="me-2 text-xs font-bold uppercase tracking-wide">{u.label}:</span><span className="font-semibold">{w.symptom}</span></p>
                    {w.action ? <p className="text-sm">{w.action}</p> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </Block>
      ) : null}

      {has(m.interactionCautions) ? (
        <Block title={tx("Important interactions")}>
          <p className="mb-3 text-sm text-muted-foreground">{tx("General information only — not a complete or personalised interaction checker.")}</p>
          <ul className="space-y-2">
            {m.interactionCautions.map((c, i) => (
              <li key={i} className="rounded-xl border border-hairline p-3">
                <p className="font-semibold">{c.interactingSubstance}</p>
                <p className="text-sm">{c.concern}</p>
                {c.recommendedAction ? <p className="mt-1 text-sm text-muted-foreground">{c.recommendedAction}</p> : null}
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      {has(m.safeUseReminders) ? <Block title={tx("Safe-use reminders")}><Bullets items={m.safeUseReminders} /></Block> : null}
      {has(m.monitoring) ? <Block title={tx("Monitoring")}><Bullets items={m.monitoring} /></Block> : null}
      {has(m.questionsToAskYourHealthcareProfessional) ? <Block title={tx("Questions to ask your healthcare professional")}><Bullets items={m.questionsToAskYourHealthcareProfessional} /></Block> : null}
      {has(m.formulations) ? <Block title={tx("Formulations")}><Bullets items={m.formulations} /></Block> : null}

      <Block title={tx("Sources and clinical review")}>
        {has(m.sourceReferences) ? (
          <ul className="space-y-1.5">
            {m.sourceReferences.map((r, i) => {
              const label = r.title ?? r.organisation ?? tx("Reference");
              return (
                <li key={i}>
                  {isSafeUrl(r.url) ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">{label}<ExternalLink className="size-3" aria-hidden="true" /></a>
                  ) : label}
                </li>
              );
            })}
          </ul>
        ) : <p className="text-muted-foreground">{tx("Detailed references are being reviewed.")}</p>}
        {pending ? <p className="mt-3"><ReviewBadge /></p> : null}
        {has(m.contentReview?.reviewNotes) ? (
          <details className="mt-3 text-sm text-muted-foreground">
            <summary className="cursor-pointer">{tx("Review notes")}</summary>
            <Bullets items={m.contentReview.reviewNotes} />
          </details>
        ) : null}
      </Block>

      <Disclaimer text={disclaimer} />
    </article>
  );
}
