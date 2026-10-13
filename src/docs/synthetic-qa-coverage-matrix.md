# Synthetic QA — coverage matrix (batch NCC-QA-PREDEPLOY-001)

Five synthetic participants were created **through the app's own server functions** while signed
in as the research team account (same validation, permission and lifecycle checks the forms use;
no direct database inserts). All are `is_test_record = true` and labelled in the app and PDF.

| QA record | Code | Allocation (random) | Purpose | Final state |
|---|---|---|---|---|
| A — baseline-heavy, straightforward | NCC-0002 | Control | full happy path | Day 30 completed |
| B — complex medical history | NCC-0003 | Intervention | many comorbidities, 7 labs, multiple meds/DRPs/interactions, counselling, recommendations | Day 30 completed |
| C — intervention / DRP focus | NCC-0004 | Intervention | DRP lifecycle across visits, accepted / not-accepted recommendations, visit outcomes | Day 30 completed |
| D — edge cases | NCC-0005 | Control | max-length text, Unicode (Kannada/Hindi), "unknown" answers, blank optionals, boundary vitals/NRS 0 and 10 | Day 30 completed |
| E — partial / incomplete | NCC-0006 | Control | Day 15 opened but NePIQoL missing | Day 15 open, Day 30 not started |

Allocation was not forced; the 2:3 split is what the random allocator produced.

Legend: **P** pass · **B** expected block (safeguard worked) · **L** known limitation · **N** not supported by the app.

## Workflow

| Area | A | B | C | D | E | Notes |
|---|---|---|---|---|---|---|
| Register (auto code, test flag) | P | P | P | P | P | flag cannot be switched on later |
| Screening / eligibility / consent / enrolment | P | P | P | P | P | |
| Demographics incl. 5 habits, caregiver | P | P | P | P | P | D: Unicode + "unknown" + blank details |
| Clinical history, vitals, 9 exam systems | P | P | P | P | P | D: boundary vitals accepted, out-of-range rejected (B) |
| Medications (all categories, current/stopped) | P | P | P | P | P | |
| Laboratory investigations | P | P | P | P | P | B: 7 rows incl. ECG / X-ray free text |
| Drug interactions | – | P | P | – | – | |
| DRPs (PCNE V9.1 problem/causes/interventions/acceptance/outcome) | P | P | P | P | – | invalid PCNE codes rejected (B) |
| NRS, DN4, NePIQoL baseline | P | P | P | P | P | scores computed by database |
| Baseline completion → randomisation | P | P | P | P | P | |
| Edit baseline after close | B | B | – | – | – | immutable visit guard |
| Counselling (intervention only) | – | P | P | B | – | control participant refused |
| Physician recommendations (intervention only) | – | P | P | – | – | accepted + not accepted |
| Day 15 follow-up, ADRs, medication changes, DRP visit outcomes | P | P | P | P | P | |
| Day 15 completion | P | P | P | P | **B** | E refused: NePIQoL missing |
| Day 30 follow-up & completion | P | P | P | P | **B** | E refused: Day 15 incomplete |
| Study completion details / non-completion reason | P | P | P | P | P | |
| Baseline follow-up record | B | B | B | B | B | not a study form — now refused by the server |

Run total: 301 operations, 299 succeeded; the 2 failures are the intended E safeguards above.

## Outputs

| Output | Result |
|---|---|
| PDF report per participant | 5/5 generated; 14 sections each; only that participant's code; 9–13 pages; "SYNTHETIC TEST RECORD" banner |
| PDF value check (database vs extracted text) | every stored value present, except intentional privacy exclusions (contact numbers, address, postal code, caregiver contact) and the limitation below |
| Analytics — study dataset | 1 enrolled (genuine NCC-0001), 0 randomised, **5 test records excluded** |
| Analytics — all dataset | 6 enrolled, 5 randomised (3 control / 2 intervention), 6 DRPs |
| Excel export — study | 24 sheets, **0** cells containing a QA code; NCC-0001 present |
| Excel export — test only | 24 sheets, 144 cells with QA codes; NCC-0001 absent |
| Cleanup | see `synthetic-qa-cleanup.md` (dry run, decoy, wrong confirmation, executed once and verified) |

## Defects found and fixed during this QA

1. Cleanup failed on completed assessments (delete order) → fixed in the cleanup function.
2. Server accepted a "baseline" follow-up that no form or report shows → server now allows Day 15 / Day 30 only; 5 stray QA rows removed.
3. PDF lab table broke words ("Not recorde d") and showed "Ecg"/"Xray" → columns rebalanced, proper names (ECG, X-ray, CT/USG, MRI …).
4. Habit details without an answer failed to save (earlier turn) → fixed.

## Known limitations (not fixed)

- **L** PDF uses a standard font: Kannada, Hindi, Marathi, Urdu text and emoji print as `?` (stored correctly in database and Excel).
- **L** DN4 item wording and NePIQoL answer labels are pending approval; reports show item numbers / positions 1–5.
- **N** No fields for: participant name, consent form version/time, BMI (not calculated), per-medicine missed doses (recorded per visit), DRP "addressed" status (only open/resolved).
- Testing called the same server functions the forms use; it did not click through every on-screen control, so purely visual behaviour (e.g. fields that show/hide on an answer) was not exhaustively click-tested.

## Safeguards confirmed (each rejected as expected)

Consent before eligibility · consent while not eligible · consent without date · consent without confirmation tick ·
enrol before screening · enrol without confirmation · screening edit after consent · randomise before enrolment ·
second randomisation · Day 15 open before randomisation · Day 15 data before opening · Day 15 data after completion ·
Day 30 completion before Day 15 · DN4 overwrite after completion · edit baseline DRP after baseline locked ·
invented PCNE code (P9.9) · NRS 11 · SpO2 120 · age 200 · medication with empty name ·
counselling for a control participant · non-completion reason when both follow-ups are done · baseline follow-up record.
