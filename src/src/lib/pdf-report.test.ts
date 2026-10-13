import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { renderReport, safe, type Block } from "./pdf-report";

const meta = { title: "Individual Participant Study Report", studyCode: "NCC-0001", generatedAt: "11 Oct 2026 18:30 UTC" };

async function render(blocks: Block[], cover: Block[] = []) {
  const bytes = await renderReport(meta, cover, blocks);
  expect(bytes[0]).toBe(0x25); // %PDF
  return PDFDocument.load(bytes);
}

describe("renderReport", () => {
  it("flows short content onto the first page (no separate cover page)", async () => {
    const doc = await render([{ kind: "section", title: "1. Demographics" }, { kind: "kv", rows: [["Age", "45"]] }]);
    expect(doc.getPageCount()).toBe(1);
  });

  it("paginates long tables across pages without throwing", async () => {
    const rows = Array.from({ length: 120 }, (_, i) => [`Row ${i + 1}`, "A moderately long clinical description that must wrap naturally within its column without clipping", "Yes"]);
    const doc = await render([{ kind: "table", header: ["Ref", "Description", "Flag"], widths: [4, 24, 6], rows }]);
    expect(doc.getPageCount()).toBeGreaterThan(1);
  });

  it("handles empty sections and missing values", async () => {
    const doc = await render([
      { kind: "section", title: "4. Laboratory investigations" },
      { kind: "paragraph", text: "No laboratory investigations have been recorded.", muted: true },
      { kind: "kv", rows: [["Result", "Not recorded"], ["BMI", "Not recorded"]] },
    ]);
    expect(doc.getPageCount()).toBe(1);
  });

  it("handles unicode and very long tokens safely", async () => {
    const doc = await render([
      { kind: "paragraph", text: "Pain radiating → leg, temp 37.5°C, dose ≥ 10 mg — पाठ and emoji 🧪 must not break rendering" },
      { kind: "paragraph", text: "X".repeat(500) },
    ]);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("renders charts and timelines", async () => {
    const doc = await render([
      { kind: "chart", title: "NRS trajectory", points: [{ label: "Baseline", value: 7 }, { label: "Day 30", value: 4 }], min: 0, max: 10 },
      { kind: "timeline", steps: [{ label: "Screening", date: "01 Jan 2026", done: true }, { label: "Day 30", date: "Not recorded", done: false }] },
    ]);
    expect(doc.getPageCount()).toBe(1);
  });
});

describe("reference-style blocks", () => {
  it("renders fields, responses and score panels with a synthetic banner", async () => {
    const bytes = await renderReport({ ...meta, synthetic: true }, [{ kind: "fields", rows: [["Study ID", "NCC-0001"], ["Site", "Not recorded"], ["Group", "Control"]] }], [
      { kind: "responses", rows: Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1}. DN4 item ${i + 1}`, answer: i % 2 ? "NO" : "YES", positive: i % 2 === 0 })) },
      { kind: "score", value: "5/10", title: "At or above the DN4 cut-off — Baseline", text: "Calculated by the study database." },
    ]);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });
});

describe("safe", () => {
  it("maps unsupported glyphs to placeholders and keeps WinAnsi", () => {
    expect(safe("a→b")).toBe("a->b");
    expect(safe("37.5°C")).toBe("37.5°C");
    expect(safe("🧪")).toBe("[non-Latin text]");
    expect(safe("Pain पाठ ಕನ್ನಡ ok")).toBe("Pain [non-Latin text] [non-Latin text] ok");
    expect(safe("x\ny")).toBe("x\ny");
  });
});
