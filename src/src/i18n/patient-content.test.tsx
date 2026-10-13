import { describe, expect, it, beforeEach, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: unknown }) => children,
}));
import { render, screen, fireEvent, act } from "@testing-library/react";
import en from "./catalog/en.json";
import hi from "./catalog/hi.json";
import kn from "./catalog/kn.json";
import mr from "./catalog/mr.json";
import ur from "./catalog/ur.json";
import { localizeDeep, walkStrings, type Dict } from "./localize";
import { patientContentSources } from "./content-sources";
import { articles, checklist } from "@/content/patient/library";
import { catalogue } from "@/lib/medicine-catalogue";
import { searchLibrary } from "@/lib/library-search";
import { PATIENT_LANG_STORAGE_KEY } from "./patient-languages";
import { PatientLanguageProvider, usePatientLanguage } from "./PatientLanguage";
import { AppointmentChecklist } from "@/components/library/AppointmentChecklist";

const catalogs: Record<string, Dict> = { hi, kn, mr, ur };
const english = en as string[];

describe("patient content catalogues", () => {
  it("en.json lists every translatable patient string (run the extractor if this fails)", () => {
    const found = new Set<string>();
    walkStrings(patientContentSources, (s) => found.add(s));
    for (const s of found) expect(english).toContain(s);
  });

  for (const [lang, dict] of Object.entries(catalogs)) {
    it(`${lang}: every English string has a translation`, () => {
      const missing = english.filter((s) => !dict[s]?.trim());
      expect(missing).toEqual([]);
    });
    it(`${lang}: placeholders are kept and 999 never appears`, () => {
      for (const [k, v] of Object.entries(dict)) {
        if (k === "__missing") continue;
        for (const ph of k.match(/\{\w+\}/g) ?? []) expect(v, k).toContain(ph);
        expect(v).not.toMatch(/\b999\b/);
        if (/\b112\b/.test(k)) expect(v, k).toMatch(/112/);
      }
    });
    it(`${lang}: localising keeps ids, slugs, medicine names and links unchanged`, () => {
      const a = localizeDeep(articles, dict);
      expect(a.map((x) => x.slug)).toEqual(articles.map((x) => x.slug));
      expect(a.flatMap((x) => x.sources.map((s) => s.url))).toEqual(articles.flatMap((x) => x.sources.map((s) => s.url)));
      const meds = localizeDeep(catalogue!.medicines, dict);
      expect(meds.map((m) => [m.id, m.displayName])).toEqual(catalogue!.medicines.map((m) => [m.id, m.displayName]));
      expect(localizeDeep(checklist, dict).groups.flatMap((g) => g.items)).toHaveLength(16);
    });
  }

  it("keeps exactly 20 unique medicine records", () => {
    const ids = catalogue!.medicines.map((m) => m.id);
    expect(ids).toHaveLength(20);
    expect(new Set(ids).size).toBe(20);
  });

  it("search finds an article by its Hindi title", () => {
    const a = articles.find((x) => x.slug === "what-is-neuropathic-pain") ?? articles[0]!;
    const title = (hi as Dict)[a.title];
    expect(title).toBeTruthy();
    const hits = searchLibrary(title!, hi as Dict);
    expect(hits.some((h) => h.kind === "article" && h.slug === a.slug)).toBe(true);
  });
});

function Switch() {
  const { setLang } = usePatientLanguage();
  return <button type="button" onClick={() => setLang("hi")}>to-hi</button>;
}

describe("checklist in the page", () => {
  beforeEach(() => window.localStorage.removeItem(PATIENT_LANG_STORAGE_KEY));

  it("renders Hindi items and keeps ticks when the language changes", async () => {
    render(<PatientLanguageProvider><Switch /><AppointmentChecklist /></PatientLanguageProvider>);
    const firstEn = checklist.groups[0]!.items[0]!;
    fireEvent.click(screen.getByLabelText(new RegExp(firstEn.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))));
    await act(async () => { fireEvent.click(screen.getByText("to-hi")); });
    const firstHi = (hi as Dict)[firstEn]!;
    const box = await screen.findByLabelText(new RegExp(firstHi.slice(0, 12).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    expect((box as HTMLInputElement).checked).toBe(true);
    expect(document.documentElement.lang).toBe("hi");
  });
});
