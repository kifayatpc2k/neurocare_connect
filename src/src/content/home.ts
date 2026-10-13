/**
 * ============================================================
 * NEUROCARE CONNECT — HOMEPAGE CONTENT
 * ============================================================
 *
 * Edit this file to update the public homepage text.
 *
 * Sections (use Ctrl+F): HERO CONTENT, PLATFORM INTRO, STUDY JOURNEY,
 * ASSESSMENTS, MEDICATION REVIEW, GROUPS, SECURITY, PRINCIPLES, CTA.
 *
 * Do not add study results, participant numbers, statistics,
 * testimonials or certifications here — only approved wording.
 * ============================================================
 */

// ============================================================
// HERO CONTENT
// ============================================================
export const hero = {
  eyebrow: "NeuroCare Connect",
  headingLine1: "Understanding neuropathic pain.",
  headingLine2: "Advancing the Science of Care.",
  text: "A structured digital platform connecting patient education with the workflow of an academic neuropathic pain research study.",
  primaryCta: "Explore the Study",
  secondaryCta: "Explore Patient Education",
  tertiaryLink: "Research Team Access",
  scrollHint: "Explore the platform",
  /** Research-workflow labels shown beside the neural visual (not biological processes). */
  workflowLabels: ["Assessment", "Medication review", "DRP identification", "Follow-up"],
  /** Short explanations revealed when a stage on the hero visual is selected. */
  workflowStages: [
    { label: "Assessment", description: "Structured questionnaires capture neuropathic pain features and quality of life." },
    { label: "Medication review", description: "Each participant's medicines are reviewed systematically by the study team." },
    { label: "DRP identification", description: "Drug-related problems are classified using a recognised framework." },
    { label: "Follow-up", description: "Repeat assessments at planned visits show how outcomes change over time." },
  ],
};

// ============================================================
// PLATFORM INTRO
// ============================================================
export const platform = {
  eyebrow: "The platform",
  heading: "One platform. Two carefully separated experiences.",
  text: "NeuroCare Connect brings together a patient-facing experience and a research-team workspace, while keeping their purposes and access clearly apart.",
  patient: {
    title: "Patient Education",
    tagline: "Learn. Understand. Participate.",
    traits: ["Friendly", "Simple", "Educational"],
    features: ["Education about neuropathic pain", "Information about the study", "Language selection"],
    cta: "Explore Patient Education",
  },
  research: {
    title: "Research Portal",
    tagline: "Record. Review. Follow up.",
    traits: ["Structured", "Professional", "Data-focused"],
    features: ["Participant study workflow", "Assessments and medication review", "Analytics and export for the study team"],
    cta: "Research Team Access",
  },
};

// ============================================================
// STUDY JOURNEY
// ============================================================
export const studyJourney = {
  eyebrow: "The study",
  heading: "A structured journey through the research process.",
  text: "Every participant follows the same defined sequence. Randomisation happens only after the required steps before it are complete.",
  stages: [
    { name: "Screening", note: "The first step in the study workflow." },
    { name: "Eligibility", note: "Eligibility is confirmed before going further." },
    { name: "Consent", note: "Informed consent is recorded before enrolment." },
    { name: "Enrolment", note: "The participant is enrolled in the study." },
    { name: "Baseline", note: "Baseline assessments are recorded." },
    { name: "Randomisation", note: "A computerised process assigns the study group." },
    { name: "Study group", note: "The participant continues in the assigned group." },
    { name: "Day 15", note: "Follow-up assessments are recorded." },
    { name: "Day 30", note: "Final follow-up assessments are recorded." },
  ],
};

// ============================================================
// ASSESSMENTS
// ============================================================
export const assessments = {
  eyebrow: "What is assessed",
  heading: "Following the details that matter to the study.",
  capabilityLabel: "Platform capabilities",
  items: [
    { code: "NRS", label: "Pain assessment" },
    { code: "DN4", label: "Neuropathic pain assessment" },
    { code: "NePIQoL", label: "Quality-of-life assessment" },
    { code: "Medication Review", label: "Medication-related review" },
    { code: "DRP / PCNE", label: "Structured drug-related problem documentation" },
  ],
};

// ============================================================
// MEDICATION REVIEW
// ============================================================
export const medicationReview = {
  eyebrow: "Medication review",
  heading: "From medication review to structured follow-up.",
  text: "The research platform supports the study team in documenting each step. It is not an automated medical decision system.",
  steps: [
    "Medicines",
    "Medication review",
    "Identify drug-related problems",
    "PCNE classification",
    "Intervention / physician communication where applicable",
    "Follow-up",
  ],
};

// ============================================================
// GROUPS
// ============================================================
export const groups = {
  eyebrow: "Study pathways",
  heading: "Two study pathways. One structured research workflow.",
  note: "Participants are assigned to a group through the study's computerised randomisation process.",
  control: { title: "Control", steps: ["Baseline", "Medication review", "Assessments", "Day 15", "Day 30"] },
  intervention: {
    title: "Intervention",
    steps: [
      "Baseline",
      "Pharmacist-led medication review",
      "DRP identification",
      "Intervention",
      "Physician communication",
      "Patient counselling",
      "Day 15",
      "Day 30",
    ],
  },
};

// ============================================================
// SECURITY
// ============================================================
export const security = {
  eyebrow: "Separation",
  heading: "Built with separation in mind.",
  text: "NeuroCare Connect is designed so that the public patient experience and the restricted research workspace serve different purposes, with different access.",
  principles: [
    { title: "Separation", text: "Patient-facing and research-team experiences remain distinct." },
    { title: "Access control", text: "Restricted research functionality requires appropriate authentication and authorisation." },
    { title: "Protected study data", text: "Research-only records are not intended to be exposed through patient-facing pages." },
  ],
};

// ============================================================
// PRINCIPLES
// ============================================================
export const principles = {
  heading: "Designed around the research workflow.",
  items: [
    { title: "Structured", text: "Study stages follow a defined workflow." },
    { title: "Traceable", text: "Study records follow the participant journey." },
    { title: "Separated", text: "Patient and research experiences have different access boundaries." },
    { title: "Extensible", text: "The platform can evolve as approved study requirements develop." },
    { title: "Human-centred", text: "The patient-facing experience remains simple and approachable." },
  ],
};

// ============================================================
// CTA
// ============================================================
export const cta = {
  heading: "Explore NeuroCare Connect",
  text: "Learn about the study, explore patient-facing resources, or access the research workspace.",
  study: { title: "The Study", text: "What the study involves and what happens at each visit." },
  patient: { title: "Patient Education", text: "Patient-facing education and resources." },
  research: { title: "Research Portal", text: "Restricted workspace for the study team." },
  teamLink: "Meet the Study Team",
};
