import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { HeartHandshake, Printer, RotateCcw } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { SourceList } from "@/components/library/LibraryShell";
import { checklist as checklistEn } from "@/content/patient/library";
import { useLocalized, useTx } from "@/i18n/PatientLanguage";
import { cn } from "@/lib/utils";

export const CHECKLIST_TOTAL = checklistEn.groups.reduce((n, g) => n + g.items.length, 0);

/** Prints only the checklist: marks <html> so print CSS hides everything else. */
function printChecklist() {
  const html = document.documentElement;
  html.classList.add("print-checklist");
  const done = () => { html.classList.remove("print-checklist"); window.removeEventListener("afterprint", done); };
  window.addEventListener("afterprint", done);
  window.print();
}

/** Ticks live only in component state — never stored or sent. */
export function AppointmentChecklist({ headingLevel = 3 }: { headingLevel?: 2 | 3 }) {
  const tx = useTx();
  const checklist = useLocalized(checklistEn);
  // Ticks are keyed by stable item position, so they survive a language switch.
  const [on, setOn] = useState<Record<string, boolean>>({});
  const [confirm, setConfirm] = useState(false);
  const count = Object.values(on).filter(Boolean).length;
  const H = headingLevel === 2 ? "h2" : "h3";
  const HSub = headingLevel === 2 ? "h3" : "h4";
  let n = 0;

  return (
    <div data-print-area className="print-area">
      <p className="hidden font-display text-xl font-bold print:block">NeuroCare Connect — {checklist.title}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="text-sm font-semibold">
          {tx("{n} of {total} items completed", { n: count, total: CHECKLIST_TOTAL })}
        </p>
        <div aria-hidden="true" className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted print:hidden">
          <div className="h-full rounded-full bg-primary transition-all motion-reduce:transition-none" style={{ width: `${(count / CHECKLIST_TOTAL) * 100}%` }} />
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {checklist.groups.map((g, gi) => (
          <fieldset key={g.title} className="print:break-inside-avoid">
            <legend className="contents"><H className="font-display text-lg font-bold">{String.fromCharCode(65 + gi)}. {g.title}</H></legend>
            <ul className="mt-3 space-y-2">
              {g.items.map((x) => {
                n += 1;
                const id = `chk-${n}`;
                const v = !!on[id];
                return (
                  <li key={x}>
                    <label htmlFor={id} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border bg-background px-4 py-3 text-base leading-relaxed transition-colors focus-within:ring-2 focus-within:ring-ring print:border-0 print:p-1", v ? "border-primary" : "border-hairline hover:border-muted-foreground/40")}>
                      <input id={id} type="checkbox" checked={v} onChange={() => setOn((s) => ({ ...s, [id]: !s[id] }))} className="mt-1 size-5 shrink-0 accent-primary" />
                      <span><span className="sr-only">{tx("Item {n}:", { n })} </span>{x}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">{g.note}</p>
          </fieldset>
        ))}
      </div>

      <aside aria-labelledby="before-leave" className="mt-8 rounded-3xl border-2 border-dashed border-primary/40 bg-surface p-6 print:break-inside-avoid">
        <HSub id="before-leave" className="font-display text-lg font-bold">{checklist.beforeILeave.title}</HSub>
        <p className="mt-1 text-sm text-muted-foreground">{tx("Optional prompts — not counted in your progress.")}</p>
        <ul className="mt-3 space-y-1.5">
          {checklist.beforeILeave.prompts.map((p) => <li key={p} className="flex gap-2"><span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />{p}</li>)}
        </ul>
      </aside>

      <p className="mt-6 text-sm text-muted-foreground">{checklist.temporaryNotice}</p>

      <div className="mt-4 flex flex-wrap gap-3 print:hidden">
        <button type="button" onClick={printChecklist} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Printer className="size-4" aria-hidden="true" />{tx("Print checklist")}
        </button>
        <button type="button" onClick={() => setConfirm(true)} className="inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5 text-sm font-semibold hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <RotateCcw className="size-4" aria-hidden="true" />{tx("Reset")}
        </button>
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title={tx("Clear all ticks?")}
          description={tx("This will untick all {n} checklist items. This cannot be undone.", { n: CHECKLIST_TOTAL })}
          confirmLabel={tx("Clear checklist")}
          cancelLabel={tx("Keep my ticks")}
          onConfirm={() => setOn({})}
        />
      </div>

      <p className="mt-6 print:hidden">
        <Link to="/patient/library/$slug" params={{ slug: "appointment-preparation" }} className="font-semibold text-primary hover:underline">
          {tx("Read more: Preparing for a healthcare appointment")}
        </Link>
      </p>

      <div className="mt-6 flex gap-3 rounded-2xl bg-surface p-5 print:break-inside-avoid">
        <HeartHandshake className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
        <div>
          <p className="font-semibold">{checklist.reminder.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{checklist.reminder.text}</p>
        </div>
      </div>

      <details className="mt-6 text-sm print:hidden">
        <summary className="cursor-pointer font-semibold">{tx("Sources used for this checklist")}</summary>
        <div className="mt-3"><SourceList sources={checklist.sources} /></div>
      </details>
    </div>
  );
}
