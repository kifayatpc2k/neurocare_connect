import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: {
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  breadcrumbs?: Crumb[] | undefined;
  actions?: ReactNode | undefined;
  className?: string | undefined;
}) {
  return (
    <header className={cn("space-y-4", className)}>
      {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
