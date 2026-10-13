// ============================================================
// CHATBOT KNOWLEDGE BASE — Ask NeuroCare (local, no AI, no network)
// ============================================================
// Every answer is existing approved/source-backed wording from the library.
// `alsoAsked` are extra English phrasings (translated like other content) used
// for exact-question matching. Matching synonyms in every language live in
// src/lib/education/synonyms.ts.
import { checklist, seekHelp } from "@/content/patient/library";
import type { Target } from "@/lib/education/targets";

export type KnowledgeEntry = {
  id: string;
  question: string;
  alsoAsked?: string[];
  keywords: string[];
  answer: string;
  related?: string[];
  /** Main page with the full explanation. */
  target?: Target;
  /** Further resources shown as cards under the answer. */
  resources?: Target[];
};

export const chatText = {
  title: "Ask NeuroCare",
  intro: "Find answers in our patient education library.",
  welcome: "Ask a question, or choose one of the suggestions below. I can point you to articles, medicine information and pages on this website.",
  disclaimer: "Education only — not medical advice. Please don't share personal health details.",
  privacy:
    "Ask NeuroCare searches the educational content available on this website. It is not a doctor and cannot diagnose conditions or recommend individual treatment. Your chat is processed in this browser and is not saved as conversation history.",
  placeholder: "Type a question…",
  send: "Send question",
  clear: "Clear conversation",
  close: "Close Ask NeuroCare",
  suggestionsTitle: "Suggested questions",
  followUpTitle: "You might also ask",
  resultsIntro: "These pages look most relevant to your question:",
  bestMatchIntro: "This page looks like the best match:",
  readFullGuide: "Read the full guide:",
  open: "Open",
  typeLabels: { article: "Article", medicine: "Medicine", faq: "Question and answer", glossary: "Glossary", webpage: "Page", study: "Study information" },
  englishOnly: "Not yet translated — shown in English",
  translationDraft: "Translated answers are drafts awaiting language and clinical review.",
  suggestions: ["neuropathic-pain", "medication-review", "appointment", "medicines", "seek-help", "study"],
  fallback:
    "I couldn't find a reliable answer to that question in the NeuroCare Connect education library. You can try different words, browse the suggested topics below, or contact your doctor or pharmacist for personal medical advice.",
  tryAgain: "Try different words",
  browseAll: "Browse all articles",
  browseTopics: "Browse topics",
  professionalReminder: "For questions about your own health or treatment, please speak with your doctor or pharmacist.",
  safety:
    "I can't give advice about starting, stopping or changing medicines, doses or treatment, and I can't diagnose. Please speak with your doctor, pharmacist or another appropriate healthcare professional.",
  medicineIntro: "General educational information about this medicine is in the medicine catalogue:",
  emergencyTitle: "This could need emergency care — do not delay",
  emergencyLimit: "Ask NeuroCare only recognises some warning phrases. It cannot detect every emergency or tell you whether you are safe.",
  helpPageLabel: "When to seek medical help",
  emergencyPanelText: seekHelp.emergencyPanel.text,
};

export const knowledgeBase: KnowledgeEntry[] = [
  {
    id: "neuropathic-pain",
    question: "What is neuropathic pain?",
    alsoAsked: ["What is nerve pain?"],
    keywords: ["neuropathic", "neuropathy", "nerve pain", "nerve", "neuropathic pain mean"],
    answer: "Neuropathic pain is pain that comes from a problem with the nerves themselves.",
    related: ["study", "medication-review"],
    target: { kind: "article", slug: "what-is-neuropathic-pain" },
    resources: [{ kind: "article", slug: "how-nerve-pain-can-feel" }],
  },
  {
    id: "medication-review",
    question: "What is a medication review?",
    alsoAsked: ["What does medication review mean?"],
    keywords: ["medication review", "medicine review", "review", "reviewed"],
    answer: "Medication review is a structured look at the medicines a person is using, recorded as part of the study.",
    related: ["drp", "study"],
    target: { kind: "article", slug: "medicine-reviews" },
  },
  {
    id: "drp",
    question: "What is a DRP?",
    alsoAsked: ["What is a drug-related problem?"],
    keywords: ["drp", "drug related problem", "drug-related", "problem with medicine", "pcne"],
    answer:
      "A drug-related problem is an event or circumstance involving medicines that may affect a person's health outcomes. In this study these are classified using the PCNE system.",
    related: ["medication-review"],
    target: { kind: "page", to: "/patient/library/glossary", hash: "drug-related-problem-drp" },
  },
  {
    id: "study",
    question: "What is this study about?",
    alsoAsked: ["How does the study work?"],
    keywords: ["study", "research", "trial", "about the study"],
    answer:
      "The study looks at medication review, the identification of drug-related problems, and related pharmacist activities in people with neuropathic pain, with follow-up assessments over time.",
    related: ["follow-up", "randomisation"],
    target: { kind: "page", to: "/study", hash: "journey" },
  },
  {
    id: "follow-up",
    question: "What does follow-up mean?",
    keywords: ["follow up", "follow-up", "followup", "day 15", "day 30", "visit"],
    answer:
      "Assessments are repeated at follow-up visits so the research team can see how things change over the study period.",
    related: ["study"],
    target: { kind: "page", to: "/study", hash: "visits" },
  },
  {
    id: "randomisation",
    question: "What is randomisation?",
    keywords: ["randomisation", "randomization", "random", "group", "choose my group"],
    answer:
      "Randomisation is a process in which a computer assigns each participant to a study group. Neither participants nor the study team choose the group.",
    related: ["study"],
    target: { kind: "page", to: "/study", hash: "groups" },
  },
  {
    id: "medicines",
    question: "What should I know about my medicines?",
    alsoAsked: ["Where can I find information about my medicines?"],
    keywords: ["my medicine", "my medicines", "medicines", "medicine", "ask my doctor", "side effect"],
    answer:
      "The “Your medicines” catalogue shares approved educational information. For questions about your own medicines, please speak with your doctor or pharmacist — the checklist under “Prepare” can help you get ready.",
    related: ["medication-review", "appointment"],
    target: { kind: "page", to: "/patient/medicines" },
    resources: [
      { kind: "article", slug: "medicine-reviews" },
      { kind: "article", slug: "questions-about-medicines" },
      { kind: "article", slug: "side-effects-and-interactions" },
    ],
  },
  {
    id: "assessments",
    question: "What are NRS, DN4 and NePIQoL?",
    keywords: ["nrs", "dn4", "nepiqol", "questionnaire", "scale", "assessment"],
    answer:
      "NRS is a simple scale used to record how strong your pain feels. DN4 is a short questionnaire about neuropathic pain-related features. NePIQoL is a questionnaire about how neuropathic pain affects everyday life and quality of life.",
    related: ["study"],
    target: { kind: "page", to: "/patient/library/glossary" },
  },
  {
    id: "appointment",
    question: "How do I prepare for an appointment?",
    alsoAsked: ["What should I bring to my appointment?"],
    keywords: ["appointment", "prepare", "bring"],
    answer: checklist.intro,
    related: ["medicines", "seek-help"],
    target: { kind: "article", slug: "appointment-preparation" },
    resources: [{ kind: "page", to: "/patient/library/checklist" }],
  },
  {
    id: "seek-help",
    question: "When should I seek medical help?",
    alsoAsked: ["When should I see a doctor?"],
    keywords: ["seek help", "emergency", "urgent"],
    answer: seekHelp.intro[0]!,
    related: ["appointment"],
    target: { kind: "page", to: "/patient/library/help" },
  },
];
