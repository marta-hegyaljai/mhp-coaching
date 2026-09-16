import {describe, expect, it} from "vitest";

import {catalogueGroupHasOfferings} from "./catalogue-groups";

describe("catalogueGroupHasOfferings", () => {
  it("hides a category with no published modules or programmes", () => {
    expect(
      catalogueGroupHasOfferings({category: "workshop", courses: []}, []),
    ).toBe(false);
  });

  it("keeps a category that still has a published module", () => {
    expect(
      catalogueGroupHasOfferings({category: "workshop", courses: [{}]}, []),
    ).toBe(true);
  });

  it("keeps a category that only still has a programme", () => {
    expect(
      catalogueGroupHasOfferings(
        {category: "advanced", courses: []},
        [{category: "advanced"}],
      ),
    ).toBe(true);
  });
});
