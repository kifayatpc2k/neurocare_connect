// Shared by the runtime and the string-extraction script so both agree on
// exactly which strings are translatable.
//
// Translation catalogues are keyed by the canonical English text (gettext
// style): `{ "English sentence": "अनुवाद" }`. A missing entry renders the
// English text, which the coverage test detects.

/** Object keys whose string values are identifiers, names, codes or links — never translated. */
export const SKIP_KEYS = new Set([
  "id", "slug", "url", "href", "hash", "page", "to", "anchor", "key", "related", "relatedArticles", "articleSlugs",
  "categoryIds", "name", "genericName", "displayName", "alternativeNames", "severity", "urgency", "reviewStatus", "status",
  "schemaVersion", "sources", "sourceReferences", "contentReview", "diagram", "icon", "publisher", "searchKeywords",
  "language", "country", "institution", "department", "intendedAudience", "contentType", "catalogueId",
  "clinicalReviewStatus", "lastClinicallyReviewed", "emergencyNumber", "letter", "kind", "level_id", "keywords", "suggestions",
]);

export type Dict = Readonly<Record<string, string>>;

const isTranslatable = (s: string) => /[A-Za-z]{2}/.test(s) && !/^https?:\/\//.test(s);

export function walkStrings(value: unknown, cb: (s: string) => void, key?: string): void {
  if (key && SKIP_KEYS.has(key)) return;
  if (typeof value === "string") { if (isTranslatable(value)) cb(value); return; }
  if (Array.isArray(value)) { for (const v of value) walkStrings(v, cb); return; }
  if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walkStrings(v, cb, k);
}

export function localizeDeep<T>(value: T, dict: Dict, key?: string): T {
  if (key && SKIP_KEYS.has(key)) return value;
  if (typeof value === "string") return (dict[value] ?? value) as T;
  if (Array.isArray(value)) return value.map((v) => localizeDeep(v, dict)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = localizeDeep(v, dict, k);
    return out as T;
  }
  return value;
}

/** Replace {name} placeholders after lookup. */
export function fill(s: string, vars?: Record<string, string | number>) {
  return vars ? s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? "")) : s;
}

/** Marks an English constant for extraction; translate it later with tx(). */
export const msg = (s: string) => s;
