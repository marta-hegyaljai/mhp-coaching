import {describe, expect, it} from "vitest";

import {statementStatusTone} from "./statement-status";

describe("statementStatusTone", () => {
  it("marks paid as healthy, failed as stopped and open as attention", () => {
    expect(statementStatusTone("PAID")).toBe("ok");
    expect(statementStatusTone("PAYMENT_FAILED")).toBe("stop");
    expect(statementStatusTone("OPEN")).toBe("gold");
    expect(statementStatusTone("FINALIZED")).toBe("gold");
    expect(statementStatusTone("PAYMENT_PENDING")).toBe("gold");
  });
});
