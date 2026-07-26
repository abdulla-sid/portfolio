import { describe, expect, it } from "vitest";
import { CITIES, inBbox } from "./geo";
import { EXPERIENCES } from "./experiences";
import { LABELS } from "./labels";

describe("geo", () => {
  it("keeps all keyed map content inside its committed tile extracts", () => {
    for (const e of EXPERIENCES) {
      expect(inBbox(e.location, CITIES[e.city].bbox), e.id).toBe(true);
    }
    const ids = EXPERIENCES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of LABELS) {
      expect(inBbox(l.location, CITIES[l.city].bbox), l.name).toBe(true);
    }
  });
});
