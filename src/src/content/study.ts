/**
 * ============================================================
 * NEUROCARE CONNECT — STUDY PAGE CONTENT
 * ============================================================
 *
 * EDIT THIS FILE TO UPDATE THE PUBLIC STUDY PAGE CONTENT.
 *
 * Use Ctrl + F to find:
 * - HERO
 * - STUDY OVERVIEW
 * - PARTICIPANT JOURNEY
 * - ASSESSMENTS
 * - STUDY GROUPS
 * - STUDY VISITS
 * - MEDICATION REVIEW
 * - EDUCATION
 * - FAQ
 * - CONTACT
 *
 * The page components should handle presentation.
 * This file should contain the editable content.
 * ============================================================
 */

/* ---------- HERO ---------- */

export const hero = {
  eyebrow: "NeuroCare Connect",
  titleA: "Understanding neuropathic pain.",
  titleB: "Understanding your care.",
  intro:
    "NeuroCare Connect combines patient education with a clinical research study involving people living with neuropathic pain. Here you can find out what the study involves and what participation looks like.",
  primaryCta: "Explore the Study Journey",
  secondaryCta: "Patient Area",
  tertiaryCta: "Study Team",
  orbitLabels: ["Screening", "Assessment", "Medication Review", "Follow-up"],
};

/* ---------- STUDY OVERVIEW ---------- */

export const glance = {
  eyebrow: "Overview",
  title: "The study at a glance",
  pillars: [
    { label: "Study focus", value: "Neuropathic pain" },
    { label: "Core process", value: "Medication review and structured follow-up" },
    { label: "Assessments", value: "NRS · DN4 · NePIQoL" },
    { label: "Study pathways", value: "Control · Intervention" },
    { label: "Follow-up", value: "Baseline · Day 15 · Day 30" },
  ],
};

export const about = {
  eyebrow: "The study",
  title: "What is the study about?",
  statement:
    "The study looks at how medicines are reviewed for people with neuropathic pain, how possible drug-related problems are identified, and what happens over the following weeks.",
  flow: ["Medicines", "Medication Review", "Drug-Related Problems", "Research Follow-up"],
};

export const concepts = [
  {
    title: "Medication Review",
    text: "Your medicines are recorded and reviewed in a structured way, and possible drug-related problems are identified.",
  },
  {
    title: "Pharmacist Intervention",
    text: "Where applicable, this may include pharmacist actions, communication with your physician, and counselling about your medicines.",
  },
  {
    title: "Follow-up",
    text: "Assessments are repeated at follow-up visits so the research team can see how things change over the study period.",
  },
];

/* ---------- PARTICIPANT JOURNEY ---------- */

export const journeySection = {
  eyebrow: "Participant journey",
  title: "What happens if I participate?",
  intro:
    "Every participant follows the same sequence. Randomisation happens only after screening, eligibility, informed consent, enrolment and the baseline assessment.",
  randomisationNote:
    "Participants do not choose their study group. The group is assigned by the study's computerised randomisation process.",
  progressConcept: ["Screening", "Baseline", "Randomisation", "Day 15", "Day 30"],
};

export const journeyStages = [
  { n: "01", t: "Screening" },
  { n: "02", t: "Eligibility" },
  { n: "03", t: "Informed Consent" },
  { n: "04", t: "Enrolment" },
  { n: "05", t: "Baseline Assessment" },
  { n: "06", t: "Computerised Randomisation" },
  { n: "07", t: "Study Group" },
  { n: "08", t: "Day 15 Follow-up" },
  { n: "09", t: "Day 30 Follow-up" },
];

/* ---------- ASSESSMENTS ---------- */

export const assessmentsSection = {
  eyebrow: "Assessments",
  title: "What will be assessed?",
};

export const assessments = [
  { t: "NRS", d: "A simple scale used to record how strong your pain feels.", kind: "scale" as const },
  { t: "DN4", d: "A short questionnaire about neuropathic pain-related features, used within the study.", kind: "document" as const },
  { t: "NePIQoL", d: "A questionnaire about how neuropathic pain affects everyday life and quality of life.", kind: "life" as const },
  { t: "Medication Review", d: "A structured record and review of the medicines you use.", kind: "review" as const },
  { t: "Drug-Related Problems", d: "Identifying possible problems with medicines and classifying them using the PCNE system.", kind: "network" as const },
];

/* ---------- STUDY GROUPS ---------- */

export const groupsSection = {
  eyebrow: "Study groups",
  title: "What is the difference between the study groups?",
  randomisation: "Computerised Randomisation",
  assignmentNote:
    "Participants are assigned to a study group through the study's computerised randomisation process.",
  control: {
    label: "Control",
    text: "Participants in the control group take part in the assessments and follow-up visits required by the study.",
  },
  intervention: {
    label: "Intervention",
    text: "The same assessments and follow-up, and additionally:",
    items: [
      "Pharmacist-led medication review",
      "Identification of drug-related problems",
      "Intervention activities",
      "Physician communication where applicable",
      "Patient counselling",
    ],
  },
};

/* ---------- STUDY VISITS ---------- */

export const visitsSection = {
  eyebrow: "Study visits",
  title: "What happens at Baseline, Day 15 and Day 30?",
  intro: "Study assessments are recorded at each defined study visit.",
};

export const visits = [
  {
    t: "Baseline",
    d: "The starting point. Assessments including NRS and NePIQoL are recorded as applicable, together with the medication review.",
  },
  {
    t: "Day 15",
    d: "Assessments such as NRS and NePIQoL are recorded again as applicable, and medication-related problems are followed up.",
  },
  {
    t: "Day 30",
    d: "Final study visit. Assessments are recorded as applicable and medication-related problems continue to be followed.",
  },
];

export const changeOverTime = {
  eyebrow: "Change over time",
  title: "Why are follow-ups important?",
  text: "Repeating the same assessments at each visit allows the research team to examine changes in patient-reported outcomes and medication-related problems over the study period.",
};

/* ---------- MEDICATION REVIEW ---------- */

export const medicationReview = {
  eyebrow: "Medication review",
  title: "What is medication review, and what are drug-related problems?",
  explanation:
    "A drug-related problem is an event or circumstance involving medicines that may affect health outcomes. This is how they are handled within the research workflow.",
  pcneLabel: "PCNE-based Classification",
  pcneNote:
    "Identified drug-related problems are classified using the PCNE system within the study workflow.",
  flow: [
    "Medicines",
    "Medication Review",
    "Identify Drug-Related Problem",
    "PCNE-based Classification",
    "Intervention / Physician Communication where applicable",
    "Follow-up",
  ],
};

/* ---------- EDUCATION ---------- */

export const education = {
  eyebrow: "Patient education",
  title: "Understanding the condition matters too.",
  text: "Neuropathic pain is pain that comes from a problem with the nerves themselves. Our educational section explains it in simple language.",
  preparationTitle: "Neuropathic pain education",
  preparationText: "Approved educational content is being prepared.",
  preparationDetail:
    "Detailed educational pages are being prepared and will be linked here once the approved content is available.",
  patientAreaCta: "Patient Area",
};

export const safetyNotice = {
  title: "Educational information",
  items: [
    "The information on this website is educational.",
    "It does not replace professional medical advice.",
    "Please discuss symptoms and medicine concerns with an appropriate healthcare professional.",
    "Do not change prescribed medicines based on information from this website.",
  ],
};

export const privacy = {
  title: "How participant information is handled",
  text: "Research information is kept in a controlled research system. Access is restricted to authorised members of the study team according to the system's access controls.",
  flow: ["Participant Information", "Controlled Research System", "Authorised Study Team"],
  statusTitle: "Privacy information",
  statusText:
    "Detailed participant privacy information will be provided here once the approved content is available.",
};

/* ---------- FAQ ---------- */

export const faqSection = {
  eyebrow: "FAQ",
  title: "Frequently asked questions",
};

export const faqs: [string, string][] = [
  ["What is NeuroCare Connect?", "NeuroCare Connect brings together patient education about neuropathic pain and a clinical research study carried out by the study team."],
  ["What is the study about?", "The study looks at medication review, the identification of drug-related problems, and related pharmacist activities in people with neuropathic pain, with follow-up assessments over time."],
  ["What happens before I enter the study?", "Before entering the study, people go through screening, an eligibility check and informed consent. Enrolment and a baseline assessment follow."],
  ["What is randomisation?", "Randomisation is a process in which a computer assigns each participant to a study group. It happens only after screening, eligibility, informed consent, enrolment and the baseline assessment."],
  ["Can I choose my study group?", "No. Participants are assigned to a study group through the study's computerised randomisation process. Neither participants nor the study team choose the group."],
  ["What happens at Day 15?", "At the Day 15 visit, study assessments such as NRS and NePIQoL are recorded as applicable to the study workflow, and medication-related problems continue to be followed."],
  ["What happens at Day 30?", "At the Day 30 visit, study assessments are recorded again as applicable, and medication-related problems continue to be followed through the research workflow."],
  ["What is medication review?", "Medication review is a structured look at the medicines a person is using, recorded as part of the study."],
  ["What is a drug-related problem?", "A drug-related problem is an event or circumstance involving medicines that may affect a person's health outcomes. In this study these are classified using the PCNE system."],
  ["Who should I contact if I have a medical question?", "Please speak to your doctor, pharmacist or another appropriate healthcare professional. This website cannot answer individual medical questions."],
];

/* ---------- CONTACT / CTA ---------- */

export const finalCta = {
  title: "Continue exploring NeuroCare Connect.",
  text: "Learn more about the study, explore available patient resources, or meet the people behind the project.",
  actions: [
    { label: "Explore Neuropathic Pain Education", anchor: "#education" },
    { label: "Access Patient Area", to: "/patient" as const },
    { label: "Study Team", to: "/study-team" as const },
  ],
  contactTitle: "© 2026 NEUROCARE CONNECT | A STUDY LED BY",
  contactText: "SARHA SHAIKH\u00a0 &\u00a0\u00a0ASHMITA S",
};

/* ---------- SCROLL PROGRESS RAIL ---------- */

export const progressRail = [
  { id: "study", label: "Study" },
  { id: "journey", label: "Journey" },
  { id: "assessments", label: "Assessments" },
  { id: "groups", label: "Groups" },
  { id: "visits", label: "Visits" },
  { id: "medication-review", label: "Medication Review" },
  { id: "education", label: "Education" },
  { id: "faq", label: "FAQ" },
];
