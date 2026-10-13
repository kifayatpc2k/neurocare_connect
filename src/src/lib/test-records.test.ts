import { describe, expect, it } from "vitest";
import { splitByDataset } from "./test-records";

const participants = [
  { id: "real-1", is_test_record: false },
  { id: "test-1", is_test_record: true },
  { id: "test-2", is_test_record: true },
];
const children = {
  drps: [
    { participant_id: "real-1" },
    { participant_id: "test-1" },
    { participant_id: "test-2" },
  ],
};

describe("splitByDataset", () => {
  it("study dataset excludes test participants and their child rows", () => {
    const r = splitByDataset(participants, children);
    expect(r.participants.map((p) => p["id"])).toEqual(["real-1"]);
    expect(r.children.drps).toEqual([{ participant_id: "real-1" }]);
    expect(r.excludedCount).toBe(2);
  });

  it("test dataset contains only test participants and their child rows", () => {
    const r = splitByDataset(participants, children, "test");
    expect(r.participants.map((p) => p["id"])).toEqual(["test-1", "test-2"]);
    expect(r.children.drps).toHaveLength(2);
    expect(r.excludedCount).toBe(1);
  });

  it("all dataset keeps every participant and child row", () => {
    const r = splitByDataset(participants, children, "all");
    expect(r.participants).toHaveLength(3);
    expect(r.children.drps).toHaveLength(3);
    expect(r.excludedCount).toBe(0);
  });
});
