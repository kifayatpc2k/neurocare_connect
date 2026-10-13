/**
 * PATIENT EDUCATION & SUPPORT — all page text for /patient lives here.
 *
 * Rules for editors:
 * - Only add wording that has been approved by the study team.
 * - Text wrapped in [square brackets] is shown on the page as a visible
 *   "pending" placeholder, so nothing unapproved looks like real guidance.
 * - Approved wording below is reused from the already-approved Study page.
 */

// ============================================================
// HERO
// ============================================================
export const hero = {
  eyebrow: "NeuroCare Connect",
  headingLines: [
    "Understand your condition.",
    "Understand your medicines.",
    "Feel more informed about your care.",
  ],
  text: "Simple, plain-language information about neuropathic pain, medicines, the study and questions you may want to discuss with a healthcare professional.",
  primaryCta: { label: "Explore patient education", anchor: "#learn" },
  secondaryCta: { label: "Understand your medicines", to: "/patient/medicines" as const },
  reassurance: "No account needed. Searches, ticks and questions stay on your device and are not sent or saved.",
};

// ============================================================
// "WHAT CAN I FIND HERE?" — main navigation of the patient area
// ============================================================
export const findHere = {
  title: "What can I find here?",
  items: [
    { key: "learn", label: "Learn", text: "Understand neuropathic pain.", to: "/patient/library" },
    { key: "medicines", label: "Medicines", text: "General information about 20 medicines.", to: "/patient/medicines" },
    { key: "ask", label: "Ask", text: "Ask NeuroCare about the education library.", to: null },
    { key: "prepare", label: "Prepare", text: "A printable appointment checklist.", to: "/patient/library/checklist" },
    { key: "study", label: "Study", text: "Understand how the research study works.", to: "/study" },
  ] as const,
};

// ============================================================
// NEUROPATHIC PAIN EDUCATION
// ============================================================
export const neuropathicPain = {
  number: "01",
  eyebrow: "Neuropathic pain",
  title: "Learn in plain language",
  intro:
    "Neuropathic pain is pain that comes from a problem with the nerves themselves. This section explains it in simple language.",
  topics: [
    { title: "What neuropathic pain means", text: "Pain caused by a problem affecting the nerves that carry feelings such as touch and pain.", slug: "what-is-neuropathic-pain" },
    { title: "Common features", text: "Burning, tingling, shooting pain, numbness or sensitivity to touch — symptoms vary from person to person.", slug: "how-nerve-pain-can-feel" },
    { title: "Why nerve-related pain can feel different", text: "Changed nerve signals can cause pain, reduced feeling, or both.", slug: "nerve-pain-vs-other-pain" },
    { title: "Living with neuropathic pain", text: "Possible effects on sleep, movement, daily activities and wellbeing.", slug: "nerve-pain-and-daily-life" },
    { title: "When to speak with a healthcare professional", text: "Where to turn and how quickly, depending on what is happening.", slug: null },
  ],
};

// ============================================================
// EDUCATION LIBRARY — categories with no articles are hidden
// ============================================================
export const featuredTopics: { title: string; summary: string; slug: string }[] = [
  { title: "Questions to ask about your medicines", summary: "Questions to bring when a medicine is offered or reviewed.", slug: "questions-about-medicines" },
  { title: "What is a medication review?", summary: "A structured look at all the medicines a person uses.", slug: "medicine-reviews" },
  { title: "Nerve pain after shingles", summary: "Long-lasting pain where a shingles rash was.", slug: "pain-after-shingles" },
  { title: "Diabetes and nerve problems", summary: "How high blood sugar over time can affect nerves.", slug: "diabetes-and-nerves" },
];

// ============================================================
// APPOINTMENT PREPARATION — kept only in the browser tab, never saved
// ============================================================
export const prepare = {
  title: "Questions to ask your healthcare professional",
  intro: "Tick the questions you would like to bring up. Your ticks disappear when you close this page — nothing is saved.",
  questions: [
    "What should I know about my medicine?",
    "What side effects should I ask about?",
    "What should I do if I have concerns about my medicine?",
    "Are there questions I should ask about my treatment?",
  ],
};

// ============================================================
// SAFETY / WHEN TO SEEK HELP
// ============================================================
export const help = {
  title: "When should I speak with a healthcare professional?",
  general:
    "This website cannot answer individual medical questions. Please speak to your doctor, pharmacist or another appropriate healthcare professional.",
  guidance: [] as string[],
};

// ============================================================
// STUDY EXPLAINER — links to /study rather than repeating it
// ============================================================
export const studyExplainer = {
  title: "About the study",
  text: "The study looks at how medicines are reviewed for people with neuropathic pain, how possible drug-related problems are identified, and what happens over the following weeks.",
  links: [
    { label: "What is the study?", hash: "about" },
    { label: "What happens during the study?", hash: "journey" },
    { label: "What are the study visits?", hash: "visits" },
    { label: "How does medication review fit into the study?", hash: "medication-review" },
  ],
};

export const privacy = {
  title: "Your privacy",
  text: "This area never asks for your name, contact details or health information, and it does not show any research records. Searches, checklist ticks, quiz answers and anything you type into Ask NeuroCare are handled only in this browser tab — they are not sent to a server or saved, and they disappear when you close or reload the page.",
};

export const medicineDisclaimer =
  "This information is for education only. It does not replace advice from your doctor, pharmacist or other qualified healthcare professional.";
