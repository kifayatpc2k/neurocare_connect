// Local content index for Ask NeuroCare, derived from the existing patient
// content sources (no copied text). Titles/summaries stay canonical English
// and are localised at display time through the patient catalogues.
import { articles, checklist, faqs, libraryGlossary, librarySections, seekHelp } from "@/content/patient/library";
import { glossary, termId } from "@/content/patient/glossary";
import { faqs as studyFaqs } from "@/content/study";
import { catalogue } from "@/lib/medicine-catalogue";
import { walkStrings, type Dict } from "@/i18n/localize";
import type { Target } from "./targets";

export type ResourceType = "article" | "medicine" | "faq" | "glossary" | "page" | "study";

export type IndexEntry = {
  id: string;
  type: ResourceType;
  title: string;
  summary: string;
  /** Section headings (articles) — weighted above body text. */
  headings: string[];
  body: string[];
  keywords: string[];
  target: Target;
  reviewStatus: string;
};

const strings = (v: unknown) => { const out: string[] = []; walkStrings(v, (s) => out.push(s)); return out; };

function build(): IndexEntry[] {
  const out: IndexEntry[] = [];
  for (const a of articles) {
    if (a.reviewStatus === "draft") continue;
    out.push({
      id: `article:${a.slug}`, type: "article", title: a.title, summary: a.summary,
      headings: a.content.map((b) => b.heading), body: [...strings(a.content.map((b) => [b.paragraphs, b.list])), ...a.takeaways],
      keywords: [librarySections.find((s) => s.id === a.category)?.title ?? ""], target: { kind: "article", slug: a.slug }, reviewStatus: a.reviewStatus,
    });
  }
  faqs.forEach((f, i) => out.push({
    id: `faq:${i}`, type: "faq", title: f.q, summary: f.a, headings: [], body: [], keywords: [],
    target: f.related ? { kind: "article", slug: f.related } : { kind: "page", to: "/patient/library/faq" }, reviewStatus: "awaiting-review",
  }));
  const seen = new Set<string>();
  for (const g of [...glossary, ...libraryGlossary]) {
    if (seen.has(g.term)) continue; seen.add(g.term);
    out.push({ id: `glossary:${termId(g.term)}`, type: "glossary", title: g.term, summary: g.text, headings: [], body: [], keywords: [], target: { kind: "page", to: "/patient/library/glossary", hash: termId(g.term) }, reviewStatus: "awaiting-review" });
  }
  for (const m of catalogue?.medicines ?? []) {
    out.push({
      id: `medicine:${m.id}`, type: "medicine", title: m.displayName, summary: m.summary, headings: [m.medicineGroup],
      body: [...m.whatIsItUsedFor, m.howDoesItWork], keywords: [m.genericName, m.name, ...(m.alternativeNames ?? []), ...m.searchKeywords],
      target: { kind: "medicine", id: m.id }, reviewStatus: m.contentReview.reviewStatus,
    });
  }
  out.push({ id: "page:checklist", type: "page", title: checklist.title, summary: checklist.intro, headings: strings(checklist.groups.map((g) => g.title)), body: strings(checklist.groups), keywords: ["appointment"], target: { kind: "page", to: "/patient/library/checklist" }, reviewStatus: "awaiting-review" });
  out.push({ id: "page:help", type: "page", title: seekHelp.title, summary: seekHelp.intro[0]!, headings: seekHelp.levels.map((l) => l.title), body: [], keywords: ["emergency", "112"], target: { kind: "page", to: "/patient/library/help" }, reviewStatus: "awaiting-review" });
  for (const l of seekHelp.levels) {
    out.push({ id: `help:${l.id}`, type: "page", title: l.title, summary: l.action, headings: l.groups.map((g) => g.title), body: strings(l.groups.map((g) => [g.items, g.note])), keywords: [l.level], target: { kind: "page", to: "/patient/library/help", hash: l.id }, reviewStatus: "awaiting-review" });
  }
  for (const s of librarySections) {
    if (!s.page || s.page === "/patient/library/help" || s.page === "/patient/library/checklist") continue;
    out.push({ id: `section:${s.id}`, type: "page", title: s.title, summary: s.description, headings: [], body: [], keywords: [], target: { kind: "page", to: s.page }, reviewStatus: "awaiting-review" });
  }
  studyFaqs.forEach(([q, a], i) => out.push({ id: `study:${i}`, type: "study", title: q, summary: a, headings: [], body: [], keywords: ["study"], target: { kind: "page", to: "/study", hash: "faq" }, reviewStatus: "awaiting-review" }));
  return out;
}

export const contentIndex: IndexEntry[] = build();

export const medicineEntries = () => contentIndex.filter((e) => e.type === "medicine");

/** Normalised searchable text for one entry in English plus the active language. */
export type Prepared = { e: IndexEntry; titles: string[]; title: string; headings: string; body: string; keywords: string };

const cache = new WeakMap<Dict, Prepared[]>();
export function prepared(dict: Dict, norm: (s: string) => string): Prepared[] {
  const hit = cache.get(dict);
  if (hit) return hit;
  const both = (xs: string[]) => norm(xs.flatMap((s) => (dict[s] ? [s, dict[s]!] : [s])).join(" | "));
  const out = contentIndex.map((e) => ({ e, titles: [e.title, dict[e.title]].filter((x): x is string => !!x).map(norm), title: both([e.title]), headings: both(e.headings), body: both([e.summary, ...e.body]), keywords: both(e.keywords) }));
  cache.set(dict, out);
  return out;
}
