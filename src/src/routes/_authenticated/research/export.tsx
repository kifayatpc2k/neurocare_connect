import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Download, FileSpreadsheet, Loader2, TriangleAlert } from "lucide-react";
import { ResearchShell } from "@/components/layout/ResearchShell";
import { Button } from "@/components/ui/button";
import { generateResearchExport, type ExportResult } from "@/lib/export.functions";
import { EXPORT_PENDING_COLUMNS, EXPORT_SHEETS } from "@/lib/export-spec";
import { DatasetScopeSelect } from "@/components/research/DatasetScopeSelect";
import type { Dataset } from "@/lib/test-records";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/research/export")({
  head: () => ({
    meta: [
      { title: "Data Export — NeuroCare Connect" },
      {
        name: "description",
        content: "Download the recorded study dataset as an Excel workbook for research staff.",
      },
      { property: "og:title", content: "Data Export — NeuroCare Connect" },
      {
        property: "og:description",
        content: "Research-staff-only Excel export of the NeuroCare Connect study dataset.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResearchExport,
});

function download(result: ExportResult) {
  const binary = atob(result.fileBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const STATUS_LABEL = {
  implemented: "Recorded",
  provisional: "Provisional",
  pending: "Pending",
} as const;

function ResearchExport() {
  const generate = useServerFn(generateResearchExport);
  const [dataset, setDataset] = useState<Dataset>("study");
  const mutation = useMutation({
    mutationFn: () => generate({ data: { dataset } }),
    onSuccess: (result) => {
      download(result);
      toast.success("Excel workbook downloaded.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Export failed."),
  });
  const result = mutation.data;

  return (
    <ResearchShell
      title="Data export"
      description="Download the recorded study dataset as one Excel workbook."
      breadcrumbs={[{ label: "Research" }, { label: "Export" }]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
        <DatasetScopeSelect value={dataset} onChange={setDataset} />
        <Button
          size="sm"
          className="rounded-full"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Download aria-hidden="true" className="size-4" />
          )}
          {mutation.isPending ? "Preparing…" : "Download Excel"}
        </Button>
        </div>
      }
    >
      <div aria-live="polite">
        {mutation.isError ? (
          <section className="frost flex items-start gap-3 rounded-2xl border border-destructive/30 p-5">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <h2 className="font-display text-sm font-bold">Export failed</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mutation.error instanceof Error ? mutation.error.message : "Please try again."}
              </p>
            </div>
          </section>
        ) : null}

        {result ? (
          <section className="frost rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-deep" />
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-sm font-bold">Workbook ready</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result.filename} · {result.participantCount} participant
                  {result.participantCount === 1 ? "" : "s"}
                  {result.participantCount === 0
                    ? " — no study data yet, so sheets contain column headings only."
                    : ""}
                </p>
                <ul className="mt-3 grid gap-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
                  {result.sheets.map((s) => (
                    <li key={s.label} className="flex justify-between gap-2 rounded-lg px-2 py-1 inset-tile">
                      <span>{s.label}</span>
                      <span className="font-mono text-muted-foreground">{s.rows} rows</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={() => download(result)}>
                  <Download aria-hidden="true" className="size-4" /> Download again
                </Button>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <section>
        <h2 className="mb-3 font-display text-sm font-bold">Worksheets in the workbook</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXPORT_SHEETS.map((sheet) => (
            <article key={sheet.key} className="frost rounded-2xl p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="flex items-center gap-2 font-display text-sm font-bold">
                  <FileSpreadsheet aria-hidden="true" className="size-4 text-brand-deep" />
                  {sheet.label}
                </h3>
                <span
                  className={
                    sheet.status === "implemented"
                      ? "rounded-full bg-brand/12 px-2 py-0.5 text-[11px] font-medium text-brand-deep"
                      : "rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  }
                >
                  {STATUS_LABEL[sheet.status]}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{sheet.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="frost rounded-2xl p-5 text-sm">
        <h2 className="font-display text-sm font-bold">Not included</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          {EXPORT_PENDING_COLUMNS.map((c) => (
            <li key={c}>{c}</li>
          ))}
          <li>Passwords, sign-in tokens, staff account IDs, profiles, roles and session logs.</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Only research staff can generate this file. Each export is recorded in the audit trail.
        </p>
      </section>
    </ResearchShell>
  );
}
