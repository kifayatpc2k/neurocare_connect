import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderReport } from "./pdf-report";
import { buildReportBlocks, type ReportDataset } from "./report-model";

// Synthetic fixtures only — never real participant data.
const GEN = "11 Oct 2026 20:00 UTC";
const blankDs = (code: string): ReportDataset => ({
  participant: { participant_code: code, status: "screening", lifecycle_stage: "screening", eligibility_status: "pending", consent_status: "pending" },
  randomizations: [], milestones: [], assessments: [], demographics: [], clinical: [], medications: [], interactions: [], drps: [],
  counselling: [], followUps: [], overrides: [], laboratory: [], adrs: [], medicationChanges: [], drpOutcomes: [], recommendations: [],
});

function full(code: string, tag: string): ReportDataset {
  const ds = blankDs(code);
  ds.participant = { ...ds.participant, status: "enrolled", lifecycle_stage: "day_30", eligibility_status: "eligible", consent_status: "consented", consent_confirmed: true,
    inclusion_criteria_met: true, exclusion_criteria_present: false, screening_notes: `screen-${tag}`, consent_notes: `consent-${tag}`, enrolment_confirmed: true,
    enrolment_notes: `enrol-${tag}`, notes: `pnotes-${tag}`, study_group: "intervention", randomized_at: "2026-01-05T10:00:00Z", completion_notes: `complete-${tag}`,
    screening_date: "2026-01-01", enrolled_at: "2026-01-02", baseline_completed_at: "2026-01-04T10:00:00Z", day_15_completed_at: "2026-01-20T10:00:00Z", day_30_completed_at: "2026-02-04T10:00:00Z" };
  ds.demographics = [{ age_years: 54, sex: "female", height_cm: 160, weight_kg: 64, bed_number: `bed-${tag}`, state: `Karnataka-${tag}`, preferred_language: "kannada",
    caregiver_ecg_notes: `ecg-${tag}`, contact_number: "9999999999", address: "SECRET ADDRESS",
    habits: { caffeine: { status: "yes", details: `3 cups/day “strong”; 10mg – ${tag}` }, tobacco: { status: "no" }, alcohol: { status: "unknown" } } }];
  ds.clinical = [{ primary_diagnosis: `diag-${tag}`, examination: { cns: `cns-${tag}`, general: null }, clinical_notes: `Long note ${"lorem ipsum ".repeat(120)} end-${tag}` }];
  ds.medications = [1, 2, 3].map((i) => ({ id: `m${i}`, drug_name: `drug${i}-${tag}`, is_current: true }));
  ds.laboratory = [1, 2, 3].map((i) => ({ category: "haematology", investigation_name: `lab${i}-${tag}`, result: String(i) }));
  ds.drps = [1, 2].map((i) => ({ id: `d${i}`, milestone: "baseline", status: "open", description: `drpdesc${i}-${tag}`, pcne_cause_codes: [], pcne_intervention_codes: [] }));
  ds.recommendations = [{ drp_id: "d1", recommendation: `rec1-${tag}` }, { drp_id: "d2", recommendation: `rec2-${tag}` }];
  ds.counselling = [{ milestone: "baseline", notes: `counsel-${tag}`, checklist: { medication_use: { covered: true, teach_back: false } } }];
  ds.followUps = [{ milestone: "day_15", status: "completed", notes: `fu15-${tag}` }, { milestone: "day_30", status: "completed", notes: `fu30-${tag}` }];
  ds.assessments = [{ milestone: "baseline", instrument: "NRS", responses: { score: 7 } }, { milestone: "day_30", instrument: "NRS", responses: { score: 3 } }];
  ds.medicationChanges = [{ milestone: "day_15", medication_name: `chg-${tag}` }];
  ds.adrs = [{ kind: "adr", milestone: "day_15", reaction_description: `adr-${tag}` }];
  ds.drpOutcomes = [{ drp_id: "d2", milestone: "day_30", visit_status: "resolved", notes: `drpout-${tag}` }];
  ds.interactions = [{ drug_a: `ia-${tag}`, drug_b: "x" }];
  return ds;
}

async function pdfText(ds: ReportDataset) {
  const { cover, blocks, studyCode } = buildReportBlocks(ds, GEN);
  const bytes = await renderReport({ title: "Clinical Research Participant Record", studyCode, generatedAt: GEN }, cover, blocks);
  const f = join(mkdtempSync(join(tmpdir(), "rpt-")), "r.pdf");
  writeFileSync(f, bytes);
  const pages = Number(/Pages:\s+(\d+)/.exec(execFileSync("pdfinfo", [f]).toString())![1]);
  return { text: execFileSync("pdftotext", ["-raw", f, "-"]).toString().replace(/\s+/g, " "), pages };
}

const SECTIONS = ["Screening", "Consent", "Enrolment", "Demographics", "Clinical Data", "Laboratory", "Baseline", "Medication Review", "Drug-Related Problems", "Randomisation", "Intervention", "Day 15", "Day 30", "Outcomes"];

describe("participant PDF completeness (rendered text)", () => {
  it("minimal record renders all 14 sections with Not recorded, never No", async () => {
    const { text } = await pdfText(blankDs("NCC-MIN"));
    SECTIONS.forEach((s, i) => expect(text).toContain(`${i + 1}. ${s}`.toUpperCase()));
    expect(text).toContain("Not recorded");
    expect(text).toContain("Not randomised");
  });

  it("full record renders every repeated entry, habits, and keeps No/Unknown distinct", async () => {
    const { text, pages } = await pdfText(full("NCC-A", "AAA"));
    for (const t of ["screen-AAA", "consent-AAA", "enrol-AAA", "pnotes-AAA", "bed-AAA", "Karnataka-AAA", "Kannada", "ecg-AAA", "cns-AAA", "end-AAA",
      "drug1-AAA", "drug2-AAA", "drug3-AAA", "lab1-AAA", "lab2-AAA", "lab3-AAA", "drpdesc1-AAA", "drpdesc2-AAA", "rec1-AAA", "rec2-AAA", "counsel-AAA",
      "fu15-AAA", "fu30-AAA", "chg-AAA", "adr-AAA", "drpout-AAA", "ia-AAA", "complete-AAA", "Caffeine consumption", "3 cups/day", "Unknown", "Intervention", "-4"])
      expect(text, t).toContain(t);
    expect(text).not.toContain("[object Object]");
    expect(text).not.toContain("SECRET ADDRESS");
    expect(text).not.toContain("9999999999");
    expect(text).toMatch(/Page 1 of \d+/);
    expect(pages).toBeGreaterThan(4);
  });

  it("DN4 renders authorised item wording with the saved YES/NO per question", async () => {
    const ds = blankDs("NCC-DN4");
    ds.assessments = [{ milestone: "baseline", instrument: "DN4", status: "completed",
      responses: { version: "DN4 – India/English – Version of 07 Jul 14 – Mapi", items: [true, false, true, false, true, false, true, false, true, false], total: 5 } }];
    const { text } = await pdfText(ds);
    for (const t of ["Does the pain have one or more of the following characteristics?", "Burning", "Painful cold", "Like jolts of electricity",
      "Tingling", "Pricking", "Numbness", "Itching", "Touch Hypoesthesia", "Pricking Hypoesthesia", "Brushing",
      "Symptom question (patient interview)", "Examination question", "YES", "NO", "5/10"]) expect(text, t).toContain(t);
  });

  it("NePIQoL renders all 42 item texts with the recorded answer label and stored position", async () => {
    const ds = blankDs("NCC-NEP");
    ds.assessments = [{ milestone: "day_15", instrument: "NEPIQOL", status: "completed",
      responses: { items: Array.from({ length: 42 }, (_, i) => (i % 5) + 1), total: 126, subscales: {} } }];
    const { text } = await pdfText(ds);
    // Item wording, not bare numbers, must be printed.
    for (const t of ["Item 1 — Excessive cold makes the pain worse", "Item 12 — I involve myself with people I am close to as much as I used to despite the pain",
      "Item 23 — I get exhausted because of the pain", "Item 42 — I am worse off financially because of the pain", "Itemised answers"]) expect(text, t).toContain(t);
    // Stored position 1 maps to the first listed option, position 5 to the last.
    expect(text).toContain("Strongly agree (1)");
    expect(text).toContain("Strongly disagree (5)");
    expect(text).not.toContain("[object Object]");
  });

  it("two participants never share data", async () => {
    const a = await pdfText(full("NCC-A", "AAA"));
    const b = await pdfText(full("NCC-B", "BBB"));
    expect(a.text).not.toContain("BBB");
    expect(b.text).not.toContain("AAA");
    expect(b.text).toContain("NCC-B");
  });
});

describe("outside-visit documentation in the PDF", () => {
  it("labels a DRP and an interaction with no visit as Outside scheduled visit, never Baseline, and prints DRP free text", async () => {
    const ds = blankDs("NCC-OUT");
    ds.drps = [{ id: "d1", milestone: null, status: "open", problem_type: "manifest", description: "Line one\nLine two", pcne_cause_codes: [], pcne_intervention_codes: [], action_taken: "Dose reviewed #42 (½ tab)" }];
    ds.interactions = [{ milestone: null, drug_a: "Pregabalin", drug_b: "Tramadol" }];
    const { text } = await pdfText(ds);
    expect(text).toContain("DRP-1 — Outside scheduled visit");
    expect(text).toContain("Dose reviewed #42");
    expect((text.match(/Outside scheduled visit/g) ?? []).length).toBe(3);
    expect(text).not.toMatch(/DRP-1 — Baseline/);
  });
});

describe("free-text medication changes in the PDF", () => {
  it("prints a change with no linked medication and all its free text", async () => {
    const ds = blankDs("NCC-MC");
    ds.medicationChanges = [{ milestone: "day_15", medication_id: null, medication_name: "Pregabalin 75 mg (brand X)", new_regimen: "Pregabalin 150 mg BD", researcher_notes: "Line one\nLine two #42" }];
    const { text } = await pdfText(ds);
    expect(text).toContain("Medication change 1");
    expect(text).toContain("Pregabalin 150 mg BD");
    expect(text).toContain("Line two #42");
  });
});
