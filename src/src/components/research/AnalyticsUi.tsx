import type { ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CountItem, Stats } from "@/lib/analytics";

export const NA = "Not available";
export const fmt = (v: number | null | undefined, d = 1) =>
  v === null || v === undefined ? "—" : v.toFixed(d).replace(/\.0+$/, "");
export const pct = (v: number | null) => (v === null ? "—" : `${fmt(v)}%`);
export const signed = (v: number | null) => (v === null ? "—" : `${v > 0 ? "+" : ""}${fmt(v, 2)}`);
export const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <section className={cn("frost rounded-2xl p-5", className)}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-bold">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

export function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode | undefined;
}) {
  return (
    <div className="inset-tile rounded-xl p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-brand-deep">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Flag({
  children,
  tone = "pending",
}: {
  children: ReactNode;
  tone?: "pending" | "provisional";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tone === "provisional"
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      {tone === "provisional" ? (
        <AlertTriangle aria-hidden="true" className="size-3" />
      ) : (
        <Info aria-hidden="true" className="size-3" />
      )}
      {children}
    </span>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
      <Info aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
      {children}
    </p>
  );
}

/** Horizontal bars scaled to the largest value; zero rows still render as true zeros. */
export function BarList({
  items,
  empty = "No data recorded yet.",
}: {
  items: { label: string; value: number; sub?: string | undefined }[];
  empty?: string;
}) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex justify-between gap-3 text-xs">
            <span className="truncate">{i.label}</span>
            <span className="tabular-nums font-semibold">
              {i.value}
              {i.sub ? (
                <span className="ml-1 font-normal text-muted-foreground">{i.sub}</span>
              ) : null}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-brand"
              style={{ width: `${(i.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export const countBars = (items: CountItem[]) =>
  items.map((i) => ({
    label: i.key === i.label ? i.label : `${i.key} — ${i.label}`,
    value: i.count,
  }));

export function StatCell({
  s,
  empty = "Insufficient recorded data",
}: {
  s: Stats;
  empty?: string;
}) {
  if (s.n === 0) return <span className="text-xs text-muted-foreground">{empty}</span>;
  return (
    <span className="tabular-nums">
      {fmt(s.mean, 2)}{" "}
      <span className="text-xs text-muted-foreground">
        (n={s.n}
        {s.sd !== null ? `, SD ${fmt(s.sd, 2)}` : ""}
        {s.median !== null ? `, Mdn ${fmt(s.median, 2)}` : ""})
      </span>
    </span>
  );
}

/** Group-mean line chart. Points are drawn only where observations exist; gaps are not interpolated. */
export function TrajectoryChart({
  series,
  max,
  yLabel,
}: {
  series: {
    name: string;
    className: string;
    points: { label: string; mean: number | null; n: number }[];
  }[];
  max: number;
  yLabel: string;
}) {
  const W = 520,
    H = 220,
    L = 40,
    R = 16,
    T = 16,
    B = 40;
  const labels = series[0]?.points.map((p) => p.label) ?? [];
  const x = (i: number) => L + (labels.length > 1 ? (i * (W - L - R)) / (labels.length - 1) : 0);
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const ticks = Array.from({ length: 6 }, (_, i) => (max / 5) * i);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={yLabel}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth={1} />
            <text
              x={L - 6}
              y={y(t) + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[10px]"
            >
              {fmt(t)}
            </text>
          </g>
        ))}
        {labels.map((l, i) => (
          <text
            key={l}
            x={x(i)}
            y={H - 18}
            textAnchor="middle"
            className="fill-foreground text-[11px]"
          >
            {l}
          </text>
        ))}
        {series.map((s) => {
          const segs: string[] = [];
          s.points.forEach((p, i) => {
            const prev = s.points[i - 1];
            if (p.mean !== null && prev && prev.mean !== null)
              segs.push(`M${x(i - 1)},${y(prev.mean)}L${x(i)},${y(p.mean)}`);
          });
          return (
            <g key={s.name} className={s.className}>
              <path d={segs.join("")} fill="none" stroke="currentColor" strokeWidth={2} />
              {s.points.map((p, i) =>
                p.mean === null ? null : (
                  <g key={p.label}>
                    <circle cx={x(i)} cy={y(p.mean)} r={4} fill="currentColor" />
                    <text
                      x={x(i)}
                      y={y(p.mean) - 8}
                      textAnchor="middle"
                      className="fill-current text-[10px]"
                    >
                      n={p.n}
                    </text>
                  </g>
                ),
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {series.map((s) => (
          <span key={s.name} className={cn("inline-flex items-center gap-1.5", s.className)}>
            <span className="size-2.5 rounded-full bg-current" />
            <span className="text-muted-foreground">{s.name}</span>
          </span>
        ))}
        <span>{yLabel}</span>
      </figcaption>
    </figure>
  );
}
