// Every place Ask NeuroCare can send a patient. Only public patient routes
// are representable, so the assistant can never link into research screens.
export type PagePath =
  | "/patient"
  | "/patient/library"
  | "/patient/library/help"
  | "/patient/library/faq"
  | "/patient/library/glossary"
  | "/patient/library/checklist"
  | "/patient/library/checks"
  | "/patient/library/leaflets"
  | "/patient/medicines"
  | "/study";

export type Target =
  | { kind: "article"; slug: string }
  | { kind: "medicine"; id: string }
  | { kind: "page"; to: PagePath; hash?: string };

export const PAGE_PATHS: readonly PagePath[] = [
  "/patient", "/patient/library", "/patient/library/help", "/patient/library/faq", "/patient/library/glossary",
  "/patient/library/checklist", "/patient/library/checks", "/patient/library/leaflets", "/patient/medicines", "/study",
];

export const targetKey = (t: Target) =>
  t.kind === "article" ? `a:${t.slug}` : t.kind === "medicine" ? `m:${t.id}` : `p:${t.to}#${t.hash ?? ""}`;
