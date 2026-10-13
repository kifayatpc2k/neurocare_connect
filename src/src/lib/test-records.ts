/**
 * Test-data boundary. Participants registered with `is_test_record = true`
 * are synthetic QA records and must never reach official study reporting
 * unless the caller explicitly selects a development dataset. Every child
 * row is kept only when its participant is in the chosen dataset.
 *
 * - "study": genuine participants only (official reporting default)
 * - "test": synthetic development records only
 * - "all": both, for development views that exercise the full workflow
 */
export type Dataset = "study" | "test" | "all";

export const TEST_RECORD_LABEL = "TEST DATA — NOT A REAL PARTICIPANT";

type Row = Record<string, unknown>;

export function splitByDataset<P extends Row, T extends Record<string, Row[]>>(
  participants: P[],
  children: T,
  dataset: Dataset = "study",
): { participants: P[]; children: T; excludedCount: number } {
  const kept =
    dataset === "all"
      ? participants
      : participants.filter((p) => Boolean(p["is_test_record"]) === (dataset === "test"));
  const ids = new Set(kept.map((p) => p["id"] as string));
  const out = {} as T;
  for (const key of Object.keys(children) as (keyof T)[]) {
    out[key] = children[key]!.filter((r) => ids.has(r["participant_id"] as string)) as T[keyof T];
  }
  return { participants: kept, children: out, excludedCount: participants.length - kept.length };
}
