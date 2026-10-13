# Synthetic QA batch — cleanup procedure

Batch: **NCC-QA-PREDEPLOY-001** · participants NCC-0002 … NCC-0006 (QA Participants A–E).

## How the batch is marked

Every QA participant carries both markers; cleanup requires **both**:

1. `participants.is_test_record = true` — set only at registration; the
   `participants_lock_test_flag` trigger stops it from ever being switched on later,
   so a genuine participant can never become a cleanup target.
2. `participants.notes` contains `SYNTHETIC_QA | batch NCC-QA-PREDEPLOY-001`.

Record IDs that merely look like test IDs are never used to pick targets.

## The cleanup function

`public.qa_cleanup_synthetic_batch(p_batch text, p_execute boolean default false, p_confirm text default null)`

- Callable only by the backend operator (EXECUTE revoked from `anon`/`authenticated`;
  no app screen or researcher can run it).
- The batch ID must match `^NCC-QA-[A-Z0-9-]+$`.
- **Dry run (default)** returns the number of participants and of every linked record type
  (demographics, clinical, medications, labs, interactions, DRPs, DRP visit outcomes,
  recommendations, counselling, ADRs, medication changes, follow-ups, assessments,
  milestones, randomisations, allocation overrides) plus the exact confirmation text.
- **Execute** requires `p_execute = true` **and** `p_confirm` equal to
  `DELETE <batch> (<n> participants)`. Anything else is refused.
- Refuses if any participant in the batch has an allocation override (those are immutable).
- Deletes assessments first (the completed-assessment lock allows deletion only inside this
  function and only for `is_test_record` participants), then the participants; every other
  child table cascades.
- Writes one `audit_events` row (`action = synthetic_qa_cleanup`) holding the batch ID and
  counts only — no clinical data.
- Never truncates tables and never touches schema, settings, accounts or non-QA records.

## Steps

```sql
-- 1. Preview (changes nothing)
select public.qa_cleanup_synthetic_batch('NCC-QA-PREDEPLOY-001');
-- 2. Only after the QA lead approves, using the confirmation text returned by step 1
select public.qa_cleanup_synthetic_batch('NCC-QA-PREDEPLOY-001', true, 'DELETE NCC-QA-PREDEPLOY-001 (5 participants)');
-- 3. Verify
select count(*) from public.participants where is_test_record;           -- expect 0
select metadata from public.audit_events where action = 'synthetic_qa_cleanup' order by created_at desc limit 1;
```

## Verification already performed (11 Oct 2026)

| Check | Result |
|---|---|
| Dry run lists counts and changes nothing | passed |
| Decoy: a non-test participant whose notes contain the batch tag (inserted, then rolled back) | **not** targeted — still 5 participants |
| Wrong confirmation text | refused |
| Malformed batch ID | refused |
| Execute on a first-attempt QA batch (5 participants, 32 assessments, 5 randomisations …) | all removed; genuine NCC-0001 kept; audit row written |
| Defect found: cascade order tripped the assessment lock | fixed (assessments deleted first), retested |

Note: test participants used numbers from the shared allocation counter. Allocation is CSPRNG
coin-flip per participant (not a pre-generated list), so this leaves gaps in the counter
but does not change any real participant's allocation.

The current batch (NCC-0002 … NCC-0006) is **retained** until cleanup is explicitly approved.
