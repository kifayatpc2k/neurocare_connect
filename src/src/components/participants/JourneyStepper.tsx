import { Check } from "lucide-react";
import { STUDY_GROUP_LABELS } from "@/lib/study";
import { JOURNEY_LABELS, JOURNEY_STEPS, journeyState } from "@/lib/lifecycle";
import type { LifecycleRecord } from "@/lib/lifecycle";
import { cn } from "@/lib/utils";

/**
 * Visual participant journey:
 * Screening → Consent → Enrolment → Baseline → Randomisation → Day 15 → Day 30
 */
export function JourneyStepper({ record }: { record: LifecycleRecord }) {
  const state = journeyState(record);
  const currentIndex = JOURNEY_STEPS.findIndex((step) => !state[step]);

  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="Participant journey">
      {JOURNEY_STEPS.map((step, index) => {
        const complete = state[step];
        const current = index === currentIndex;
        return (
          <li key={step} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold",
                complete
                  ? "bg-accent/18 text-accent"
                  : current
                    ? "bg-brand/12 text-brand-deep"
                    : "bg-muted text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full text-[10px]",
                  complete ? "bg-accent/25" : "bg-background/60",
                )}
              >
                {complete ? <Check aria-hidden="true" className="size-3" /> : index + 1}
              </span>
              <span className="sr-only">{complete ? "Completed: " : "Not completed: "}</span>
              {JOURNEY_LABELS[step]}
              {step === "randomization" && complete && record.studyGroup
                ? ` — ${STUDY_GROUP_LABELS[record.studyGroup]}`
                : ""}
            </div>
            {index < JOURNEY_STEPS.length - 1 ? (
              <span aria-hidden="true" className="h-px w-4 bg-hairline" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
