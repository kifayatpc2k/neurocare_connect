/**
 * Shared study-domain vocabulary.
 * These mirror the database enums (`study_group`, `study_milestone`,
 * `milestone_status`) so the UI and backend never drift apart.
 */

export const STUDY_GROUPS = ["control", "intervention"] as const;
export type StudyGroup = (typeof STUDY_GROUPS)[number];

export const STUDY_GROUP_LABELS: Record<StudyGroup, string> = {
  control: "Control",
  intervention: "Intervention",
};

export const STUDY_MILESTONES = ["baseline", "day_15", "day_30"] as const;
export type StudyMilestone = (typeof STUDY_MILESTONES)[number];

export const MILESTONE_LABELS: Record<StudyMilestone, string> = {
  baseline: "Baseline",
  day_15: "Day 15",
  day_30: "Day 30",
};

export const MILESTONE_STATUSES = ["pending", "in_progress", "completed"] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

export const PARTICIPANT_STATUSES = [
  "screening",
  "enrolled",
  "withdrawn",
  "completed",
] as const;
export type ParticipantStatus = (typeof PARTICIPANT_STATUSES)[number];

export type AppRole = "patient" | "researcher" | "admin";
export type AppPermission = "randomisation_override";

export const isResearchStaff = (roles: AppRole[]) =>
  roles.includes("researcher") || roles.includes("admin");

/** UI visibility only — the server and database enforce this independently. */
export const canOverrideAllocation = (account?: { roles: AppRole[]; permissions?: AppPermission[] } | null) =>
  Boolean(account && isResearchStaff(account.roles) && account.permissions?.includes("randomisation_override"));

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو" },
] as const;
