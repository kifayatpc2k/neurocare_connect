import { describe, expect, it } from "vitest";
import { catalogue, filterMedicines } from "./medicine-catalogue";

const c = catalogue!;
const f = (q: string, cat: string | null = null) => filterMedicines(c.medicines, c.categories, q, cat).map((m) => m.id);

describe("medicine catalogue", () => {
  it("loads all 20 medicines", () => expect(c.medicines).toHaveLength(20));
  it("keeps every entry pending clinical review", () =>
    expect(c.medicines.every((m) => m.contentReview.reviewStatus === "pending")).toBe(true));
  it("search is case-insensitive and partial", () => expect(f("PREGAB")).toEqual(["pregabalin"]));
  it("search by keyword finds metformin", () => expect(f("metformin")).toContain("metformin"));
  it("combines search with category", () => expect(f("pregabalin", "diabetes")).toEqual([]));
  it("unknown medicine returns nothing", () => expect(f("zzzunknown")).toEqual([]));
});
