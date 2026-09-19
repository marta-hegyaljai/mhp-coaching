import {describe, expect, it} from "vitest";

import {parseAdminMessageChannel} from "./admin-message";

describe("parseAdminMessageChannel", () => {
  it("defaults to the course-question inbox", () => {
    expect(parseAdminMessageChannel(undefined)).toBe("course");
    expect(parseAdminMessageChannel("course")).toBe("course");
    expect(parseAdminMessageChannel(["nope"])).toBe("course");
  });

  it("reads the contact-form channel from the query", () => {
    expect(parseAdminMessageChannel("contact")).toBe("contact");
    expect(parseAdminMessageChannel(["contact", "course"])).toBe("contact");
  });

  it("reads the other-payment-method lead channel", () => {
    expect(parseAdminMessageChannel("lead")).toBe("lead");
    expect(parseAdminMessageChannel(["lead"])).toBe("lead");
  });
});
