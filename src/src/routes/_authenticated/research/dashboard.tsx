import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart3,
  CalendarClock,
  Download,
  ListChecks,
  RefreshCw,
  Shuffle,
  Stethoscope,
  Users,
} from "lucide-react";
import { ResearchShell } from "@/components/layout/ResearchShell";
import { ErrorState, LoadingRows } from "@/components/common/States";
import { AddParticipantDialog } from "@/components/participants/AddParticipantDialog";
import { Button } from "@/components/ui/button";
import {
  BarList,
  Flag,
  Metric,
  Note,
  Panel,
  countBars,
  pct,
  when,
} from "@/components/research/AnalyticsUi";
import { useResearchAnalytics } from "@/hooks/useResearchAnalytics";
import { DatasetScopeSelect, DevelopmentViewNote } from "@/components/research/DatasetScopeSelect";
import type { Dataset } from "@/lib/test-records";
import { LIFECYCLE_LABELS, type LifecycleStage } from "@/lib/lifecycle";
import { MILESTONE_LABELS } from "@/lib/study";
import { ratio } from "@/lib/analytics";

export const Route = createFileRoute("/_authenticated/research/dashboard")({
  head: () => ({
    meta: [
      { title: "Research Dashboard — NeuroCare Connect" },
      {
        name: "description",
        content:
          "Live study operations: participant flow, randomisation balance, follow-up monitoring, DRPs and recent research activity.",
      },
      { property: "og:title", content: "Research Dashboard — NeuroCare Connect" },
      {
        property: "og:description",
        content:
          "Live participant flow, randomisation balance, follow-ups and DRPs for the research team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResearchDashboard,
});

function ResearchDashboard() {
  const [dataset, setDataset] = useState<Dataset>("study");
  const { data, isPending, isError, error, refetch, isFetching } = useResearchAnalytics(
    undefined,
    12,
    dataset,
  );

  return (
    <ResearchShell
      title="Study dashboard"
      description="Live operational overview of the neuropathic pain study."
      breadcrumbs={[{ label: "Research" }, { label: "Dashboard" }]}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {data ? `Updated ${when(data.generatedAt)}` : "Loading live data…"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <DatasetScopeSelect value={dataset} onChange={setDataset} />
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />{" "}
            Refresh
          </Button>
        </div>
      </div>

      <DevelopmentViewNote dataset={dataset} />

      {isPending ? (
        <LoadingRows rows={6} />
      ) : isError ? (
        <ErrorState
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      ) : (
        <Body a={data} />
      )}
    </ResearchShell>
  );
}

function Body({ a }: { a: NonNullable<ReturnType<typeof useResearchAnalytics>["data"]> }) {
  const t = a.totals;
  const flow = [
    { label: "Screened", value: t.screened },
    { label: "Eligible", value: t.eligible },
    { label: "Consented", value: t.consented },
    { label: "Enrolled", value: t.enrolled },
    { label: "Baseline completed", value: t.baseline },
    { label: "Randomised", value: t.randomised },
    { label: "Day 15 completed", value: t.day15 },
    { label: "Day 30 completed", value: t.day30 },
  ];

  const testNote =
    a.dataset === "study" && a.testRecordsExcluded > 0 ? (
      <p className="rounded-xl border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
        {a.testRecordsExcluded} development record{a.testRecordsExcluded === 1 ? "" : "s"} excluded from
        every figure on this page.
      </p>
    ) : null;

  if (t.participants === 0) {
    const hasTest = a.testRecordsExcluded > 0;
    return (
      <>
      {testNote}
      <Panel
        title={hasTest ? "No real study participants yet" : "No participants yet"}
        description={
          hasTest
            ? `Study figures count real participants only. ${a.testRecordsExcluded} development record${a.testRecordsExcluded === 1 ? " is" : "s are"} saved and can be opened from the Participants page.`
            : "The study database currently contains zero study participants."
        }
      >
        <p className="text-sm text-muted-foreground">
          Add the first participant to begin screening. Metrics appear here as soon as data is
          recorded.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {hasTest ? (
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/research/participants">View test participants</Link>
            </Button>
          ) : null}
          <AddParticipantDialog />
        </div>
      </Panel>
      </>
    );
  }

  return (
    <>
      {testNote}
      <section aria-label="Summary metrics" className="space-y-2">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
          <Metric label="Participants" value={t.participants} />
          <Metric
            label="Screened"
            value={t.screened}
            hint={pct(ratio(t.screened, t.participants).pct) + " of total"}
          />
          <Metric label="Eligible" value={t.eligible} />
          <Metric label="Enrolled" value={t.enrolled} />
          <Metric label="Randomised" value={t.randomised} />
          <Metric label="Control" value={t.control} />
          <Metric label="Intervention" value={t.intervention} />
        </div>
        <p className="text-xs text-muted-foreground">
          Cumulative progression counts — a participant is counted in every stage they have reached,
          so stages are not mutually exclusive.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Participant flow"
          description="Participants who have reached each stage."
          className="lg:col-span-2"
        >
          <BarList
            items={flow.map((f, i) => ({
              ...f,
              sub:
                i > 0 && flow[i - 1]!.value > 0
                  ? `${pct(ratio(f.value, flow[i - 1]!.value).pct)} of previous`
                  : undefined,
            }))}
          />
          <Note>
            Not eligible: {t.notEligible} · Withdrawn: {t.withdrawn}
          </Note>
        </Panel>

        <Panel title="Randomisation balance" description="From database randomisation records.">
          {t.randomised === 0 ? (
            <p className="text-sm text-muted-foreground">
              No participants have been randomised yet.
            </p>
          ) : (
            <>
              <div className="flex h-4 overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-arm-control"
                  style={{ width: `${(t.control / t.randomised) * 100}%` }}
                />
                <div
                  className="bg-arm-intervention"
                  style={{ width: `${(t.intervention / t.randomised) * 100}%` }}
                />
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <dt className="text-xs text-muted-foreground">Control</dt>
                  <dd className="font-display text-xl font-bold text-arm-control">{t.control}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Intervention</dt>
                  <dd className="font-display text-xl font-bold text-arm-intervention">
                    {t.intervention}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Total</dt>
                  <dd className="font-display text-xl font-bold">{t.randomised}</dd>
                </div>
              </dl>
              <Note>
                Share of randomised: Control {pct(ratio(t.control, t.randomised).pct)}, Intervention{" "}
                {pct(ratio(t.intervention, t.randomised).pct)}.
              </Note>
            </>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Follow-up monitoring"
          description="Completion against participants who have become due for each visit."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {a.followUp.map((f) => (
              <div key={f.visit} className="inset-tile rounded-xl p-4">
                <p className="text-sm font-semibold">{MILESTONE_LABELS[f.visit]}</p>
                <dl className="mt-2 space-y-1 text-sm">
                  <Row k={`Due (${f.denominatorLabel.toLowerCase()})`} v={f.due} />
                  <Row k="Completed" v={f.completed} />
                  <Row k="Pending" v={f.pending} />
                  <Row k="Completion" v={f.due > 0 ? pct(f.pct) : "—"} />
                </dl>
              </div>
            ))}
          </div>
          <Note>Overdue status requires protocol-defined visit window.</Note>
        </Panel>

        <Panel title="Milestone status" description="Stored visit records by status.">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="py-1 text-left font-medium">Visit</th>
                <th className="text-right font-medium">Pending</th>
                <th className="text-right font-medium">In progress</th>
                <th className="text-right font-medium">Completed</th>
              </tr>
            </thead>
            <tbody>
              {a.milestones.map((m) => (
                <tr key={m.visit} className="border-t border-border">
                  <td className="py-2">{MILESTONE_LABELS[m.visit]}</td>
                  <td className="text-right tabular-nums">{m.pending}</td>
                  <td className="text-right tabular-nums">{m.in_progress}</td>
                  <td className="text-right tabular-nums">{m.completed}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Note>
            Counts only visits that have a stored record; participants not yet at a visit are not
            counted as pending.
          </Note>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="DRP overview"
          description="Drug-related problems as recorded."
          className="lg:col-span-2"
          actions={<Flag>PCNE V9.1 code verification pending</Flag>}
        >
          {a.drp.total === 0 ? (
            <p className="text-sm text-muted-foreground">No DRP data available yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Total DRPs" value={a.drp.total} />
                <Metric label="Potential" value={a.drp.potential} />
                <Metric label="Manifest" value={a.drp.manifest} />
                <Metric label="Resolved" value={a.drp.resolved} />
                <Metric label="Unresolved" value={a.drp.unresolved} />
                <Metric label="Recommendations" value={a.drp.recommendations} />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  By PCNE problem code
                </p>
                <BarList items={countBars(a.drp.problems)} />
              </div>
            </div>
          )}
          <Note>
            Resolution rate: Pending protocol confirmation · Physician acceptance rate: Pending
            protocol confirmation
          </Note>
        </Panel>

        <Panel
          title="Where the study is now"
          description="Participants by current lifecycle stage."
        >
          <BarList
            items={a.currentStage.map((s) => ({
              label: LIFECYCLE_LABELS[s.key as LifecycleStage] ?? s.key,
              value: s.count,
            }))}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Recent research activity"
          description="Latest recorded events, from database timestamps."
          className="lg:col-span-2"
        >
          {a.activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ol className="divide-y divide-border">
              {a.activity.map((e, i) => (
                <li
                  key={`${e.at}-${i}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium">{e.action}</span>
                    {e.code ? (
                      <span className="ml-2 font-mono text-xs text-brand-deep">{e.code}</span>
                    ) : null}
                    {e.detail ? (
                      <span className="ml-2 text-xs text-muted-foreground">{e.detail}</span>
                    ) : null}
                  </span>
                  <time dateTime={e.at} className="text-xs tabular-nums text-muted-foreground">
                    {when(e.at)}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Quick actions">
          <div className="grid gap-2">
            <AddParticipantDialog />
            <QA to="/research/participants" icon={Users} label="View participants" />
            <QA to="/research/randomization" icon={Shuffle} label="Randomisation" />
            <QA to="/research/participants" icon={CalendarClock} label="Open follow-ups" />
            <QA to="/research/analytics" icon={Stethoscope} label="View DRPs" />
            <QA to="/research/analytics" icon={BarChart3} label="View analytics" />
            <QA to="/research/export" icon={Download} label="Export research data" />
          </div>
          <Note>Participant study reports are downloaded from each participant&apos;s page.</Note>
        </Panel>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-semibold tabular-nums">{v}</dd>
    </div>
  );
}

function QA({
  to,
  icon: Icon,
  label,
}: {
  to:
    | "/research/participants"
    | "/research/randomization"
    | "/research/analytics"
    | "/research/export";
  icon: typeof ListChecks;
  label: string;
}) {
  return (
    <Button asChild variant="outline" className="justify-start">
      <Link to={to}>
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </Link>
    </Button>
  );
}
