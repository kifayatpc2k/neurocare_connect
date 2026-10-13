import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { ResearchShell } from "@/components/layout/ResearchShell";
import { ErrorState, LoadingRows } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarList,
  Flag,
  Metric,
  Note,
  Panel,
  StatCell,
  TrajectoryChart,
  countBars,
  pct,
  signed,
  when,
} from "@/components/research/AnalyticsUi";
import { ALL_FILTERS, useResearchAnalytics } from "@/hooks/useResearchAnalytics";
import { DatasetScopeSelect, DevelopmentViewNote } from "@/components/research/DatasetScopeSelect";
import type { Dataset } from "@/lib/test-records";
import {
  ARMS,
  VISITS,
  ratio,
  type Analytics,
  type AnalyticsFilters,
  type OutcomeRow,
  type Visit,
} from "@/lib/analytics";
import { NEPIQOL_MAPPING_STATUS } from "@/lib/instruments";
import { MILESTONE_LABELS, STUDY_GROUP_LABELS } from "@/lib/study";

export const Route = createFileRoute("/_authenticated/research/analytics")({
  head: () => ({
    meta: [
      { title: "Study Analytics — NeuroCare Connect" },
      {
        name: "description",
        content:
          "Descriptive research analytics: study flow, randomisation, NRS and NePIQoL outcomes, DN4, DRPs, medications and data completeness.",
      },
      { property: "og:title", content: "Study Analytics — NeuroCare Connect" },
      {
        property: "og:description",
        content: "Descriptive analytics across study arms, outcomes, DRPs and data completeness.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResearchAnalytics,
});

type VisitFilter = "all" | Visit;

function ResearchAnalytics() {
  const [filters, setFilters] = useState<AnalyticsFilters>(ALL_FILTERS);
  const [visit, setVisit] = useState<VisitFilter>("all");
  const [dataset, setDataset] = useState<Dataset>("study");
  const { data, isPending, isError, error, refetch, isFetching } = useResearchAnalytics(
    filters,
    12,
    dataset,
  );
  const set = <K extends keyof AnalyticsFilters>(k: K, v: AnalyticsFilters[K]) =>
    setFilters((f) => ({ ...f, [k]: v }));

  return (
    <ResearchShell
      title="Analytics"
      description="Descriptive analysis of recorded study data. No statistical testing or clinical interpretation is applied."
      breadcrumbs={[{ label: "Research" }, { label: "Analytics" }]}
    >
      <section
        aria-label="Filters"
        className="frost grid gap-3 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        <Field label="Study group">
          <Select
            value={filters.group}
            onValueChange={(v) => set("group", v as AnalyticsFilters["group"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="control">Control</SelectItem>
              <SelectItem value="intervention">Intervention</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Visit">
          <Select value={visit} onValueChange={(v) => setVisit(v as VisitFilter)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All visits</SelectItem>
              {VISITS.map((v) => (
                <SelectItem key={v} value={v}>
                  {MILESTONE_LABELS[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Participant status">
          <Select
            value={filters.status}
            onValueChange={(v) => set("status", v as AnalyticsFilters["status"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["all", "screening", "enrolled", "withdrawn", "completed"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? "All" : s[0]!.toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Record created from">
          <Input
            type="date"
            value={filters.from ?? ""}
            onChange={(e) => set("from", e.target.value || null)}
          />
        </Field>
        <Field label="Record created to">
          <Input
            type="date"
            value={filters.to ?? ""}
            onChange={(e) => set("to", e.target.value || null)}
          />
        </Field>
        <Field label="Dataset">
          <DatasetScopeSelect value={dataset} onChange={setDataset} />
        </Field>
        <div className="flex items-end gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setFilters(ALL_FILTERS);
              setVisit("all");
            }}
          >
            Reset
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
          </Button>
        </div>
      </section>
      <DevelopmentViewNote dataset={dataset} />
      {filters.group !== "all" ? (
        <p className="text-xs text-muted-foreground">
          Group filter limits results to randomised participants in that arm.
        </p>
      ) : null}

      {isPending ? (
        <LoadingRows rows={8} />
      ) : isError ? (
        <ErrorState
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      ) : (
        <Body a={data} visit={visit} />
      )}
    </ResearchShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Body({ a, visit }: { a: Analytics; visit: VisitFilter }) {
  const t = a.totals;
  const visits = visit === "all" ? VISITS : VISITS.filter((v) => v === visit);
  if (t.participants === 0) {
    return (
      <Panel
        title="No data for this selection"
        description="Zero participants match the current filters."
      >
        <p className="text-sm text-muted-foreground">
          Adjust or reset the filters, or add participants to begin collecting data.
        </p>
      </Panel>
    );
  }
  const flow: [string, number, number | null][] = [
    ["Screened", t.screened, t.participants],
    ["Eligible", t.eligible, t.screened],
    ["Consented", t.consented, t.eligible],
    ["Enrolled", t.enrolled, t.consented],
    ["Baseline completed", t.baseline, t.enrolled],
    ["Randomised", t.randomised, t.baseline],
    ["Control", t.control, t.randomised],
    ["Intervention", t.intervention, t.randomised],
    ["Day 15 completed", t.day15, t.randomised],
    ["Day 30 completed", t.day30, t.day15],
  ];
  const traj = (rows: OutcomeRow[]) =>
    ARMS.map((g) => ({
      name: STUDY_GROUP_LABELS[g],
      className: g === "control" ? "text-arm-control" : "text-arm-intervention",
      points: VISITS.map((v) => {
        const r = rows.find((x) => x.group === g && x.visit === v)!;
        return { label: MILESTONE_LABELS[v], mean: r.stats.mean, n: r.stats.n };
      }),
    }));

  return (
    <>
      <p className="text-xs text-muted-foreground">Computed {when(a.generatedAt)}</p>

      <Panel
        title="A. Participant / study flow"
        description="Cumulative counts; % is relative to the preceding stage."
      >
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {flow.map(([label, n, d]) => (
            <Metric
              key={label}
              label={label}
              value={n}
              hint={d ? `${pct(ratio(n, d).pct)} of ${d}` : "—"}
            />
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="B. Randomisation"
          description="Allocation counts from randomisation records. No significance testing is performed."
        >
          {t.randomised === 0 ? (
            <p className="text-sm text-muted-foreground">
              No participants have been randomised yet.
            </p>
          ) : (
            <BarList
              items={[
                {
                  label: "Control",
                  value: t.control,
                  sub: pct(ratio(t.control, t.randomised).pct),
                },
                {
                  label: "Intervention",
                  value: t.intervention,
                  sub: pct(ratio(t.intervention, t.randomised).pct),
                },
              ]}
            />
          )}
          <Note>Total randomised: {t.randomised}</Note>
        </Panel>
        <Panel title="I. Follow-up completion">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="text-left font-medium">Visit</th>
                <th className="text-left font-medium">Denominator</th>
                <th className="text-right font-medium">Completed</th>
                <th className="text-right font-medium">Pending</th>
                <th className="text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {a.followUp.map((f) => (
                <tr key={f.visit} className="border-t border-border">
                  <td className="py-2">{MILESTONE_LABELS[f.visit]}</td>
                  <td className="text-xs text-muted-foreground">
                    {f.denominatorLabel} ({f.due})
                  </td>
                  <td className="text-right tabular-nums">{f.completed}</td>
                  <td className="text-right tabular-nums">{f.pending}</td>
                  <td className="text-right tabular-nums">{pct(f.pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Note>Overdue status requires protocol-defined visit window.</Note>
        </Panel>
      </div>

      <Panel
        title="C. NRS outcomes"
        description="Pain score 0–10. Mean (n, SD, median) among participants with a recorded assessment; change is paired with the same participant's baseline."
      >
        <OutcomeTable rows={a.nrs} visits={visits} />
      </Panel>

      <Panel
        title="D. NRS trajectory"
        description="Mean NRS among participants with recorded assessment — group means, not individual trajectories. Missing visits are not interpolated."
      >
        <TrajectoryChart series={traj(a.nrs)} max={10} yLabel="Mean NRS (0–10)" />
      </Panel>

      <Panel
        title="E. NePIQoL outcomes"
        description="Totals and subscales from the existing scoring implementation (total range 42–210)."
        actions={<Flag tone="provisional">PROVISIONAL — {NEPIQOL_MAPPING_STATUS}</Flag>}
      >
        <OutcomeTable rows={a.nepiqol} visits={visits} />
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="text-left font-medium">Group · Visit</th>
                {a.nepiqol[0]!.subscales.map((s) => (
                  <th key={s.key} className="text-right font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {a.nepiqol
                .filter((r) => visits.includes(r.visit))
                .map((r) => (
                  <tr key={r.group + r.visit} className="border-t border-border">
                    <td className="py-2">
                      {STUDY_GROUP_LABELS[r.group]} · {MILESTONE_LABELS[r.visit]}
                    </td>
                    {r.subscales.map((s) => (
                      <td key={s.key} className="text-right tabular-nums">
                        {s.stats.n ? `${s.stats.mean} (n=${s.stats.n})` : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5">
          <TrajectoryChart
            series={traj(a.nepiqol)}
            max={210}
            yLabel="Mean NePIQoL total — PROVISIONAL"
          />
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="F. DN4"
          description="Descriptive only. No diagnostic cutoff or clinical interpretation is applied."
        >
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Recorded assessments" value={a.dn4.assessments} />
            <Metric
              label="Baseline mean"
              value={a.dn4.baseline.n ? a.dn4.baseline.mean : "—"}
              hint={
                a.dn4.baseline.n
                  ? `n=${a.dn4.baseline.n}, median ${a.dn4.baseline.median}`
                  : "Insufficient recorded data"
              }
            />
          </div>
          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Score distribution (all visits)
          </p>
          {a.dn4.assessments === 0 ? (
            <p className="text-sm text-muted-foreground">No DN4 assessments recorded yet.</p>
          ) : (
            <BarList
              items={a.dn4.distribution.map((d) => ({ label: `Score ${d.score}`, value: d.count }))}
            />
          )}
        </Panel>

        <Panel
          title="H. Medication / interaction summary"
          description="Descriptive counts of existing records. No risk scoring."
        >
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Medication records" value={a.medication.records} />
            <Metric label="Participants reviewed" value={a.medication.participantsReviewed} />
            <Metric label="Current medications" value={a.medication.current} />
            <Metric label="Drug interactions" value={a.medication.interactions} />
          </div>
          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Interactions by recorded severity
          </p>
          <BarList
            items={countBars(a.medication.severities)}
            empty="No interactions recorded yet."
          />
        </Panel>
      </div>

      <Panel title="G. DRP analytics" actions={<Flag>PCNE V9.1 code verification pending</Flag>}>
        {a.drp.total === 0 ? (
          <p className="text-sm text-muted-foreground">No DRP data available yet.</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Metric label="Total DRPs" value={a.drp.total} />
              <Metric
                label="Per participant with DRP"
                value={a.drp.perParticipant ?? "—"}
                hint={`${a.drp.participantsWithDrp} participants`}
              />
              <Metric label="Potential" value={a.drp.potential} />
              <Metric
                label="Manifest"
                value={a.drp.manifest}
                hint={a.drp.unclassified ? `${a.drp.unclassified} unclassified` : undefined}
              />
              <Metric label="Resolved" value={a.drp.resolved} />
              <Metric label="Unresolved" value={a.drp.unresolved} />
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Dist title="Problem codes" items={countBars(a.drp.problems)} />
              <Dist title="Cause codes" items={countBars(a.drp.causes)} />
              <Dist title="Intervention codes" items={countBars(a.drp.interventions)} />
              <Dist title="Acceptance codes" items={countBars(a.drp.acceptance)} />
              <Dist
                title={`Physician recommendation acceptance (${a.drp.recommendations} records)`}
                items={countBars(a.drp.recommendationAcceptance)}
              />
            </div>
          </>
        )}
        <Note>
          Resolution rate: Pending protocol confirmation · Physician acceptance rate: Pending
          protocol confirmation
        </Note>
      </Panel>

      <Panel
        title="J. Recorded data completeness"
        description="Recorded / valid denominator. Missing records indicate unrecorded data, not clinical absence."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="text-left font-medium">Item</th>
                <th className="text-left font-medium">Denominator</th>
                <th className="text-right font-medium">Recorded</th>
                <th className="text-right font-medium">Missing</th>
                <th className="text-right font-medium">Completeness</th>
              </tr>
            </thead>
            <tbody>
              {a.completeness.map((c) => (
                <tr key={c.key} className="border-t border-border">
                  <td className="py-2">{c.label}</td>
                  <td className="text-xs text-muted-foreground">
                    {c.denominatorLabel} ({c.ratio.denominator})
                  </td>
                  <td className="text-right tabular-nums">{c.ratio.numerator}</td>
                  <td className="text-right tabular-nums">
                    {c.ratio.denominator - c.ratio.numerator}
                  </td>
                  <td className="text-right tabular-nums">{pct(c.ratio.pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function Dist({ title, items }: { title: string; items: { label: string; value: number }[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <BarList items={items} empty="None recorded." />
    </div>
  );
}

function OutcomeTable({ rows, visits }: { rows: OutcomeRow[]; visits: Visit[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th className="text-left font-medium">Group</th>
            <th className="text-left font-medium">Visit</th>
            <th className="text-left font-medium">Mean score</th>
            <th className="text-left font-medium">Change from baseline</th>
          </tr>
        </thead>
        <tbody>
          {rows
            .filter((r) => visits.includes(r.visit))
            .map((r) => (
              <tr key={r.group + r.visit} className="border-t border-border">
                <td className="py-2">{STUDY_GROUP_LABELS[r.group]}</td>
                <td>{MILESTONE_LABELS[r.visit]}</td>
                <td>
                  <StatCell s={r.stats} />
                </td>
                <td>
                  {r.change === null ? (
                    <span className="text-xs text-muted-foreground">Reference visit</span>
                  ) : r.change.n === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Insufficient recorded data
                    </span>
                  ) : (
                    <span className="tabular-nums">
                      {signed(r.change.mean)}{" "}
                      <span className="text-xs text-muted-foreground">
                        (paired n={r.change.n}
                        {r.change.sd !== null ? `, SD ${r.change.sd}` : ""})
                      </span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
