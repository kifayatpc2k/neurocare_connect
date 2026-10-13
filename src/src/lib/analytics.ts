/**
 * Pure research-analytics aggregation. Browser-safe and side-effect free:
 * the server function feeds it RLS-scoped rows and returns only the result,
 * and the Excel export reuses it so dashboard, analytics and workbook agree.
 *
 * Rules: never fabricate values. `null` means "cannot be calculated"; a 0
 * count is a genuine observed zero. Protocol-dependent rates (DRP resolution,
 * physician acceptance) and visit overdue windows are deliberately absent.
 */
import {
  NEPIQOL_ITEM_COUNT,
  NEPIQOL_SUBSCALES,
  PCNE_ACCEPTANCE,
  PCNE_CAUSES,
  PCNE_INTERVENTIONS,
  PCNE_PROBLEMS,
  labelOf,
  scoreDn4,
  scoreNepiqol,
  type PcneCode,
} from "@/lib/instruments";

export type Visit = "baseline" | "day_15" | "day_30";
export const VISITS: Visit[] = ["baseline", "day_15", "day_30"];
export type Arm = "control" | "intervention";
export const ARMS: Arm[] = ["control", "intervention"];

type R = Record<string, unknown> &
  Partial<
    Record<
      | "acceptance_status"
      | "action"
      | "at"
      | "baseline_completed_at"
      | "completed"
      | "conducted_at"
      | "consent_date"
      | "consent_status"
      | "contacted_at"
      | "created_at"
      | "day_15_completed_at"
      | "day_15_opened_at"
      | "day_30_completed_at"
      | "due"
      | "eligibility_status"
      | "enrolled_at"
      | "entity_id"
      | "entries"
      | "get"
      | "id"
      | "identified_at"
      | "instrument"
      | "is_current"
      | "items"
      | "lifecycle_stage"
      | "milestone"
      | "participant_code"
      | "participant_id"
      | "pcne_acceptance_code"
      | "pcne_cause_codes"
      | "pcne_intervention_codes"
      | "pcne_problem_code"
      | "problem_type"
      | "randomized_at"
      | "responses"
      | "score"
      | "screening_date"
      | "session_date"
      | "set"
      | "severity"
      | "status"
      | "study_group"
      | "total",
      unknown
    >
  >;

export type Raw = {
  participants: R[];
  randomizations: R[];
  milestones: R[];
  assessments: R[];
  demographics: R[];
  clinical: R[];
  medications: R[];
  interactions: R[];
  drps: R[];
  recommendations: R[];
  counselling: R[];
  followUps: R[];
  audit: R[];
};

export type AnalyticsFilters = {
  group: "all" | Arm;
  status: "all" | "screening" | "enrolled" | "withdrawn" | "completed";
  from: string | null; // ISO date, applied to participant record creation
  to: string | null;
};

export type Stats = { n: number; mean: number | null; sd: number | null; median: number | null };
export type Change = { n: number; mean: number | null; sd: number | null };
export type Ratio = { numerator: number; denominator: number; pct: number | null };
export type CountItem = { key: string; label: string; count: number };

export type OutcomeRow = { group: Arm; visit: Visit; stats: Stats; change: Change | null };

export type Analytics = {
  generatedAt: string;
  filters: AnalyticsFilters;
  totals: {
    participants: number;
    screened: number;
    eligible: number;
    consented: number;
    enrolled: number;
    baseline: number;
    randomised: number;
    control: number;
    intervention: number;
    day15: number;
    day30: number;
    withdrawn: number;
    notEligible: number;
  };
  currentStage: CountItem[];
  followUp: {
    visit: "day_15" | "day_30";
    denominatorLabel: string;
    due: number;
    completed: number;
    pending: number;
    pct: number | null;
  }[];
  milestones: { visit: Visit; pending: number; in_progress: number; completed: number }[];
  nrs: OutcomeRow[];
  nepiqol: (OutcomeRow & { subscales: { key: string; label: string; stats: Stats }[] })[];
  dn4: {
    assessments: number;
    baseline: Stats;
    distribution: { score: number; count: number }[];
    byVisit: { visit: Visit; stats: Stats }[];
  };
  drp: {
    total: number;
    potential: number;
    manifest: number;
    unclassified: number;
    resolved: number;
    unresolved: number;
    participantsWithDrp: number;
    perParticipant: number | null;
    problems: CountItem[];
    causes: CountItem[];
    interventions: CountItem[];
    acceptance: CountItem[];
    recommendations: number;
    recommendationAcceptance: CountItem[];
  };
  medication: {
    records: number;
    participantsReviewed: number;
    current: number;
    interactions: number;
    severities: CountItem[];
  };
  completeness: { key: string; label: string; denominatorLabel: string; ratio: Ratio }[];
  activity: { at: string; action: string; code: string | null; detail: string | null }[];
};

const str = (v: unknown) => (typeof v === "string" ? v : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const round = (v: number | null, d = 2) => (v === null ? null : Math.round(v * 10 ** d) / 10 ** d);

export function describe(values: number[]): Stats {
  const n = values.length;
  if (n === 0) return { n, mean: null, sd: null, median: null };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const sd = n >= 2 ? Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : null;
  const s = [...values].sort((a, b) => a - b);
  const median = n % 2 ? s[(n - 1) / 2]! : (s[n / 2 - 1]! + s[n / 2]!) / 2;
  return { n, mean: round(mean), sd: round(sd), median: round(median) };
}

export const ratio = (numerator: number, denominator: number): Ratio => ({
  numerator,
  denominator,
  pct: denominator > 0 ? round((numerator / denominator) * 100, 1) : null,
});

function tally(values: string[], catalogue?: PcneCode[]): CountItem[] {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()]
    .map(([key, count]) => ({
      key,
      label: catalogue ? labelOf(catalogue, key) || key : key,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function computeAnalytics(
  raw: Raw,
  filters: AnalyticsFilters,
  activityLimit = 12,
): Analytics {
  // Authoritative (current) allocation: participants.study_group, which only the
  // randomisation function or an audited override can set. Restricted to
  // participants with a permanent randomisation record; the original arm stays
  // in randomizations / allocation_overrides for traceability.
  const randomised = new Set(raw.randomizations.map((r) => str(r.participant_id)).filter(Boolean));
  const allocation = new Map<string, Arm>();
  for (const p of raw.participants) {
    const g = str(p.study_group);
    const id = str(p.id);
    if (id && randomised.has(id) && (g === "control" || g === "intervention")) allocation.set(id, g);
  }

  const participants = raw.participants.filter((p) => {
    const id = p.id as string;
    if (filters.group !== "all" && allocation.get(id) !== filters.group) return false;
    if (filters.status !== "all" && p.status !== filters.status) return false;
    const created = str(p.created_at)?.slice(0, 10);
    if (filters.from && created && created < filters.from) return false;
    if (filters.to && created && created > filters.to) return false;
    return true;
  });
  const ids = new Set(participants.map((p) => p.id as string));
  const code = new Map(participants.map((p) => [p.id as string, str(p.participant_code)]));
  const mine = (rows: R[]) => rows.filter((r) => ids.has(r.participant_id as string));

  const has = (k: string) => participants.filter((p) => p[k] !== null && p[k] !== undefined).length;
  const randomisedIds = [...ids].filter((id) => allocation.has(id));
  const totals = {
    participants: participants.length,
    screened: participants.filter(
      (p) => p.eligibility_status === "eligible" || p.eligibility_status === "not_eligible",
    ).length,
    eligible: participants.filter((p) => p.eligibility_status === "eligible").length,
    notEligible: participants.filter((p) => p.eligibility_status === "not_eligible").length,
    consented: participants.filter((p) => p.consent_status === "obtained").length,
    enrolled: has("enrolled_at"),
    baseline: has("baseline_completed_at"),
    randomised: randomisedIds.length,
    control: randomisedIds.filter((id) => allocation.get(id) === "control").length,
    intervention: randomisedIds.filter((id) => allocation.get(id) === "intervention").length,
    day15: has("day_15_completed_at"),
    day30: has("day_30_completed_at"),
    withdrawn: participants.filter((p) => p.status === "withdrawn").length,
  };

  const currentStage = tally(participants.map((p) => str(p.lifecycle_stage) ?? "unknown"));

  const day15Due = participants.filter((p) => allocation.has(p.id as string));
  const day30Due = participants.filter((p) => p.day_15_completed_at);
  const followUp = [
    {
      visit: "day_15" as const,
      denominatorLabel: "Randomised participants",
      due: day15Due.length,
      completed: day15Due.filter((p) => p.day_15_completed_at).length,
    },
    {
      visit: "day_30" as const,
      denominatorLabel: "Participants with Day 15 completed",
      due: day30Due.length,
      completed: day30Due.filter((p) => p.day_30_completed_at).length,
    },
  ].map((f) => ({ ...f, pending: f.due - f.completed, pct: ratio(f.completed, f.due).pct }));

  const ms = mine(raw.milestones);
  const milestones = VISITS.map((visit) => {
    const rows = ms.filter((m) => m.milestone === visit);
    return {
      visit,
      pending: rows.filter((m) => m.status === "pending").length,
      in_progress: rows.filter((m) => m.status === "in_progress").length,
      completed: rows.filter((m) => m.status === "completed").length,
    };
  });

  // Completed assessments only; keyed by instrument / visit / participant.
  const assess = mine(raw.assessments).filter((a) => a.status === "completed");
  const scoreMap = (instrument: string, score: (r: R) => number | null) => {
    const out = new Map<Visit, Map<string, number>>(VISITS.map((v) => [v, new Map()]));
    for (const a of assess) {
      if (String(a.instrument).toUpperCase() !== instrument) continue;
      const s = score((a.responses ?? {}) as R);
      if (s !== null) out.get(a.milestone as Visit)?.set(a.participant_id as string, s);
    }
    return out;
  };
  const nrsMap = scoreMap("NRS", (r) => num(r.score));
  const dn4Map = scoreMap("DN4", (r) =>
    Array.isArray(r.items) && r.items.length ? scoreDn4(r.items.map(Boolean)) : num(r.total),
  );
  const nepItems = new Map<Visit, Map<string, number[]>>(VISITS.map((v) => [v, new Map()]));
  for (const a of assess) {
    if (String(a.instrument).toUpperCase() !== "NEPIQOL") continue;
    const items = ((a.responses ?? {}) as R).items;
    if (
      Array.isArray(items) &&
      items.length === NEPIQOL_ITEM_COUNT &&
      items.every((x) => typeof x === "number" && x >= 1 && x <= 5)
    ) {
      nepItems.get(a.milestone as Visit)?.set(a.participant_id as string, items as number[]);
    }
  }
  const nepTotal = new Map<Visit, Map<string, number>>(
    VISITS.map((v) => [
      v,
      new Map([...nepItems.get(v)!].map(([id, it]) => [id, scoreNepiqol(it).total])),
    ]),
  );

  const outcome = (map: Map<Visit, Map<string, number>>): OutcomeRow[] =>
    ARMS.flatMap((group) =>
      VISITS.map((visit) => {
        const inArm = (id: string) => allocation.get(id) === group;
        const values = [...map.get(visit)!].filter(([id]) => inArm(id));
        let change: Change | null = null;
        if (visit !== "baseline") {
          const base = map.get("baseline")!;
          const diffs = values.filter(([id]) => base.has(id)).map(([id, v]) => v - base.get(id)!);
          const d = describe(diffs);
          change = { n: d.n, mean: d.mean, sd: d.sd };
        }
        return { group, visit, stats: describe(values.map(([, v]) => v)), change };
      }),
    );

  const nrs = outcome(nrsMap);
  const nepiqol = outcome(nepTotal).map((row) => ({
    ...row,
    subscales: NEPIQOL_SUBSCALES.map((s) => ({
      key: s.key,
      label: s.label,
      stats: describe(
        [...nepItems.get(row.visit)!]
          .filter(([id]) => allocation.get(id) === row.group)
          .map(([, it]) => scoreNepiqol(it).subscales[s.key] ?? 0),
      ),
    })),
  }));

  const allDn4 = VISITS.flatMap((v) => [...dn4Map.get(v)!.values()]);
  const dn4 = {
    assessments: allDn4.length,
    baseline: describe([...dn4Map.get("baseline")!.values()]),
    distribution: Array.from({ length: 11 }, (_, score) => ({
      score,
      count: allDn4.filter((s) => s === score).length,
    })),
    byVisit: VISITS.map((visit) => ({ visit, stats: describe([...dn4Map.get(visit)!.values()]) })),
  };

  const drps = mine(raw.drps);
  const recs = mine(raw.recommendations);
  const drpParticipants = new Set(drps.map((d) => d.participant_id as string)).size;
  const drp = {
    total: drps.length,
    potential: drps.filter((d) => d.problem_type === "potential").length,
    manifest: drps.filter((d) => d.problem_type === "manifest").length,
    unclassified: drps.filter(
      (d) => d.problem_type !== "potential" && d.problem_type !== "manifest",
    ).length,
    resolved: drps.filter((d) => d.status === "resolved").length,
    unresolved: drps.filter((d) => d.status !== "resolved").length,
    participantsWithDrp: drpParticipants,
    perParticipant: drpParticipants > 0 ? round(drps.length / drpParticipants) : null,
    problems: tally(
      drps.map((d) => str(d.pcne_problem_code)).filter((x): x is string => !!x),
      PCNE_PROBLEMS,
    ),
    causes: tally(
      drps.flatMap((d) =>
        Array.isArray(d.pcne_cause_codes) ? (d.pcne_cause_codes as string[]) : [],
      ),
      PCNE_CAUSES,
    ),
    interventions: tally(
      drps.flatMap((d) =>
        Array.isArray(d.pcne_intervention_codes) ? (d.pcne_intervention_codes as string[]) : [],
      ),
      PCNE_INTERVENTIONS,
    ),
    acceptance: tally(
      drps.map((d) => str(d.pcne_acceptance_code)).filter((x): x is string => !!x),
      PCNE_ACCEPTANCE,
    ),
    recommendations: recs.length,
    recommendationAcceptance: tally(recs.map((r) => str(r.acceptance_status) ?? "unrecorded")),
  };

  const meds = mine(raw.medications);
  const inter = mine(raw.interactions);
  const medication = {
    records: meds.length,
    participantsReviewed: new Set(meds.map((m) => m.participant_id as string)).size,
    current: meds.filter((m) => m.is_current === true).length,
    interactions: inter.length,
    severities: tally(inter.map((i) => str(i.severity)?.trim() || "Not recorded")),
  };

  const withRow = (rows: R[]) => new Set(mine(rows).map((r) => r.participant_id as string));
  const demo = withRow(raw.demographics);
  const clin = withRow(raw.clinical);
  const enrolledIds = participants.filter((p) => p.enrolled_at).map((p) => p.id as string);
  const count = (pool: string[], set: Set<string> | Map<string, unknown>) =>
    pool.filter((id) => set.has(id)).length;
  const d15Pool = day15Due.filter((p) => p.day_15_completed_at).map((p) => p.id as string);
  const d30Pool = participants.filter((p) => p.day_30_completed_at).map((p) => p.id as string);
  const completeness = [
    {
      key: "demographics",
      label: "Demographics recorded",
      denominatorLabel: "Enrolled",
      pool: enrolledIds,
      set: demo,
    },
    {
      key: "clinical",
      label: "Clinical data recorded",
      denominatorLabel: "Enrolled",
      pool: enrolledIds,
      set: clin,
    },
    {
      key: "nrs_b",
      label: "Baseline NRS",
      denominatorLabel: "Enrolled",
      pool: enrolledIds,
      set: nrsMap.get("baseline")!,
    },
    {
      key: "dn4_b",
      label: "Baseline DN4",
      denominatorLabel: "Enrolled",
      pool: enrolledIds,
      set: dn4Map.get("baseline")!,
    },
    {
      key: "nep_b",
      label: "Baseline NePIQoL",
      denominatorLabel: "Enrolled",
      pool: enrolledIds,
      set: nepTotal.get("baseline")!,
    },
    {
      key: "nrs_15",
      label: "Day 15 NRS",
      denominatorLabel: "Day 15 completed",
      pool: d15Pool,
      set: nrsMap.get("day_15")!,
    },
    {
      key: "nep_15",
      label: "Day 15 NePIQoL",
      denominatorLabel: "Day 15 completed",
      pool: d15Pool,
      set: nepTotal.get("day_15")!,
    },
    {
      key: "nrs_30",
      label: "Day 30 NRS",
      denominatorLabel: "Day 30 completed",
      pool: d30Pool,
      set: nrsMap.get("day_30")!,
    },
    {
      key: "nep_30",
      label: "Day 30 NePIQoL",
      denominatorLabel: "Day 30 completed",
      pool: d30Pool,
      set: nepTotal.get("day_30")!,
    },
  ].map(({ key, label, denominatorLabel, pool, set }) => ({
    key,
    label,
    denominatorLabel,
    ratio: ratio(count(pool, set), pool.length),
  }));

  // Activity: real timestamps only. No actor IDs are ever returned.
  const ev: Analytics["activity"] = [];
  const push = (at: unknown, action: string, pid: unknown, detail: string | null = null) => {
    const t = str(at);
    if (t) ev.push({ at: t, action, code: code.get(pid as string) ?? null, detail });
  };
  const VL: Record<string, string> = { baseline: "Baseline", day_15: "Day 15", day_30: "Day 30" };
  for (const p of participants) {
    push(p.created_at, "Participant created", p.id);
    if (p.eligibility_status !== "pending")
      push(
        p.screening_date,
        "Screening recorded",
        p.id,
        p.eligibility_status === "eligible" ? "Eligible" : "Not eligible",
      );
    if (p.consent_status !== "pending")
      push(
        p.consent_date,
        "Consent recorded",
        p.id,
        p.consent_status === "obtained" ? "Obtained" : "Not obtained",
      );
    push(p.enrolled_at, "Enrolment completed", p.id);
    push(p.baseline_completed_at, "Baseline completed", p.id);
    push(p.randomized_at, "Randomisation completed", p.id);
    push(p.day_15_opened_at, "Day 15 opened", p.id);
    push(p.day_15_completed_at, "Day 15 completed", p.id);
    push(p.day_30_completed_at, "Day 30 completed", p.id);
  }
  for (const a of assess)
    push(
      a.conducted_at,
      `${a.instrument} assessment recorded`,
      a.participant_id,
      VL[a.milestone as string] ?? null,
    );
  for (const d of drps)
    push(d.identified_at, "DRP recorded", d.participant_id, str(d.pcne_problem_code));
  for (const c of mine(raw.counselling))
    push(
      c.session_date,
      "Counselling recorded",
      c.participant_id,
      VL[c.milestone as string] ?? null,
    );
  for (const r of recs) push(r.created_at, "Physician recommendation recorded", r.participant_id);
  for (const f of mine(raw.followUps))
    push(
      f.contacted_at,
      "Follow-up contact recorded",
      f.participant_id,
      VL[f.milestone as string] ?? null,
    );
  for (const a of raw.audit) {
    if (a.action === "research_export_generated")
      push(a.created_at, "Research data exported", null);
    if (a.action === "patient_study_report_generated")
      push(a.created_at, "Study report generated", a.entity_id);
  }
  ev.sort((a, b) => (a.at < b.at ? 1 : -1));

  return {
    generatedAt: new Date().toISOString(),
    filters,
    totals,
    currentStage,
    followUp,
    milestones,
    nrs,
    nepiqol,
    dn4,
    drp,
    medication,
    completeness,
    activity: ev.slice(0, activityLimit),
  };
}
