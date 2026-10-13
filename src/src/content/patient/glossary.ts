// ============================================================
// GLOSSARY — health terms, explained simply
// ============================================================
// `text` = what the term means in healthcare; `inStudy` = how the study uses
// it (only where applicable); `related` = library article slugs.
export const glossaryTitle = "Health terms, explained simply";

export type GlossaryTerm = { term: string; text: string; inStudy?: string; related?: string[] };

export const glossary: GlossaryTerm[] = [
  {
    term: "Neuropathic pain",
    text: "Pain caused by damage or disease affecting the parts of the nervous system that carry feelings such as touch and pain — in short, pain that comes from a problem with the nerves themselves.",
    related: ["what-is-neuropathic-pain", "how-nerve-pain-can-feel"],
  },
  {
    term: "Medication review",
    text: "A structured look, usually with a doctor or pharmacist, at all the medicines a person uses — to check they are still needed, working and not causing problems.",
    inStudy: "Medication reviews are carried out and recorded as part of the study workflow.",
    related: ["medicine-reviews"],
  },
  {
    term: "Drug-related problem (DRP)",
    text: "An event or circumstance involving medicines that actually or potentially gets in the way of the health outcome a person and their healthcare team are aiming for.",
    inStudy: "In this study, drug-related problems are classified using the PCNE (Pharmaceutical Care Network Europe) system, version 9.1.",
    related: ["medicine-reviews", "side-effects-and-interactions"],
  },
  {
    term: "NRS",
    text: "Numerical rating scale — a simple scale on which a person rates how strong their pain is, usually from 0 (no pain) to 10 (worst pain imaginable).",
    inStudy: "Pain intensity is recorded with the NRS at study visits.",
    related: ["describing-your-symptoms"],
  },
  {
    term: "DN4",
    text: "A short questionnaire and examination used by healthcare professionals to help assess whether pain has neuropathic features. It is a screening aid, not a diagnosis on its own.",
    inStudy: "DN4 is completed by the research team as part of study screening and assessment. It is not offered here as a self-test.",
    related: ["how-assessment-works"],
  },
  {
    term: "NePIQoL",
    text: "A questionnaire about how neuropathic pain affects everyday life and quality of life.",
    inStudy: "NePIQoL is completed at study visits to see how quality of life changes over the study period.",
    related: ["nerve-pain-and-daily-life"],
  },
  {
    term: "Follow-up",
    text: "A later check-up to see how symptoms, treatment and wellbeing have changed since the last visit.",
    inStudy: "Study assessments are repeated at the Day 15 and Day 30 follow-up visits.",
    related: ["how-assessment-works"],
  },
];

export const termId = (term: string) => term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
