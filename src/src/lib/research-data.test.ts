import { describe, expect, it } from "vitest";
import { EXPORT_SHEETS } from "@/lib/export-spec";
import { codesOf, PCNE_OUTCOMES } from "@/lib/instruments";
import { normalizeChecklistEntry } from "@/components/research/StudyForms";

const bmiOf = (h: number | null, w: number | null) =>
  h && w && h > 0 && w > 0 ? (w / ((h / 100) ** 2)).toFixed(1) : null;

describe("BMI calculation", () => {
  it("computes BMI from height in cm and weight in kg", () => {
    expect(bmiOf(170, 70)).toBe("24.2");
  });
  it("returns null when height or weight is missing — missing is never shown as zero", () => {
    expect(bmiOf(null, 70)).toBeNull();
    expect(bmiOf(170, null)).toBeNull();
    expect(bmiOf(0, 70)).toBeNull();
  });
});

describe("counselling checklist", () => {
  it("defaults legacy boolean entries to covered with no teach-back", () => {
    expect(normalizeChecklistEntry(true)).toEqual({ covered: true, teach_back: false });
    expect(normalizeChecklistEntry(false)).toEqual({ covered: false, teach_back: false });
  });
  it("keeps covered and teach-back independent", () => {
    expect(normalizeChecklistEntry({ covered: true, teach_back: false })).toEqual({
      covered: true,
      teach_back: false,
    });
    expect(normalizeChecklistEntry({ covered: false, teach_back: true })).toEqual({
      covered: false,
      teach_back: true,
    });
    expect(normalizeChecklistEntry(undefined)).toEqual({});
  });
});

describe("export workbook integrity", () => {
  it("includes the new relational sheets exactly once", () => {
    const keys = EXPORT_SHEETS.map((s) => s.key);
    for (const k of ["laboratory", "adrs", "med_changes", "drp_outcomes"]) {
      expect(keys.filter((x) => x === k)).toHaveLength(1);
    }
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("PCNE outcome codes", () => {
  it("per-visit DRP outcomes use only the authoritative PCNE catalogue", () => {
    const codes = codesOf(PCNE_OUTCOMES);
    expect(codes).toEqual(["O0.1", "O1.1", "O2.1", "O3.1", "O3.2", "O3.3", "O3.4"]);
  });
});
