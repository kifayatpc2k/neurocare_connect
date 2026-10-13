import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { LibraryShell, PageIntro } from "@/components/library/LibraryShell";
import { PageContainer } from "@/components/layout/PageCanvas";
import { learningChecks as checksEn } from "@/content/patient/library";
import { useLocalized, useTx } from "@/i18n/PatientLanguage";
import { cn } from "@/lib/utils";

const TITLE = "Learning Checks — NeuroCare Connect Library";
const DESC = "A few quick questions to check your understanding of nerve pain basics. Nothing is saved.";

export const Route = createFileRoute("/patient/library/checks")({
  head: () => ({
    meta: [
      { title: TITLE }, { name: "description", content: DESC },
      { property: "og:title", content: TITLE }, { property: "og:description", content: DESC },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChecksPage,
});

function ChecksPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const tx = useTx();
  const learningChecks = useLocalized(checksEn);
  return (
    <LibraryShell>
      <PageContainer className="py-8">
        <div className="mx-auto max-w-3xl">
          <PageIntro eyebrow={tx("J — Learning checks")} title={tx("Check your understanding")} text={tx("These questions check general knowledge only. They do not assess your health, and your answers are not saved.")} />
          <ol className="mt-8 space-y-6">
            {learningChecks.map((c, i) => {
              const picked = answers[i];
              const done = picked !== undefined;
              return (
                <li key={c.q} className="rounded-3xl border border-hairline p-6">
                  <fieldset>
                    <legend className="font-display text-lg font-bold">{i + 1}. {c.q}</legend>
                    <div className="mt-4 flex flex-col gap-2">
                      {c.options.map((o, j) => (
                        <button key={o} type="button" aria-pressed={picked === j} onClick={() => setAnswers((a) => ({ ...a, [i]: j }))}
                          className={cn("rounded-2xl border px-4 py-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            picked === j ? "border-primary bg-primary/10 font-semibold" : "border-hairline hover:border-muted-foreground/40")}>
                          {o}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  {done ? (
                    <p className="mt-4 flex gap-2" aria-live="polite">
                      {picked === c.correct ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />}
                      <span><strong>{picked === c.correct ? tx("Correct.") : tx("Not quite.")}</strong> {c.explain}{" "}
                        <Link to="/patient/library/$slug" params={{ slug: c.related }} className="font-semibold text-primary hover:underline">{tx("Read the article")}</Link></span>
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
          <button type="button" onClick={() => setAnswers({})} className="mt-6 rounded-full border border-hairline px-5 py-2 text-sm font-semibold hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{tx("Start again")}</button>
        </div>
      </PageContainer>
    </LibraryShell>
  );
}
