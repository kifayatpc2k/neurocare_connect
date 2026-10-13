import type { ReactNode } from "react";
import { Construction } from "lucide-react";

/**
 * Marks a module whose interface exists but whose clinical/business logic is
 * scheduled for a later development stage.
 */
export function ModulePlaceholder({
  title,
  summary,
  plannedCapabilities,
  children,
}: {
  title: string;
  summary: string;
  plannedCapabilities: string[];
  children?: ReactNode | undefined;
}) {
  return (
    <section className="frost rounded-3xl p-7">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand/12 text-brand-deep">
          <Construction aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{summary}</p>
        </div>
      </div>

      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {plannedCapabilities.map((capability) => (
          <li
            key={capability}
            className="inset-tile flex items-center gap-3 rounded-2xl px-4 py-3 text-sm"
          >
            <span aria-hidden="true" className="size-2 rounded-full bg-brand" />
            {capability}
          </li>
        ))}
      </ul>

      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}
