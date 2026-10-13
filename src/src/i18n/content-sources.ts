// Every long-form patient content source that is localised through the
// English-keyed catalogues. Components localise these with useLocalized().
import { articles, checklist, faqs, leaflets, learningChecks, libraryGlossary, libraryIntro, librarySections, seekHelp } from "@/content/patient/library";
import { glossary, glossaryTitle } from "@/content/patient/glossary";
import * as education from "@/content/patient/education";
import { journeyStages } from "@/content/study";
import { chatText, knowledgeBase } from "@/content/patient/chat";
import { catalogue } from "@/lib/medicine-catalogue";

export const patientContentSources = {
  articles, checklist, faqs, leaflets, learningChecks, libraryGlossary, libraryIntro, librarySections, seekHelp,
  journeyStages: journeyStages.map((j) => j.t), chat: { chatText, knowledgeBase }, glossary, glossaryTitle, education: { ...education },
  catalogue: catalogue ? { categoryNames: catalogue.categories.map((c) => c.name), categories: catalogue.categories, medicines: catalogue.medicines, meta: { title: catalogue.catalogueMetadata.title, description: catalogue.catalogueMetadata.description, medicalDisclaimer: catalogue.catalogueMetadata.medicalDisclaimer } } : null,
};
