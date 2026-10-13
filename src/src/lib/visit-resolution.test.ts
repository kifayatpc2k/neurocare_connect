import { describe, expect, it } from "vitest";
import { isVisitOpen, noOpenVisitReason, openDocumentationVisit } from "./lifecycle";

const enrolled = { enrolmentConfirmed: true, baselineCompletedAt: null, randomizedAt: null, day15OpenedAt: null, day15CompletedAt: null, day30CompletedAt: null };

describe("open documentation visit", () => {
  it("is baseline while baseline is not completed", () => {
    expect(openDocumentationVisit(enrolled)).toBe("baseline");
  });
  it("is none after baseline completes and before Day 15 opens (never falls back to baseline)", () => {
    const p = { ...enrolled, baselineCompletedAt: "2026-10-13" };
    expect(openDocumentationVisit(p)).toBeNull();
    expect(isVisitOpen(p, "baseline")).toBe(false);
    expect(noOpenVisitReason(p)).toMatch(/Randomise the participant/);
  });
  it("is day 15 once randomised and Day 15 is opened", () => {
    expect(openDocumentationVisit({ ...enrolled, baselineCompletedAt: "x", randomizedAt: "x", day15OpenedAt: "x" })).toBe("day_15");
  });
  it("is day 30 after Day 15 completes", () => {
    expect(openDocumentationVisit({ ...enrolled, baselineCompletedAt: "x", randomizedAt: "x", day15OpenedAt: "x", day15CompletedAt: "x" })).toBe("day_30");
  });
  it("is none after Day 30 completes", () => {
    expect(openDocumentationVisit({ ...enrolled, baselineCompletedAt: "x", randomizedAt: "x", day15OpenedAt: "x", day15CompletedAt: "x", day30CompletedAt: "x" })).toBeNull();
  });
});
