# PDF Export Completeness Audit — Clinical Research Participant Record

Data path: Research Access form → `public.*` tables → `generateStudyReport` (`src/lib/report.functions.ts`; signed-in + `is_research_staff`, every query `.eq("participant_id", pid)` through the caller's RLS client) → `buildReportBlocks` (`src/lib/report-model.ts`, pure mapping) → `renderReport` (`src/lib/pdf-report.ts`, pdf-lib, A4, selectable text) → base64 download. Read-only; one `audit_events` row written. Nothing is stored or published at a URL.

Status key: OK = included and correctly mapped · FIXED = defect found in this audit and corrected · EXCL = intentionally excluded (privacy) · DER = derived · INV = needs investigation.

## Defects found in the previous PDF
| # | Defect | Fix |
|---|---|---|
| D1 | `demographics.state` and `.preferred_language` exist on the form and were queried by the PDF and Excel export, but the columns were **missing from the database** — the PDF query failed outright and Demographics saves containing those fields failed. | Additive migration `0022` adds both nullable text columns (no data changed). |
| D2 | Lifestyle habits rendered as `nicotine: [object Object]`. | Per-habit table: Answer (Yes / No / Unknown / Not recorded) + details. Unselected never shown as No. |
| D3 | Systemic examination (nested JSON) rendered as a raw `key: value` dump; nested objects broke. | One labelled row per examination system from the form's `EXAM_SYSTEMS`, plus any extra saved keys. |
| D4 | Fields saved but not in the PDF: `bed_number`, `caregiver_ecg_notes`, participant `notes`, `day_15_opened_at`, clinical `updated_at`, override `reason`, ADR linked medication, `is_test_record` marker. | All added. |
| D5 | Assessments with instruments other than NRS/DN4/NePIQoL were silently dropped. | Rendered generically under their visit. |
| D6 | Section order (20 ad-hoc sections) did not match the 14 participant tabs; baseline and follow-up measurements were mixed. | Restructured into the exact 14-section order; NRS/DN4/NePIQoL shown under Baseline, Day 15 and Day 30 separately. |
| D7 | DRP follow-up PCNE outcome shown as a bare code; `human()` turned blank strings / `false` inconsistently. | Code + catalogue label; one missing-value convention. |
| D8 | Booleans `null` shown via generic formatter. | `yn()`: true → Yes, false → No, absent → Not recorded. |

## Field matrix
| Field / data group | Research Access location | Persisted source | In PDF? | PDF location | Transformation / exclusion | Test |
|---|---|---|---|---|---|---|
| Study ID, site, status, lifecycle | header / Enrolment | participants | OK | Cover, §3, every page header | — | passed |
| Screening date, eligibility, inclusion, exclusion, notes, created | Screening | participants | OK | §1 | yn() for booleans | passed |
| Consent status, date, confirmed, notes | Consent | participants | OK | §2 | — | passed |
| Enrolment confirmed, date, notes, general notes | Enrolment | participants | FIXED (notes) | §3 | — | passed |
| Age, sex, height, weight | Demographics | demographics | OK | §4 | units added | passed |
| BMI | Demographics | height_cm, weight_kg | DER | §4 | weight ÷ (height/100)², 1 dp; Not recorded if either blank | passed |
| IP/OP no., patient type, ward, bed, admission/discharge | Demographics | demographics | FIXED (bed) | §4 | — | passed |
| City, district, state, language, education, occupation, residence, SES | Demographics | demographics | FIXED (state, language — D1) | §4 | — | passed |
| Contact number, alt contact, address, postal code, caregiver contact | Demographics | demographics | EXCL | — | Existing report privacy rule; stated on cover | passed (absence asserted) |
| Caregiver name, relationship, height, weight, BMI, BP, ECG notes | Demographics | demographics | FIXED (ECG) | §4 | caregiver BMI derived | passed |
| Lifestyle habits ×5 (answer + details) | Demographics | demographics.habits | FIXED (D2) | §4 table | — | passed |
| Diagnoses, neurologist, pain site/distribution/duration/onset, histories, comorbidities, allergies, lifestyle notes | Clinical Data | clinical_data | OK | §5 | arrays joined | passed |
| Vitals (BP, pulse, temp, RR, SpO2) | Clinical Data | clinical_data | OK | §5 | units added | — |
| Examination by system | Clinical Data | clinical_data.examination | FIXED (D3) | §5 | — | passed |
| Clinical notes, recorded/updated | Clinical Data | clinical_data | OK | §5 | long text wraps | passed |
| Lab investigations (all rows) | Laboratory | laboratory_investigations | OK | §6 table | no normal/abnormal inference | passed (3 rows) |
| NRS / DN4 / NePIQoL per visit | Baseline, Day 15, Day 30 | assessments.responses | FIXED (D6) | §7, §12, §13 | stored scores only, never recalculated | passed |
| Other instruments | any visit | assessments | FIXED (D5) | visit section | — | — |
| Medications (all rows, 15 fields) | Medication Review | medications | OK | §8 two tables | refs M1… | passed (3 rows) |
| Drug interactions | Medication Review | drug_interactions | OK | §8 two tables | refs I1… | passed |
| Medication changes | Medication Review | medication_changes | OK | §8 | — | passed |
| ADRs | Medication Review | adr_reports | FIXED (med link) | §8 | — | passed |
| DRPs with full PCNE P/C/I/A/O, description, status, resolution | DRPs | drps | OK | §9 one block per DRP | code + catalogue label | passed (2 DRPs) |
| DRP visit outcomes | DRPs / Day 15 / Day 30 | drp_visit_outcomes | FIXED (D7) | §9 | — | passed |
| Randomisation status, date, current/original group, method | Randomisation | participants, randomizations | OK | Cover, §10 | read-only | passed |
| Allocation corrections + reason | Randomisation | allocation_overrides | FIXED (reason) | §10 | — | — |
| Counselling sessions + 5-topic covered / teach-back | Intervention | counselling_sessions | OK | §11 | legacy boolean → covered only, teach-back Not recorded | passed |
| Physician communications (all) | Intervention | physician_recommendations | OK | §11 | scoped to this participant's DRPs | passed (2 rows) |
| Visit status, due, started, completed, Day 15 window opened | Day 15 / Day 30 | participant_milestones, participants | FIXED (window) | §12, §13 | — | passed |
| Follow-up record (13 fields) | Day 15 / Day 30 | follow_ups | OK | §12, §13 | per visit, no carry-forward | passed |
| Outcome change NRS / DN4 / NePIQoL | Outcomes | assessments | DER | §14 table + NRS chart | follow-up − baseline; "Insufficient data" if either missing | passed (−4) |
| DRP resolution / physician acceptance rates | Outcomes | — | INV | §14 | No approved formula exists → shown as PENDING PROTOCOL CONFIRMATION | — |
| Completion, non-completion reason, last contact, completion notes | Outcomes | participants | OK | Cover, §14 | — | passed |
| Synthetic test flag | — | participants.is_test_record | FIXED | Cover | labelled "SYNTHETIC TEST RECORD" | — |
| Internal IDs, user IDs, tokens | — | — | EXCL | — | never selected into the PDF | passed |

## Design
A4 portrait; deep-teal brand line, title "Clinical Research Participant Record", Study ID on cover and every page header; footer with confidentiality line, generation time and "Page X of Y" (computed after layout). Numbered section rules, zebra field-value rows, light-grey table headers repeated on page breaks, amber notices for pending-protocol items only. Fully selectable text (no images).

## Tests (`src/lib/report-model.test.ts`, `src/lib/pdf-report.test.ts`)
Fixtures are synthetic. The completeness test renders the real PDF and extracts text with `pdftotext`, so it checks what is actually printed: all 14 section headings (minimal record), every repeated entry with a unique marker, habits incl. Yes/No/Unknown, long notes, Unicode punctuation, privacy exclusions absent, page numbering, multi-page (11 pages), and two participants with no cross-over. Sparse (5 pages) and full (11 pages) reports were rendered and visually inspected.

## Known limitations
- Standard PDF fonts cover Western characters only; non-Latin scripts (e.g. Kannada, Devanagari) and emoji print as "?". Embedding a Unicode font would need a bundled font file; not yet done.
- No official NeuroCare / college / university logo is available (only placeholders in `src/assets`), so a text brand treatment is used.
- An end-to-end download from a real participant was not tested in this pass because the study database has no participant records with full data.

## Revision — reference-style redesign (11 Oct 2026)

Design now follows the approved two-page reference report (A4, 46 pt margins, Helvetica; colours and sizes read from the reference file itself):
blue 84 pt title band on page 1, uppercase blue section headings over a thin rule, bold slate labels with dark values,
a two-column summary grid, tinted itemised DN4 rows with YES/NO on the right, rounded score panels (NRS, DN4, NePIQoL per visit),
and a small grey footer with brand, study ID, confidentiality wording and "Page X of Y". No reference patient data or recommendations were copied.

| Field / area | Before | Fix | Verified |
|---|---|---|---|
| Day 15 / Day 30 / Baseline visit status | Could read "Completed" from the visit-progress row even when the participant's visit was refused completion (NCC-0006) | Status and date now come from the participant record; completion functions now save the participant first, then the progress row; NCC-0006's stale Day 15 row corrected to "in progress" | NCC-0006 PDF shows Day 15 "In progress" |
| DN4 item answers | One 10-column row | Itemised list, YES/NO per item (item wording still withheld pending authorisation) | All 5 PDFs |
| NRS / DN4 / NePIQoL totals | Plain rows | Score panels labelled by visit; DN4 text uses the app's existing cut-off (>= 4) only | All 5 PDFs |
| NePIQoL item answers | 10-column grid with repeated headers | Compact rows "Items 1–10 … 41–42" | All 5 PDFs |
| Non-Latin text | Printed as "????" | One "[non-Latin text]" marker per run; note on page 1 | NCC-0005 (Marathi) |
| Synthetic marker | Row in summary only | Banner on page 1 plus marker at the top of every later page | All 5 PDFs |
| Lab categories | "Ecg", "Xray" | ECG, X-ray, CT/USG, MRI, Culture & sensitivity | NCC-0003, NCC-0005 |

## Revision — itemised questionnaire content (11 Oct 2026)

DN4 and NePIQoL now print full item wording from the in-app instrument catalogue next to every saved answer; see `docs/pdf-questionnaire-content-audit.md` for sources, mapping status and dispositions of the remaining audit areas.

| Area | Before | Fix | Verified |
|---|---|---|---|
| DN4 items | "DN4 item n (question q)" without wording | Full question wording per question (symptom vs examination labelled), items numbered 1.1–4.1 with saved YES/NO | All 5 PDFs + test |
| NePIQoL items | Compact "Q1: x" position rows | All 42 item texts, answer label of the stored position + position in brackets, grouped by the five sections; provisional-mapping notice kept | All 5 PDFs + test |
| Report length | 8–11 pages | 9–15 pages (all 52 items printed); page numbering recalculated automatically | pdfinfo per report |
