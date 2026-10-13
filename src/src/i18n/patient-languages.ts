// Patient-area languages. English is the default and the canonical source.
// Every non-English resource is a DRAFT translation awaiting linguistic and
// clinical review — never present it as approved.
export const PATIENT_LANGS = ["en", "hi", "kn", "mr", "ur"] as const;
export type PatientLang = (typeof PATIENT_LANGS)[number];

export type TranslationStatus = "source" | "draft" | "awaiting-linguistic-review" | "awaiting-clinical-review" | "approved";

export type PatientLanguageDef = {
  code: PatientLang;
  englishName: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  status: TranslationStatus;
};

export const patientLanguageDefs: PatientLanguageDef[] = [
  { code: "en", englishName: "English", nativeName: "English", dir: "ltr", status: "source" },
  { code: "hi", englishName: "Hindi", nativeName: "हिन्दी", dir: "ltr", status: "awaiting-linguistic-review" },
  { code: "kn", englishName: "Kannada", nativeName: "ಕನ್ನಡ", dir: "ltr", status: "awaiting-linguistic-review" },
  { code: "mr", englishName: "Marathi", nativeName: "मराठी", dir: "ltr", status: "awaiting-linguistic-review" },
  { code: "ur", englishName: "Urdu", nativeName: "اُردُو", dir: "rtl", status: "awaiting-linguistic-review" },
];

export const PATIENT_LANG_STORAGE_KEY = "neurocare.patient.language";

export function isPatientLang(v: unknown): v is PatientLang {
  return typeof v === "string" && (PATIENT_LANGS as readonly string[]).includes(v);
}

export function langDef(code: PatientLang): PatientLanguageDef {
  return patientLanguageDefs.find((l) => l.code === code) ?? patientLanguageDefs[0]!;
}
