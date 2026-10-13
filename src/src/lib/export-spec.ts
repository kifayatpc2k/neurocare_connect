/**
 * Worksheets included in the research Excel export. Browser-safe: the Export
 * page lists these, and the server function builds exactly these sheets.
 * `status` states honestly whether the sheet's content is protocol-approved.
 */
export type ExportSheetStatus = "implemented" | "provisional" | "pending";

export const EXPORT_SHEETS: {
  key: string;
  label: string;
  status: ExportSheetStatus;
  note: string;
}[] = [
  {
    key: "participants",
    label: "Participants",
    status: "implemented",
    note: "Study code, screening, consent, enrolment and visit dates.",
  },
  {
    key: "randomisation",
    label: "Randomisation",
    status: "implemented",
    note: "Database-assigned arm, method and allocation sequence.",
  },
  {
    key: "milestones",
    label: "Visit milestones",
    status: "implemented",
    note: "Baseline, Day 15 and Day 30 visit status.",
  },
  {
    key: "demographics",
    label: "Demographics",
    status: "provisional",
    note: "Fields currently captured; approved form specification pending.",
  },
  {
    key: "clinical",
    label: "Clinical data",
    status: "provisional",
    note: "Fields currently captured; approved form specification pending.",
  },
  {
    key: "medications",
    label: "Medications",
    status: "provisional",
    note: "Medication-review specification pending.",
  },
  {
    key: "interactions",
    label: "Drug interactions",
    status: "provisional",
    note: "Interaction specification and source pending.",
  },
  { key: "nrs", label: "NRS", status: "implemented", note: "Pain score (0–10) per visit." },
  {
    key: "dn4",
    label: "DN4",
    status: "implemented",
    note: "10 item answers and total. Reproduction authorisation pending.",
  },
  {
    key: "nepiqol",
    label: "NePIQoL",
    status: "provisional",
    note: "Answer positions (1–5), total and subscales. Response-option mapping awaiting approval.",
  },
  {
    key: "drps",
    label: "DRPs (PCNE)",
    status: "provisional",
    note: "PCNE codes as stored; official V9.1 list verification pending.",
  },
  {
    key: "recommendations",
    label: "Physician recommendations",
    status: "provisional",
    note: "Visit ownership and acceptance workflow rules pending.",
  },
  {
    key: "counselling",
    label: "Counselling",
    status: "provisional",
    note: "Counselling specification pending.",
  },
  {
    key: "follow_ups",
    label: "Follow-up contacts",
    status: "implemented",
    note: "Contact status and outcome per visit.",
  },
  {
    key: "laboratory",
    label: "Laboratory Investigations",
    status: "implemented",
    note: "One row per investigation; reference ranges as reported by the laboratory.",
  },
  {
    key: "adrs",
    label: "Adverse Drug Reactions",
    status: "implemented",
    note: "Historical and follow-up ADR reports; no causality is inferred.",
  },
  {
    key: "med_changes",
    label: "Medication Changes",
    status: "implemented",
    note: "Documented medication changes per follow-up visit.",
  },
  {
    key: "drp_outcomes",
    label: "DRP Follow-up Outcomes",
    status: "implemented",
    note: "Per-visit status and PCNE outcome for each DRP; the original DRP is not duplicated.",
  },
  {
    key: "study_summary",
    label: "Study Summary",
    status: "implemented",
    note: "Descriptive counts: flow, follow-up, DRPs and outcome availability. NePIQoL availability rows are PROVISIONAL.",
  },
  {
    key: "outcome_summary",
    label: "Outcome Summary",
    status: "provisional",
    note: "NRS and NePIQoL group/visit n, mean, SD, median and paired change. NePIQoL rows PROVISIONAL.",
  },
  {
    key: "drp_summary",
    label: "DRP Summary",
    status: "provisional",
    note: "Raw DRP counts by type, status and PCNE code. Rates pending protocol confirmation.",
  },
  {
    key: "completeness",
    label: "Data Completeness",
    status: "implemented",
    note: "Recorded data completeness against logically valid denominators.",
  },
];

export const EXPORT_PENDING_COLUMNS = [
  "DRP resolution rate — formula pending protocol confirmation",
  "Physician acceptance rate — formula pending protocol confirmation",
];
