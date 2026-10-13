/**
 * ============================================================
 * NEUROCARE CONNECT — STUDY TEAM PAGE CONTENT
 * ============================================================
 *
 * EDIT THIS FILE WHEN YOU WANT TO CHANGE:
 *
 * ✓ Student/researcher names
 * ✓ Roles
 * ✓ Departments
 * ✓ Institutions
 * ✓ Contributions
 * ✓ Institutional information
 * ✓ Project information
 * ✓ Project journey text
 * ✓ Acknowledgements
 * ✓ Public contact information
 *
 * IMPORTANT:
 * This is the main editable content file for the
 * Study Team / Contributors page (website address: /study-team).
 *
 * You normally should NOT need to edit the page components
 * just to change names or text.
 *
 * HOW TO EDIT:
 * - Change only the text between the quote marks "like this".
 * - Text in [square brackets] is a PLACEHOLDER. The page shows it with a
 *   "pending" style until you replace it with the real information.
 * - To hide an optional field, set it to null.
 * - Keep the commas at the end of each line.
 * ============================================================
 */

// Profile photos: put the image file in src/assets/ and import it here, e.g.
//   import priyaPhoto from "@/assets/priya.jpg";
// then set  image: priyaPhoto  on that person. Leave image: null for an avatar.

export type Person = {
  name: string;
  role: string;
  department: string;
  institution: string;
  contribution: string;
  /** Only fill in if real, approved credentials exist. */
  credentials?: string | null;
  image: string | null;
};

// ============================================================
// 1. PAGE / PROJECT INFORMATION
// ============================================================
export const pageInfo = {
  eyebrow: "NeuroCare Connect",
  title: "The people behind the study",
  intro:
    "NeuroCare Connect brings together research, clinical insight, academic guidance and technology to support a structured study of neuropathic pain and medication review.",
  aboutTitle: "About NeuroCare Connect",
  about:
    "NeuroCare Connect was developed to support the workflow of an associated Pharm.D research study involving neuropathic pain. The platform supports structured study data collection, medication review, documentation of drug-related problems (DRPs), intervention-related workflows and follow-up.",
  workflow: ["Screening", "Eligibility", "Consent", "Enrolment", "Baseline", "Randomisation", "Follow-up"],
  statementTitle: "A Pharm.D research project",
  statement:
    "NeuroCare Connect was developed as a digital platform supporting the structured workflow of an academic Pharm.D research project in neuropathic pain. It brings together pharmacy research, clinical assessment, medication review, structured follow-up and digital data collection. The platform itself does not provide treatment.",
};

// ============================================================
// 2. PEOPLE — STUDY TEAM
// ============================================================
//
// There are TWO student researchers who worked on this project.
// Edit each person's details below. The page shows every entry
// automatically: copy a { ... } block to add someone, delete one to remove.
// ============================================================
export const studyTeam: Person[] = [
  // ============================================================
  // STUDENT RESEARCHER 1 — EDIT DETAILS HERE
  // ============================================================
  {
    name: "SARHA SHAIKH",
    role: "Pharm.D Student",
    department: "DEPARTMENT OF PHARMACY PRACTICE",
    institution: "KLE COLLEGE OF PHARMACY, BELAGAVI",
    contribution: "Doctor of Pharmacy (Pharm.D)",
    credentials: null,
    image: null,
  },
  // ============================================================
  // STUDENT RESEARCHER 2 — EDIT DETAILS HERE
  // ============================================================
  {
    name: "ASHMITA S",
    role: "Pharm.D Student",
    department: "DEPARTMENT OF PHARMACY PRACTICE",
    institution: "KLE COLLEGE OF PHARMACY, BELAGAVI",
    contribution: "Doctor of Pharmacy (Pharm.D)",
    credentials: null,
    image: null,
  },
];

// ============================================================
// 4. CONTRIBUTIONS
// ============================================================
// Areas of work involved in the project. "people" lists who did it —
// only add a name when that contribution is actually known.
export const contributions: { area: string; items: string[]; people: string[] }[] = [
  {
    area: "Research & Study Design",
    items: ["Study workflow planning", "Research methodology", "Study documentation", "Eligibility / screening workflow"],
    people: [],
  },
  {
    area: "Clinical & Pharmacy Research",
    items: ["Medication-review workflow", "DRP documentation", "PCNE classification workflow", "Intervention-related workflow"],
    people: [],
  },
  {
    area: "Data Collection & Follow-Up",
    items: ["Baseline assessments", "Follow-up assessments", "NRS, DN4 and NePIQoL", "Participant study workflow"],
    people: [],
  },
  {
    area: "Technology & Platform Development",
    items: ["Web application architecture", "Research portal and participant management", "Database integration", "Dashboard, analytics and export/reporting"],
    people: [],
  },
  {
    area: "Quality & Documentation",
    items: ["Testing", "Data validation", "Documentation", "Research reporting"],
    people: [],
  },
];

// How the parts of the project fit together (shown as a simple flow).
export const collaborationFlow = [
  "Research Question",
  "Study Methodology",
  "Clinical / Pharmacy Workflow",
  "Digital Platform",
  "Data Collection",
  "Follow-up & Analysis",
];

// ============================================================
// 5. INSTITUTIONAL INFORMATION
// ============================================================
// Logos are set in src/config/branding.ts (used across the whole site).
export const institution = {
  collegeName: "KLE College of Pharmacy, Belagavi",
  universityName: "KLE Academy of Higher Education and Research (KAHER)",
  department: "DEPARTMENT OF PHARMACY PRACTICE",
  programme: "Pharm.D",
  address: "BASAVAN KUDACHI, BELAGAVI 591124",
  email: "info@kledeemeduniversity.edu.in",
  phone: "+91-9740639702 / +91-831-2471399",
};

// ============================================================
// 6. PROJECT JOURNEY
// ============================================================
// Numbered stages. Do not add dates unless they are real.
export const projectJourney = [
  { title: "Research Planning", text: "Study requirements and research workflow defined." },
  { title: "Study Workflow Design", text: "Screening, eligibility, consent, enrolment, baseline and randomisation workflows structured." },
  { title: "Platform Development", text: "Research and patient-facing components developed." },
  { title: "Validation & Testing", text: "Workflows, data handling and interface behaviour reviewed." },
  { title: "Research Use", text: "Platform prepared to support the study workflow." },
];

// ============================================================
// 7. PROJECT AT A GLANCE
// ============================================================
// Delete a line to hide that field.
export const projectAtAGlance = [
  { label: "Project", value: "NeuroCare Connect" },
  { label: "Research area", value: "Neuropathic pain" },
  { label: "Programme", value: "Pharm.D" },
  { label: "Project type", value: "Academic clinical research" },
  { label: "Platform", value: "Web-based research & study management platform" },
  { label: "Study workflow", value: "Screening → Follow-up" },
];

// ============================================================
// 8. ACKNOWLEDGEMENTS
// ============================================================
export const acknowledgements = {
  intro:
    "NeuroCare Connect is developed as part of an academic PharmD research project focused on the structured evaluation of medication-related problems and clinical follow-up in patients with neuropathic pain. NeuroCare Connect is an academic PharmD research initiative designed to optimize neuropathic pain management through the structured evaluation of medication-related problems and systematic clinical follow-up.",
  entries: [
    { group: "Department", names: "DEPARTMENT OF PHARMACY PRACTICE" },
    { group: "Institution", names: "KLE ACADEMY OF HIGHER EDUCATION AND RESEARCH (KAHER)" },
    { group: "Medical Research Centre", names: "KLE'S DR. PRABHAKAR KORE HOSPITAL & MEDICAL RESEARCH CENTRE, BELAGAVI" },
    { group: "Study Duration", names: "01 Sep 2026 - 31 Aug 2027" },
    { group: "Protocol Codes", names: "10" },
    { group: "Reviewed By", names: "KLECOPBGM ETHICS COMMITTEE" },
  ],
};

// ============================================================
// 9. CONTACT / EXTERNAL LINKS
// ============================================================
// Only add real, approved links. Leave the list empty to hide this.
export const externalLinks: { label: string; url: string }[] = [
  // { label: "Department website", url: "https://..." },
];

// ============================================================
// 10. HERO DETAILS, SECTION HEADINGS & CLOSING
// ============================================================
export const heroDetails = {
  context: "Study Team & Contributors",
  facts: ["Pharm.D research project", "Neuropathic pain", "Screening → Follow-up"],
  // Subtle labels near the larger nodes of the hero network.
  networkLabels: ["Research", "Clinical / Pharmacy", "Technology", "Data", "Follow-up"],
};

export const sectionText = {
  team: { eyebrow: "People", title: "Study Team" },
  work: {
    eyebrow: "The work",
    title: "Contributions",
    intro: "The areas of work that came together to build and run the project.",
    centre: "NeuroCare Connect",
  },
  collaboration: { eyebrow: "Collaboration", title: "How we worked together" },
  institution: { eyebrow: "Institution", title: "Institutional Support" },
  statement: { eyebrow: "Research context" },
  journey: { eyebrow: "Timeline", title: "Project Journey" },
  acknowledgements: { eyebrow: "ACKNOWLEDGEMENT", title: "Research Aim" },
  glance: {
    title: "Project at a glance",
    statement: "A patient-education and clinical study data-collection platform for neuropathic pain.",
  },
};

export const closing = {
  statement: "An academic research platform, built to support a structured study workflow.",
  items: [
    { label: "© 2026 NeuroCare Connect", value: "kifayatsayed@dev.in" },
    { label: "Queries & website issues", value: "sayedkifayat55@gmail.com" },
  ],
};
