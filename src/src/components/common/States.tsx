import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function StateFrame({
  icon,
  title,
  description,
  action,
  className,
  tone = "neutral",
}: {
  icon: ReactNode;
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
  className?: string | undefined;
  tone?: "neutral" | "danger" | undefined;
}) {
  return (
    <div
      className={cn(
        "frost flex flex-col items-center rounded-3xl px-6 py-12 text-center",
        className,
      )}
      role={tone === "danger" ? "alert" : undefined}
    >
      <span
        className={cn(
          "grid size-12 place-items-center rounded-2xl",
          tone === "danger"
            ? "bg-destructive/12 text-destructive"
            : "bg-brand/12 text-brand-deep",
        )}
      >
        {icon}
      </span>
      <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "frost flex items-center justify-center gap-3 rounded-3xl px-6 py-12 text-sm text-muted-foreground",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      {label}
    </div>
  );
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2" role="status" aria-live="polite">
      <span className="sr-only">Loading content</span>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
  className?: string | undefined;
}) {
  return (
    <StateFrame
      icon={<Inbox aria-hidden="true" className="size-5" />}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "The information could not be loaded. Please try again.",
  onRetry,
  className,
}: {
  title?: string | undefined;
  description?: string | undefined;
  onRetry?: () => void | undefined;
  className?: string | undefined;
}) {
  return (
    <StateFrame
      tone="danger"
      icon={<AlertTriangle aria-hidden="true" className="size-5" />}
      title={title}
      description={description}
      className={className}
      action={
        onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        ) : undefined
      }
    />
  );
}

export function AccessDeniedState({
  description = "This area is restricted to authorised research personnel.",
  action,
}: {
  description?: string | undefined;
  action?: ReactNode | undefined;
}) {
  return (
    <StateFrame
      tone="danger"
      icon={<Lock aria-hidden="true" className="size-5" />}
      title="Access restricted"
      description={description}
      action={action}
    />
  );
}
