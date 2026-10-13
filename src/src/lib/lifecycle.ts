/**
 * Participant lifecycle vocabulary and transition rules.
 *
 * The lifecycle is deliberately linear:
 * Screening → Eligible → Consent → Enrolment → Baseline → Randomisation →
 * Day 15 → Day 30. These helpers are pure so the UI and the server functions
 * enforce exactly the same rules.
 */

export const LIFECYCLE_STAGES = [
  "screening",
  "not_eligible",
  "awaiting_consent",
  "consent_not_obtained",
  "awaiting_enrolment",
  "awaiting_baseline",
  "awaiting_randomization",
  "randomized_control",
  "randomized_intervention",
  "day_15_pending",
  "day_15_completed",
  "study_completed",
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  screening: "Screening",
  not_eligible: "Not Eligible",
  awaiting_consent: "Eligible / Awaiting Consent",
  consent_not_obtained: "Consent Not Obtained",
  awaiting_enrolment: "Consent Obtained / Awaiting Enrolment",
  awaiting_baseline: "Enrolled / Awaiting Baseline",
  awaiting_randomization: "Baseline Completed / Awaiting Randomisation",
  randomized_control: "Randomised — Control",
  randomized_intervention: "Randomised — Intervention",
  day_15_pending: "Day 15 Pending",
  day_15_completed: "Day 15 Completed / Day 30 Pending",
  study_completed: "Study Completed",
};

export const ELIGIBILITY_STATUSES = ["pending", "eligible", "not_eligible"] as const;
export type EligibilityStatus = (typeof ELIGIBILITY_STATUSES)[number];
export const ELIGIBILITY_LABELS: Record<EligibilityStatus, string> = {
  pending: "Pending",
  eligible: "Eligible",
  not_eligible: "Not Eligible",
};

export const CONSENT_STATUSES = ["pending", "obtained", "not_obtained"] as const;
export type ConsentStatus = (typeof CONSENT_STATUSES)[number];
export const CONSENT_LABELS: Record<ConsentStatus, string> = {
  pending: "Pending",
  obtained: "Obtained",
  not_obtained: "Not Obtained",
};

/** Ordered journey shown on the participant profile. */
export const JOURNEY_STEPS = [
  "screening",
  "consent",
  "enrolment",
  "baseline",
  "randomization",
  "day_15",
  "day_30",
] as const;
export type JourneyStep = (typeof JOURNEY_STEPS)[number];

export const JOURNEY_LABELS: Record<JourneyStep, string> = {
  screening: "Screening",
  consent: "Consent",
  enrolment: "Enrolment",
  baseline: "Baseline",
  randomization: "Randomisation",
  day_15: "Day 15",
  day_30: "Day 30",
};

export type LifecycleRecord = {
  lifecycleStage: LifecycleStage;
  eligibilityStatus: EligibilityStatus;
  consentStatus: ConsentStatus;
  consentConfirmed: boolean;
  enrolmentConfirmed: boolean;
  enrolledAt: string | null;
  baselineCompletedAt: string | null;
  randomizedAt: string | null;
  studyGroup: "control" | "intervention" | null;
  day15OpenedAt: string | null;
  day15CompletedAt: string | null;
  day30CompletedAt: string | null;
};

export type LifecycleAction =
  | "screening"
  | "consent"
  | "enrolment"
  | "baseline"
  | "randomization"
  | "day_15_open"
  | "day_15"
  | "day_30";

export const ACTION_LABELS: Record<LifecycleAction, string> = {
  screening: "Record screening",
  consent: "Record consent",
  enrolment: "Confirm enrolment",
  baseline: "Complete baseline",
  randomization: "Randomise participant",
  day_15_open: "Open Day 15 follow-up",
  day_15: "Complete Day 15",
  day_30: "Complete Day 30",
};

export type Gate = { allowed: boolean; reason?: string };

const ok: Gate = { allowed: true };
const no = (reason: string): Gate => ({ allowed: false, reason });

/**
 * Single source of truth for "may this action run now, and if not, why?".
 */
export function canPerform(record: LifecycleRecord, action: LifecycleAction): Gate {
  const eligible = record.eligibilityStatus === "eligible";
  const consented = record.consentStatus === "obtained";
  const enrolled = record.enrolmentConfirmed;
  const baselineDone = Boolean(record.baselineCompletedAt);
  const randomised = Boolean(record.randomizedAt);
  const day15Done = Boolean(record.day15CompletedAt);

  switch (action) {
    case "screening":
      if (randomised) return no("Screening is locked once the participant is randomised.");
      if (record.consentStatus !== "pending")
        return no("Screening is locked once a consent outcome has been recorded.");
      return ok;
    case "consent":
      if (!eligible)
        return no("Consent can only be recorded once screening confirms the participant is eligible.");
      if (enrolled) return no("Consent is locked once the participant is enrolled.");
      return ok;
    case "enrolment":
      if (enrolled) return no("This participant is already enrolled.");
      if (record.eligibilityStatus === "pending")
        return no("Enrollment blocked: eligibility has not been confirmed yet.");
      if (!eligible) return no("Enrollment blocked: participant is not eligible.");
      if (record.consentStatus === "not_obtained")
        return no("Enrollment blocked: informed consent was not obtained.");
      if (!consented) return no("Enrollment blocked: informed consent has not been obtained.");
      if (!record.consentConfirmed)
        return no("Enrollment blocked: consent confirmation is required.");
      return ok;
    case "baseline":
      if (!enrolled) return no("Baseline can only be completed after the participant is enrolled.");
      return ok;
    case "randomization":
      if (!enrolled) return no("Randomisation requires an enrolled participant.");
      if (!baselineDone) return no("Randomisation is blocked until the baseline visit is completed.");
      if (randomised) return no("This participant already has a permanent group allocation.");
      return ok;
    case "day_15_open":
      if (!randomised) return no("Day 15 follow-up begins only after randomisation.");
      if (record.day15OpenedAt) return no("Day 15 follow-up is already open.");
      return ok;
    case "day_15":
      if (!randomised) return no("Day 15 follow-up begins only after randomisation.");
      if (!record.day15OpenedAt) return no("Open the Day 15 follow-up before recording its completion.");
      if (day15Done) return no("Day 15 has already been recorded.");
      return ok;
    case "day_30":
      if (!randomised) return no("Follow-up begins only after randomisation.");
      if (!day15Done) return no("Day 30 cannot be recorded before Day 15 is completed.");
      if (record.day30CompletedAt) return no("Day 30 has already been recorded.");
      return ok;
    default:
      return no("Unknown action.");
  }
}

/** Derives the explicit lifecycle status from the recorded milestones. */
export function deriveStage(record: Omit<LifecycleRecord, "lifecycleStage">): LifecycleStage {
  if (record.eligibilityStatus === "not_eligible") return "not_eligible";
  if (record.eligibilityStatus !== "eligible") return "screening";
  if (record.consentStatus === "not_obtained") return "consent_not_obtained";
  if (record.consentStatus !== "obtained") return "awaiting_consent";
  if (!record.enrolmentConfirmed) return "awaiting_enrolment";
  if (!record.baselineCompletedAt) return "awaiting_baseline";
  if (!record.randomizedAt) return "awaiting_randomization";
  if (record.day30CompletedAt) return "study_completed";
  if (record.day15CompletedAt) return "day_15_completed";
  if (record.day15OpenedAt) return "day_15_pending";
  return record.studyGroup === "control" ? "randomized_control" : "randomized_intervention";
}

/** Journey completion used by the profile stepper and progress bar. */
export function journeyState(record: LifecycleRecord): Record<JourneyStep, boolean> {
  return {
    screening: record.eligibilityStatus !== "pending",
    consent: record.consentStatus === "obtained",
    enrolment: record.enrolmentConfirmed,
    baseline: Boolean(record.baselineCompletedAt),
    randomization: Boolean(record.randomizedAt),
    day_15: Boolean(record.day15CompletedAt),
    day_30: Boolean(record.day30CompletedAt),
  };
}

export function progressPercent(record: LifecycleRecord): number {
  const state = journeyState(record);
  const done = JOURNEY_STEPS.filter((step) => state[step]).length;
  return Math.round((done / JOURNEY_STEPS.length) * 100);
}

/** The next action a researcher should take, used by the "Continue" button. */
export function nextAction(record: LifecycleRecord): LifecycleAction | null {
  const state = journeyState(record);
  if (record.eligibilityStatus === "not_eligible") return null;
  if (!state.screening) return "screening";
  if (!state.consent) return "consent";
  if (!state.enrolment) return "enrolment";
  if (!state.baseline) return "baseline";
  if (!state.randomization) return "randomization";
  if (!record.day15OpenedAt) return "day_15_open";
  if (!state.day_15) return "day_15";
  if (!state.day_30) return "day_30";
  return null;
}

type VisitFlags = {
  enrolmentConfirmed?: boolean | null;
  baselineCompletedAt?: string | null;
  randomizedAt?: string | null;
  day15OpenedAt?: string | null;
  day15CompletedAt?: string | null;
  day30CompletedAt?: string | null;
};
export type StudyVisit = "baseline" | "day_15" | "day_30";

/** Mirrors the database's study_visit_available(): is this visit open for documentation now? */
export function isVisitOpen(p: VisitFlags, visit: StudyVisit): boolean {
  if (visit === "baseline") return Boolean(p.enrolmentConfirmed) && !p.baselineCompletedAt;
  if (visit === "day_15") return Boolean(p.randomizedAt && p.day15OpenedAt) && !p.day15CompletedAt;
  return Boolean(p.day15CompletedAt) && !p.day30CompletedAt;
}

/** The single visit currently open for documentation, or null when none is. */
export function openDocumentationVisit(p: VisitFlags): StudyVisit | null {
  return (["baseline", "day_15", "day_30"] as const).find((v) => isVisitOpen(p, v)) ?? null;
}

/** Plain explanation of why no visit is open, with the next permitted step. */
export function noOpenVisitReason(p: VisitFlags): string {
  if (!p.enrolmentConfirmed) return "Enrol the participant before recording study data.";
  if (p.day30CompletedAt) return "All study visits are complete, so no new records can be added. Saved records stay readable below.";
  if (!p.randomizedAt) return "Baseline is complete and closed. Randomise the participant and open the Day 15 follow-up to record new entries for that visit.";
  if (!p.day15OpenedAt) return "Baseline is complete and closed. Open the Day 15 follow-up to record new entries for that visit.";
  return "No study visit is open for documentation right now.";
}
