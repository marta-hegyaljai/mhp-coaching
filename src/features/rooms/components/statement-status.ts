import type {RoomStatementStatus} from "@/db/schema";
import type {StatusTone} from "@/shared/ui/status-label";

export function statementStatusTone(status: RoomStatementStatus): StatusTone {
  if (status === "PAID") {
    return "ok";
  }
  if (status === "PAYMENT_FAILED") {
    return "stop";
  }
  return "gold";
}
