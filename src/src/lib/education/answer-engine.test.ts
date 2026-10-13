import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { answer, norm } from "./answer-engine";
import { contentIndex } from "./content-index";
import { PAGE_PATHS, type Target } from "./targets";
import { chatText, knowledgeBase } from "@/content/patient/chat";
import { articles } from "@/content/patient/library";
import { catalogue } from "@/lib/medicine-catalogue";
import { PATIENT_LANGS, langDef } from "@/i18n/patient-languages";
import hi from "@/i18n/catalog/hi.json";
import kn from "@/i18n/catalog/kn.json";
import mr from "@/i18n/catalog/mr.json";
import ur from "@/i18n/catalog/ur.json";

const dicts = { hi, kn, mr, ur } as Record<string, Record<string, string>>;
const chatFiles = ["src/lib/education/answer-engine.ts", "src/lib/education/content-index.ts", "src/lib/education/synonyms.ts", "src/lib/education/targets.ts", "src/components/patient/AskNeuroCare.tsx", "src/content/patient/chat.ts"];
const src = chatFiles.map((f) => readFileSync(f, "utf8")).join("\n");

const idOf = (r: ReturnType<typeof answer>) =>
  r.kind === "answer" ? r.entry.id : r.kind === "best" ? r.result.id : r.kind === "results" ? r.results.map((x) => x.id).join(",") : r.kind;

function validTarget(t: Target) {
  if (t.kind === "article") return articles.some((a) => a.slug === t.slug);
  if (t.kind === "medicine") return !!catalogue?.medicines.some((m) => m.id === t.id);
  return PAGE_PATHS.includes(t.to) && existsSync(`src/routes${t.to === "/patient" ? "/patient/index" : t.to}.tsx`);
}

describe("Ask NeuroCare — local only", () => {
  it("uses no network, AI service, backend or database", () => {
    expect(src).not.toMatch(/fetch\(|XMLHttpRequest|axios|supabase|createServerFn|openai|gemini|anthropic|WebSocket|sendBeacon/i);
  });
  it("never persists the conversation", () => {
    expect(src).not.toMatch(/localStorage|sessionStorage|document\.cookie|indexedDB/);
  });
});

describe("Ask NeuroCare — answers", () => {
  it.each([
    ["What is neuropathic pain?", "neuropathic-pain"],
    ["What is nerve pain?", "neuropathic-pain"],
    ["What is a medication review?", "medication-review"],
    ["What is a drug-related problem?", "drp"],
    ["What should I bring to my appointment?", "appointment"],
    ["When should I seek medical help?", "seek-help"],
    ["How does the study work?", "study"],
  ])("exact question %s returns the predefined answer", (q, id) => {
    expect(idOf(answer(q))).toBe(id);
  });

  it("predefined answers are the existing approved wording", () => {
    const r = answer("What is neuropathic pain?");
    expect(r.kind === "answer" && r.entry.answer).toBe("Neuropathic pain is pain that comes from a problem with the nerves themselves.");
  });

  it.each([
    ["Is there a medicine check?", "medication-review"],
    ["questions for my doctor", "appointment"],
    ["burning pain", "neuropathic-pain"],
  ])("synonym %s finds %s", (q, id) => expect(idOf(answer(q))).toBe(id));

  it.each([["What is DN4?", "glossary:dn4"], ["What does NRS mean?", "glossary:nrs"], ["What is NePIQoL?", "glossary:nepiqol"], ["shingles", "article:pain-after-shingles"]])(
    "%s opens %s", (q, id) => expect(idOf(answer(q))).toBe(id));

  it("every target is an existing public patient route", () => {
    const targets: Target[] = [...contentIndex.map((e) => e.target), ...knowledgeBase.flatMap((e) => [e.target, ...(e.resources ?? [])]).filter((t): t is Target => !!t)];
    for (const t of targets) expect(validTarget(t), JSON.stringify(t)).toBe(true);
    expect(JSON.stringify(targets)).not.toMatch(/research|_authenticated|admin|participant/);
  });

  it("all 20 medicine names resolve to their own record, including a typo", () => {
    expect(catalogue?.medicines).toHaveLength(20);
    for (const m of catalogue!.medicines) expect(idOf(answer(m.displayName)), m.displayName).toBe(`medicine:${m.id}`);
    expect(idOf(answer("pregabalinn"))).toBe("medicine:pregabalin");
    expect(idOf(answer("Where can I learn about pregabalin?"))).toBe("medicine:pregabalin");
  });

  it("unmatched questions get the safe fallback", () => {
    expect(answer("what is the capital of france").kind).toBe("fallback");
    expect(answer("   ").kind).toBe("fallback");
  });

  it.each(["Should I take pregabalin?", "Can I stop my medicine?", "What dose should I use?", "Which medicine is best for me?", "Can I combine these medicines?", "मुझे कितनी खुराक लेनी चाहिए?"])(
    "personal treatment question %s is declined", (q) => {
      const r = answer(q);
      expect(r.kind).toBe("safety");
    });
  it("the safety reply contains no dose or prescription", () => {
    expect(chatText.safety).not.toMatch(/\d+\s?mg|take \d/i);
  });

  it.each(["My face is drooping on one side", "sudden weakness on one side", "my tongue is swelling", "I can't breathe properly", "severe back pain and I can't control my bladder",
    "मुझे सांस लेने में दिक्कत है", "ನನಗೆ ಉಸಿರಾಟದ ತೊಂದರೆ ಆಗುತ್ತಿದೆ", "माझा चेहरा वाकडा झाला आहे", "مجھے سانس لینے میں مشکل ہو رہی ہے"])(
    "emergency phrase %s is prioritised", (q) => expect(answer(q).kind).toBe("emergency"));
  it("emergency phrases win over medicine matches", () => {
    expect(answer("pregabalin and my tongue is swelling").kind).toBe("emergency");
  });

  it("India emergency text uses 112 and never 999", () => {
    expect(chatText.emergencyPanelText).toContain("112");
    for (const d of [{}, ...Object.values(dicts)]) expect(JSON.stringify(Object.fromEntries(Object.entries(d).filter(([k]) => Object.values(chatText).includes(k))))).not.toContain("999");
    expect(src).not.toContain("999");
  });
});

describe("Ask NeuroCare — languages", () => {
  const uiStrings = [chatText.title, chatText.intro, chatText.welcome, chatText.placeholder, chatText.send, chatText.clear, chatText.fallback, chatText.privacy, chatText.safety, chatText.emergencyTitle, chatText.followUpTitle, chatText.englishOnly, ...knowledgeBase.filter((e) => chatText.suggestions.includes(e.id)).map((e) => e.question)];
  it.each(["hi", "kn", "mr", "ur"])("%s has every chatbot interface string", (l) => {
    for (const s of uiStrings) expect(dicts[l]![s], s).toBeTruthy();
  });

  it.each(["hi", "kn", "mr", "ur"])("%s: a translated suggested question returns the same answer", (l) => {
    for (const e of knowledgeBase) expect(idOf(answer(dicts[l]![e.question]!, dicts[l]))).toBe(e.id);
  });

  it("localized searches find localized resources", () => {
    const shinglesHi = hi["Nerve pain after shingles"] ?? "";
    expect(shinglesHi).not.toBe("");
    expect(idOf(answer(shinglesHi, hi))).toContain("pain-after-shingles");
  });

  it("Urdu is right-to-left and normalisation keeps its letters", () => {
    expect(langDef("ur").dir).toBe("rtl");
    expect(norm("اعصابی درد کیا ہے؟")).toBe("اعصابی درد کیا ہے");
  });

  it("only the five patient languages exist", () => expect(PATIENT_LANGS).toEqual(["en", "hi", "kn", "mr", "ur"]));
});
