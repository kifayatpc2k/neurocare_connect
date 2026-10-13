import { knowledgeBase, type KnowledgeEntry } from "@/content/patient/chat";
import type { Dict } from "@/i18n/localize";
import { PATIENT_LANGS } from "@/i18n/patient-languages";
import { contentIndex, prepared, type IndexEntry } from "./content-index";
import { conceptSynonyms, emergencyRules, stopwords, treatmentRules } from "./synonyms";
import type { Target } from "./targets";

/**
 * Ask NeuroCare: a deterministic, local question matcher.
 * Pipeline: normalise → emergency rules → personal-treatment rules → exact
 * question → medicine names → synonyms → ranked index search → fallback.
 * No network, no model, nothing stored.
 */
export type EngineResult =
  | { kind: "emergency" }
  | { kind: "safety"; medicines: IndexEntry[] }
  | { kind: "answer"; entry: KnowledgeEntry }
  | { kind: "best"; result: IndexEntry }
  | { kind: "results"; results: IndexEntry[] }
  | { kind: "fallback" };

/** Unicode-aware: keeps letters and combining vowel signs of all five scripts. */
export const norm = (s: string) =>
  s.normalize("NFC").toLowerCase().replace(/[’'`]/g, " ").replace(/[^\p{L}\p{M}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();

const isLatin = (t: string) => /^[a-z0-9 ]+$/.test(t);

/** Latin terms match whole words (with optional plural); other scripts match as substrings to allow suffixes. */
export function hasTerm(q: string, term: string): boolean {
  const t = norm(term);
  if (!t) return false;
  if (!isLatin(t)) return q.includes(t);
  return new RegExp(`(^| )${t.replace(/ /g, " ")}s?( |$)`).test(q);
}

const ruleHit = (q: string, rules: string[][][]) => rules.some((groups) => groups.every((g) => g.some((t) => hasTerm(q, t))));
const allRules = (r: Record<string, string[][][]>) => PATIENT_LANGS.flatMap((l) => r[l] ?? []);

export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]!);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length]!;
}

const fuzzyEq = (w: string, t: string) => w === t || (isLatin(t) && t.length >= 5 && editDistance(w, t, t.length >= 8 ? 2 : 1) <= (t.length >= 8 ? 2 : 1));

/** Medicines named in the question (exact or a small spelling mistake). */
export function findMedicines(q: string): IndexEntry[] {
  const words = q.split(" ");
  return contentIndex.filter((e) => {
    if (e.type !== "medicine") return false;
    const names = [e.title, ...e.keywords.slice(0, 2)].map(norm);
    return names.some((n) => {
      if (n.includes(" ") && q.includes(n)) return true;
      const core = n.split(" ").filter((x) => x.length >= 5 && !["topical", "dose"].includes(x));
      return core.length > 0 && core.every((c) => words.some((w) => fuzzyEq(w, c)));
    });
  });
}

function exactQuestion(q: string, dict: Dict): KnowledgeEntry | undefined {
  return knowledgeBase.find((e) => [e.question, ...(e.alsoAsked ?? [])].some((s) => norm(s) === q || (dict[s] && norm(dict[s]!) === q)));
}

function conceptMatch(q: string): { entry: KnowledgeEntry; score: number } | null {
  let best: { entry: KnowledgeEntry; score: number } | null = null;
  for (const [id, perLang] of Object.entries(conceptSynonyms)) {
    let score = 0;
    for (const t of PATIENT_LANGS.flatMap((l) => perLang[l])) if (hasTerm(q, t)) score = Math.max(score, 2 + norm(t).split(" ").length);
    const entry = knowledgeBase.find((e) => e.id === id);
    if (entry && score > (best?.score ?? 0)) best = { entry, score };
  }
  return best;
}

export function rankContent(q: string, dict: Dict): { e: IndexEntry; score: number; exact: boolean }[] {
  const tokens = q.split(" ").filter((t) => t && !stopwords.has(t) && (t.length > 1 || /\d/.test(t)));
  if (!tokens.length) return [];
  const has = (hay: string, t: string) => hasTerm(hay, t) || (isLatin(t) && t.length >= 5 && hay.split(" ").some((w) => fuzzyEq(t, w)));
  const scored: { e: IndexEntry; score: number; exact: boolean }[] = [];
  const core = tokens.join(" ");
  for (const p of prepared(dict, norm)) {
    let score = 0, matched = 0;
    const exact = p.titles.includes(q) || p.titles.includes(core);
    if (exact) score += 12;
    else if (tokens.length > 1 && p.title.includes(tokens.join(" "))) score += 6;
    for (const t of tokens) {
      const s = (has(p.title, t) ? 4 : 0) + (has(p.keywords, t) ? 3 : 0) + (has(p.headings, t) ? 2 : 0) + (p.body.includes(t) ? 1 : 0);
      if (s) matched++;
      score += s;
    }
    if (matched / tokens.length < 0.5) continue;
    if (p.e.type === "article") score += 0.5;
    if (score >= 4 || (matched === tokens.length && score >= 2)) scored.push({ e: p.e, score, exact });
  }
  return scored.sort((a, b) => b.score - a.score);
}

export function answer(input: string, dict: Dict = {}): EngineResult {
  const q = norm(input);
  if (!q) return { kind: "fallback" };
  if (ruleHit(q, allRules(emergencyRules))) return { kind: "emergency" };
  const meds = findMedicines(q);
  // Medicine names (e.g. "low-dose aspirin") must not trip the dose rule.
  let rq = q;
  for (const m of meds) rq = rq.replace(norm(m.title), " ");
  // A known, approved question is answered before the treatment rules, so
  // translated phrasings such as "...کب لینی چاہیے" are not misread.
  const exact = exactQuestion(q, dict);
  if (exact) return { kind: "answer", entry: exact };
  if (ruleHit(rq, allRules(treatmentRules))) return { kind: "safety", medicines: meds };
  if (meds.length === 1) return { kind: "best", result: meds[0]! };
  if (meds.length > 1) return { kind: "results", results: meds.slice(0, 5) };
  const concept = conceptMatch(q);
  const ranked = rankContent(q, dict);
  const top = ranked[0];
  if (concept && concept.score >= 4 && !top?.exact) return { kind: "answer", entry: concept.entry };
  if (top) {
    const close = ranked.filter((r) => r.score >= top.score * 0.6).slice(0, 5);
    if (close.length === 1 || top.exact) return { kind: "best", result: top.e };
    return { kind: "results", results: close.map((r) => r.e) };
  }
  if (concept) return { kind: "answer", entry: concept.entry };
  return { kind: "fallback" };
}

export function findEntry(id: string) {
  return knowledgeBase.find((e) => e.id === id);
}

export type { Target };
