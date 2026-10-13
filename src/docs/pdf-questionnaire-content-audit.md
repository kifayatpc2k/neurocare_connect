# PDF Questionnaire Content Audit — DN4 & NePIQoL (11 Oct 2026)

Scope: participant PDF report (`src/lib/report-model.ts` → `src/lib/pdf-report.ts`).
Instrument content source: `src/lib/instruments.ts` — the single in-app catalogue the
data-entry forms render. External reproduction authorisation remains
`CONTENT_SOURCE_AVAILABLE — PENDING AUTHORIZATION/APPROVAL`; the PDF states this on the
Baseline instrument notice and in "Pending protocol items".

## DN4 (India/English, Version of 07 Jul 14 – Mapi)

- Wording source: `DN4_QUESTIONS` in `src/lib/instruments.ts` (4 questions, 10 items) —
  the same wording the research form shows. Verified item-for-item against that source.
- Presentation: per visit, each question prints its full wording with its kind
  (Questions 1–2 = "Symptom question (patient interview)", 3–4 = "Examination question"),
  followed by itemised rows numbered `q.i` (1.1–4.1) matching the questionnaire order,
  with the saved answer YES / NO / Not recorded. Saved response order is preserved
  (items are consumed in questionnaire order).
- Score: stored total shown as `n/10` with the existing cut-off wording (≥ 4 suggests
  neuropathic pain); scoring itself stays in the database (`score_dn4`) — never
  recalculated in the PDF. Version, conducted date and status are shown per assessment.
- Outstanding: external reproduction authorisation for the copyrighted wording.

## NePIQoL (42-item, version as supplied to the project)

- Wording source: `NEPIQOL_SECTIONS` / `NEPIQOL_ITEMS` in `src/lib/instruments.ts`
  (5 sections, 42 items) — the same wording the form shows.
- Presentation: per visit, a score panel (stored total, range 42–210, provisional
  notice), the six subscale totals with their maxima, then "Itemised answers (all 42
  items)": one row per item — `Item n — <item text>` with the recorded answer as
  `<label> (<stored position 1–5>)`, grouped under the five section titles.
- Response mapping: NOT verified. The source lists two response formats (agreement /
  frequency) without saying which items use which. Until an approved mapping is
  supplied, every item displays the agreement-scale label of the stored position and
  the report carries `PROVISIONAL — WAITING FOR APPROVED RESPONSE-OPTION MAPPING`.
  The stored position (1–5) is always printed alongside the label, so the display can
  never misstate what was saved. Answers are never reverse-scored for display;
  reverse items (12, 15, 33, 34) affect only the stored score, computed by
  `score_nepiqol` in the database.
- Outstanding: approved item-to-response-format mapping; external reproduction
  authorisation.

## Remaining audit areas — dispositions

| Area | Disposition |
|---|---|
| Non-Latin clinical text | pdf-lib embeds Unicode TTFs but performs **no text shaping** (no HarfBuzz): Devanagari/Kannada conjuncts and Urdu right-to-left shaping would render incorrectly even with an embedded font. Printing wrong glyphs is worse than a clear marker, so the `[non-Latin text]` marker is retained, explained on page 1; full values are in the Excel export. Standard labels stay English regardless of preferred language. |
| Participant name | Genuinely unimplemented — the schema stores no participant name (privacy by design; Study ID is the identifier). Not added; would need a protocol/privacy decision. |
| Consent form version | Genuinely unimplemented — no field exists. Not invented. |
| BMI | Already derived (weight ÷ height², 1 dp) for participant and caregiver; shown only when both inputs are present and valid. |
| "Addressed" DRP status | Not added. Current statuses are open/resolved etc.; whether "Addressed" differs from "Resolved" is a protocol decision — documented here as unresolved. |
| DRP resolution rate / physician acceptance rate | No approved numerator/denominator definitions exist (unique DRPs vs repeated communications, pending responses). Shown as `PENDING PROTOCOL CONFIRMATION`; no formula invented. |
| Signature line | The app holds no verified signature data; no signature, clinician name or seal is fabricated. The "Report information" block (generated-at, source) is the non-misleading equivalent. |
| Conditional UI behaviour | Checked the lifestyle-habits control: the details field appears only when the answer is Yes, and switching the answer away from Yes keeps the saved details in state (they are not silently discarded; the PDF prints them regardless of the current answer). Examination fields are always visible with "blank = not examined". Not exhaustively click-tested: every conditional combination in the DRP, follow-up and medication forms. |

## Verification (11 Oct 2026)

- All five synthetic QA reports regenerated (NCC-0002…NCC-0006): 13, 14, 15, 14 and 9
  pages (longer than before because all 52 questionnaire items now print with wording).
- Automated text checks per report: DN4 question wording + all 10 item labels present;
  all 42 NePIQoL item texts present; stored positions and labels printed; synthetic
  banner on every page; only the report's own Study ID appears; no `?` replacement
  characters (the only `?` are legitimate punctuation in question wording and one in
  recorded data); non-Latin markers present where expected (NCC-0005 Marathi, NCC-0006 Urdu).
- Visual inspection of rendered pages (NCC-0004): reference design preserved — blue
  title band, uppercase blue section headings with rules, tinted item rows with
  right-aligned answers, rounded score panels, footer with Page X of Y.
- Tests: `src/lib/report-model.test.ts` gained two assertions-backed tests — DN4 wording
  with saved YES/NO, and all 42 NePIQoL item texts with label+position mapping
  (position 1 → first listed option, position 5 → last). Full suite: 110 tests pass;
  `tsgo --noEmit` clean.
- NCC-0001 untouched; synthetic records remain excluded from dashboard totals and the
  official export; the test-only export contains only the synthetic records.
