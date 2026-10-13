import { faqs, libraryGlossary, librarySections, publicArticles } from "@/content/patient/library";
import { glossary, termId } from "@/content/patient/glossary";
import { catalogue } from "@/lib/medicine-catalogue";
import type { Dict } from "@/i18n/localize";

export type LibraryHit =
  | { kind: "article" | "medicine"; title: string; text: string; slug: string; anchor?: undefined }
  | { kind: "faq" | "glossary" | "section"; title: string; text: string; slug?: undefined; anchor?: string };

/** Unicode-aware: keeps Devanagari, Kannada and Urdu letters and their vowel signs. */
export const normSearch = (s: string) =>
  s.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{M}\p{N}]+/gu, " ").trim();

/**
 * Local search over published library content. Matches both the English text
 * and the active language's translation, and returns translated titles.
 * Nothing is sent anywhere.
 */
export function searchLibrary(query: string, dict: Dict = {}): LibraryHit[] {
  const words = normSearch(query).split(" ").filter(Boolean);
  if (!words.length) return [];
  const tr = (s: string) => dict[s] ?? s;
  const match = (...parts: string[]) => {
    const t = normSearch(parts.flatMap((p) => (dict[p] ? [p, dict[p]] : [p])).join(" "));
    return words.every((w) => t.includes(w));
  };
  const hits: LibraryHit[] = [];
  for (const a of publicArticles()) {
    const sec = librarySections.find((s) => s.id === a.category)?.title ?? "";
    if (match(a.title, a.summary, sec, ...a.content.map((b) => b.heading))) hits.push({ kind: "article", title: tr(a.title), text: tr(a.summary), slug: a.slug });
  }
  for (const s of librarySections) if (s.page && match(s.title, s.description)) hits.push({ kind: "section", title: tr(s.title), text: tr(s.description), anchor: s.id });
  for (const f of faqs) if (match(f.q, f.a)) hits.push({ kind: "faq", title: tr(f.q), text: tr(f.a) });
  const seen = new Set<string>();
  for (const g of [...glossary, ...libraryGlossary]) {
    if (seen.has(g.term)) continue; seen.add(g.term);
    if (match(g.term, g.text)) hits.push({ kind: "glossary", title: tr(g.term), text: tr(g.text), anchor: termId(g.term) });
  }
  for (const m of catalogue?.medicines ?? []) {
    if (match(m.displayName, m.genericName, m.medicineGroup, m.summary, ...m.whatIsItUsedFor, ...m.searchKeywords))
      hits.push({ kind: "medicine", title: m.displayName, text: tr(m.summary), slug: m.id });
  }
  return hits;
}
