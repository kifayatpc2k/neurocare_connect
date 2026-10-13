import { cn } from "@/lib/utils";
import {
  CONSENT_LABELS,
  ELIGIBILITY_LABELS,
  LIFECYCLE_LABELS,
  type ConsentStatus,
  type EligibilityStatus,
  type LifecycleStage,
} from "@/lib/lifecycle";

const base =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold";

const neutral = "bg-muted text-muted-foreground";
const active = "bg-brand/12 text-brand-deep";
const done = "bg-accent/18 text-accent";
const danger = "bg-destructive/12 text-destructive";

const stageTone: Record<LifecycleStage, string> = {
  screening: neutral,
  not_eligible: danger,
  awaiting_consent: active,
  consent_not_obtained: danger,
  awaiting_enrolment: active,
  awaiting_baseline: active,
  awaiting_randomization: active,
  randomized_control: done,
  randomized_intervention: done,
  day_15_pending: active,
  day_15_completed: done,
  study_completed: done,
};

export function LifecycleBadge({
  stage,
  className,
}: {
  stage: LifecycleStage;
  className?: string | undefined;
}) {
  return (
    <span className={cn(base, stageTone[stage], className)}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {LIFECYCLE_LABELS[stage]}
    </span>
  );
}

export function EligibilityBadge({ status }: { status: EligibilityStatus }) {
  return (
    <span
      className={cn(
        base,
        status === "eligible" ? done : status === "not_eligible" ? danger : neutral,
      )}
    >
      {ELIGIBILITY_LABELS[status]}
    </span>
  );
}

export function ConsentBadge({ status }: { status: ConsentStatus }) {
  return (
    <span
      className={cn(
        base,
        status === "obtained" ? done : status === "not_obtained" ? danger : neutral,
      )}
    >
      {CONSENT_LABELS[status]}
    </span>
  );
}

/** Compact yes/no marker used for the tabular milestone columns. */
export function StepBadge({ label, complete }: { label: string; complete: boolean }) {
  return <span className={cn(base, complete ? done : neutral)}>{complete ? label : "—"}</span>;
}

