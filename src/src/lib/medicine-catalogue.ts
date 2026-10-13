// Typed access + runtime validation for the static medicine education catalogue.
// The data itself lives only in src/data/medicine-catalogue.json.
import raw from "@/data/medicine-catalogue.json";

export type MedicineCategory = { id: string; name: string; description: string; displayOrder: number };
export type SideEffect = { description: string; severity: string; action?: string };
export type SeekHelp = { symptom: string; urgency: string; action?: string };
export type InteractionCaution = { interactingSubstance: string; concern: string; recommendedAction?: string };
export type SourceReference = { title?: string; url?: string; organisation?: string; [k: string]: unknown };
export type CatalogueMedicine = {
  id: string;
  name: string;
  genericName: string;
  displayName: string;
  medicineGroup: string;
  categoryIds: string[];
  summary: string;
  whatIsItUsedFor: string[];
  howDoesItWork: string;
  whatShouldIKnowBeforeTakingIt: string[];
  possibleSideEffects: SideEffect[];
  whenToSeekMedicalHelp: SeekHelp[];
  safeUseReminders: string[];
  questionsToAskYourHealthcareProfessional: string[];
  monitoring: string[];
  interactionCautions: InteractionCaution[];
  formulations: string[];
  sourceReferences: SourceReference[];
  searchKeywords: string[];
  alternativeNames?: string[];
  contentReview: { clinicalReviewRequired: boolean; reviewStatus: string; reviewNotes: string[] };
};
export type Catalogue = {
  schemaVersion: string;
  catalogueMetadata: {
    title: string;
    description: string;
    medicalDisclaimer: string;
    clinicalReviewStatus: string;
    lastClinicallyReviewed: string | null;
    [k: string]: unknown;
  };
  categories: MedicineCategory[];
  medicines: CatalogueMedicine[];
};

const isStr = (v: unknown): v is string => typeof v === "string";
const isArr = Array.isArray;

export function validateCatalogue(data: unknown): Catalogue | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Partial<Catalogue>;
  if (!d.catalogueMetadata || !isStr(d.catalogueMetadata.medicalDisclaimer)) return null;
  if (!isArr(d.categories) || !isArr(d.medicines) || d.medicines.length === 0) return null;
  const ok = d.medicines.every(
    (m) => m && isStr(m.id) && isStr(m.displayName) && isArr(m.categoryIds) && m.contentReview && isStr(m.contentReview.reviewStatus),
  );
  return ok ? (d as Catalogue) : null;
}

export const catalogue = validateCatalogue(raw);

// Latin accents are folded; Indic and Urdu letters and vowel signs are kept.
const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").normalize("NFC").replace(/[^\p{L}\p{M}\p{N}]+/gu, " ").trim();

export function searchText(m: CatalogueMedicine, cats: MedicineCategory[]): string {
  const catNames = m.categoryIds.map((id) => cats.find((c) => c.id === id)?.name ?? "");
  return norm(
    [m.displayName, m.name, m.genericName, ...(m.alternativeNames ?? []), m.medicineGroup, m.summary, ...(m.whatIsItUsedFor ?? []), ...catNames, ...(m.searchKeywords ?? [])].join(" "),
  );
}

/**
 * Every query word must appear (partial, case/accent-insensitive). `localized`
 * optionally supplies translated text per medicine id so patients can search
 * in their selected language as well as in English.
 */
export function filterMedicines(meds: CatalogueMedicine[], cats: MedicineCategory[], query: string, categoryId: string | null, localized?: (m: CatalogueMedicine) => string) {
  const words = norm(query).split(" ").filter(Boolean);
  return meds.filter((m) => {
    if (categoryId && !m.categoryIds.includes(categoryId)) return false;
    if (!words.length) return true;
    const t = searchText(m, cats) + (localized ? " " + norm(localized(m)) : "");
    return words.every((w) => t.includes(w));
  });
}

export const isSafeUrl = (u: unknown): u is string => isStr(u) && /^https:\/\//i.test(u);
