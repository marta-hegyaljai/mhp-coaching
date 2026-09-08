import {describe, expect, it} from "vitest";

import de from "../../messages/de.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

type MessageTree = {[key: string]: string | MessageTree};

function flattenKeys(tree: MessageTree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    return typeof value === "string" ? [path] : flattenKeys(value, path);
  });
}

describe("message catalogues", () => {
  it("expose the same keys in French, German and English", () => {
    const reference = flattenKeys(fr as MessageTree).sort();

    expect(flattenKeys(de as MessageTree).sort()).toEqual(reference);
    expect(flattenKeys(en as MessageTree).sort()).toEqual(reference);
  });

  it("never ship an empty string", () => {
    for (const catalogue of [fr, de, en] as MessageTree[]) {
      for (const key of flattenKeys(catalogue)) {
        const value = key
          .split(".")
          .reduce<string | MessageTree>(
            (node, part) => (node as MessageTree)[part],
            catalogue,
          );

        expect(String(value).trim(), key).not.toBe("");
      }
    }
  });
});
