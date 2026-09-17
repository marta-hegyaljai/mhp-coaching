import {describe, expect, it} from "vitest";

import {enrolmentStatusTone} from "./enrolment-status-labels";

describe("enrolmentStatusTone", () => {
  it("marks paid as healthy, pending as attention and failed as stopped", () => {
    expect(enrolmentStatusTone("PAID")).toBe("ok");
    expect(enrolmentStatusTone("PENDING")).toBe("gold");
    expect(enrolmentStatusTone("LEAD")).toBe("gold");
    expect(enrolmentStatusTone("REFUNDED")).toBe("gold");
    expect(enrolmentStatusTone("FAILED")).toBe("stop");
    expect(enrolmentStatusTone("CANCELLED")).toBe("stop");
  });
});
