import {afterEach, describe, expect, it, vi} from "vitest";

vi.mock("./transport", () => ({
  sendMail: vi.fn(),
}));

import {sendOpsAlert} from "./ops";
import {sendMail} from "./transport";

const sendMailMock = vi.mocked(sendMail);

describe("ops alert mail", () => {
  const previous = process.env.OPS_ALERT_EMAIL;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.OPS_ALERT_EMAIL;
    } else {
      process.env.OPS_ALERT_EMAIL = previous;
    }
    sendMailMock.mockReset();
  });

  it("does not send when OPS_ALERT_EMAIL is unset", async () => {
    delete process.env.OPS_ALERT_EMAIL;
    await sendOpsAlert({job: "rooms", ranAt: "2026-09-11T00:00:00.000Z", error: "boom"});
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("sends composeTransactionalEmail chrome to the ops mailbox", async () => {
    process.env.OPS_ALERT_EMAIL = "ops@example.test";
    sendMailMock.mockResolvedValue({provider: "smtp", messageId: "1"});
    await sendOpsAlert({job: "rooms", ranAt: "2026-09-11T00:00:00.000Z", error: "boom"});
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const payload = sendMailMock.mock.calls[0]?.[0];
    expect(payload?.to).toBe("ops@example.test");
    expect(payload?.html).toContain('role="presentation"');
    expect(payload?.html).toContain("#c8aa6a");
    expect(payload?.html).not.toContain("patient");
  });
});
