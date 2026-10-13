import type { StudyGroup } from "@/lib/study";

/**
 * Pluggable allocation strategy. Swap `activeAllocator` for an approved
 * block or stratified method if the final protocol requires one.
 */
export type Allocator = {
  method: string;
  allocate: () => StudyGroup;
};

/** Simple computer-generated 1:1 random allocation using a CSPRNG. */
export const simpleRandomAllocator: Allocator = {
  method: "simple random 1:1 (computer-generated, CSPRNG)",
  allocate: () => {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return (buffer[0] ?? 0) % 2 === 0 ? "control" : "intervention";
  },
};

export const activeAllocator: Allocator = simpleRandomAllocator;
