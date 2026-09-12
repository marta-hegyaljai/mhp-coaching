import {describe, expect, it} from "vitest";

import {authorizeCronRequest} from "@/lib/cron-auth";

describe("cron authorization", () => {
  it("accepts only the configured bearer secret", () => {
    const env = {CRON_SECRET: "room-cron-secret"};
    expect(
      authorizeCronRequest(new Request("http://localhost/api/cron/rooms"), env),
    ).toBe(false);
    expect(
      authorizeCronRequest(
        new Request("http://localhost/api/cron/rooms", {
          headers: {authorization: "Bearer room-cron-secret"},
        }),
        env,
      ),
    ).toBe(true);
    expect(
      authorizeCronRequest(
        new Request("http://localhost/api/cron/rooms", {
          headers: {authorization: "Bearer other-secret"},
        }),
        env,
      ),
    ).toBe(false);
    expect(
      authorizeCronRequest(
        new Request("http://localhost/api/cron/rooms", {
          headers: {authorization: "Bearer room-cron-secret"},
        }),
        {},
      ),
    ).toBe(false);
  });
});
