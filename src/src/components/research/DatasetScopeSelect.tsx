import type { Dataset } from "@/lib/test-records";

export const DATASET_LABELS: Record<Dataset, string> = {
  study: "Study data (official)",
  test: "Development records only",
  all: "All records (study + development)",
};

/**
 * Shared dataset-scope selector for research reporting modules. The default
 * "study" scope is the official reporting dataset; the other options are
 * explicit development views.
 */
export function DatasetScopeSelect({
  value,
  onChange,
}: {
  value: Dataset;
  onChange: (dataset: Dataset) => void;
}) {
  return (
    <select
      aria-label="Dataset scope"
      className="h-9 rounded-full border border-input bg-background px-3 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value as Dataset)}
    >
      {(Object.keys(DATASET_LABELS) as Dataset[]).map((key) => (
        <option key={key} value={key}>
          {DATASET_LABELS[key]}
        </option>
      ))}
    </select>
  );
}

/** Neutral module-level indicator shown whenever a non-official dataset is displayed. */
export function DevelopmentViewNote({ dataset }: { dataset: Dataset }) {
  if (dataset === "study") return null;
  return (
    <p className="rounded-xl border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
      Development view — figures on this page are calculated from{" "}
      {dataset === "test" ? "development records only" : "study and development records combined"}{" "}
      and are not official study results.
    </p>
  );
}
