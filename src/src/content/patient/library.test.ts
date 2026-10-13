import { describe, expect, it } from "vitest";
import { articles, articleBySlug, seekHelp } from "./library";
import { searchLibrary } from "@/lib/library-search";

describe("education library", () => {
  it("every related link points to a real article", () => {
    for (const a of articles) for (const r of a.relatedArticles) expect(articleBySlug(r), `${a.slug} -> ${r}`).toBeDefined();
  });
  it("no article claims clinical review", () => expect(articles.every((a) => a.reviewStatus === "awaiting-review" && !a.reviewedBy)).toBe(true));
  it("every article has at least one https source", () => expect(articles.every((a) => a.sources.length > 0 && a.sources.every((s) => s.url.startsWith("https://")))).toBe(true));
  it("help page uses India 112 and has no placeholders", () => { expect(seekHelp.emergencyNumber).toBe("112"); expect(JSON.stringify(seekHelp)).not.toMatch(/999|will be added/); expect(seekHelp.levels[0]?.groups).toHaveLength(4); });
  it("search finds shingles article case-insensitively", () => expect(searchLibrary("SHINGLES").some((h) => h.kind === "article" && h.slug === "pain-after-shingles")).toBe(true));
  it("search includes medicine catalogue", () => expect(searchLibrary("pregabalin").some((h) => h.kind === "medicine")).toBe(true));
});

import { leaflets } from "./library";
import { glossary } from "./glossary";
describe("connected content", () => {
  it("every leaflet uses real articles", () => {
    for (const l of leaflets) for (const s of l.articleSlugs) expect(articleBySlug(s), `${l.id} -> ${s}`).toBeDefined();
  });
  it("every glossary link points to a real article", () => {
    for (const g of glossary) for (const s of g.related ?? []) expect(articleBySlug(s), `${g.term} -> ${s}`).toBeDefined();
  });
});

import { checklist } from "./library";
import { catalogue } from "@/lib/medicine-catalogue";
describe("appointment checklist", () => {
  it("has exactly 16 counted items", () => expect(checklist.groups.flatMap((g) => g.items)).toHaveLength(16));
  it("follow-up prompts are separate (3, not counted)", () => expect(checklist.beforeILeave.prompts).toHaveLength(3));
});
describe("catalogue integrity", () => {
  it("each of the 20 named medicines appears exactly once", () => {
    const names = ["Pregabalin","Gabapentin","Duloxetine","Amitriptyline","Nortriptyline","Carbamazepine","Metformin","Insulin","Gliclazide","Amlodipine","Telmisartan","Losartan","Atorvastatin","Clopidogrel","Pantoprazole","Paracetamol","Levothyroxine"];
    const all = catalogue!.medicines.map((m) => m.displayName.toLowerCase());
    expect(new Set(catalogue!.medicines.map((m) => m.id)).size).toBe(20);
    for (const n of names) expect(all.filter((x) => x === n.toLowerCase()), n).toHaveLength(1);
  });
});
