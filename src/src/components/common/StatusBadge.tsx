import { cn } from "@/lib/utils";
import {
  MILESTONE_STATUS_LABELS,
  STUDY_GROUP_LABELS,
  type MilestoneStatus,
  type StudyGroup,
} from "@/lib/study";

const statusStyles: Record<MilestoneStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-brand/12 text-brand-deep",
  completed: "bg-accent/18 text-accent",
};

export function MilestoneStatusBadge({
  status,
  className,
}: {
  status: MilestoneStatus;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        statusStyles[status],
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {MILESTONE_STATUS_LABELS[status]}
    </span>
  );
}

export function StudyArmBadge({
  group,
  className,
}: {
  group: StudyGroup;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        group === "control"
          ? "bg-brand-deep/12 text-brand-deep"
          : "bg-accent/18 text-accent",
        className,
      )}
    >
      {STUDY_GROUP_LABELS[group]}
    </span>
  );
}

/** Marks any illustrative, non-clinical content shown during development. */
export function DemoDataBadge({
  label = "Demo Data",
  className,
}: {
  label?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-accent",
        className,
      )}
    >
      {label}
    </span>
  );
}
