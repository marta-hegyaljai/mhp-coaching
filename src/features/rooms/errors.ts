export type RoomErrorCode =
  | "forbidden"
  | "notFound"
  | "invalidName"
  | "invalidDescription"
  | "invalidPrice"
  | "invalidRules"
  | "invalidHours"
  | "invalidTime"
  | "ambiguousTime"
  | "invalidRange"
  | "invalidReason"
  | "blockConflict"
  | "blockOverlap"
  | "disabledRoom"
  | "slotConflict"
  | "slotUnavailable"
  | "invalidDuration"
  | "invalidIncrement"
  | "tooSoon"
  | "tooFar"
  | "closedHours"
  | "blocked"
  | "alreadyCancelled"
  | "tooLateToChange"
  | "notCancellable"
  | "notWaivable"
  | "invalidUser"
  | "noteKeyMissing"
  | "noteKeyInvalid"
  | "noteDecryptFailed"
  | "invalidNote"
  | "invalidMessage"
  | "invalidAdminNote"
  | "slotAvailable"
  | "alreadyResolved"
  | "notOpen"
  | "invalidDiscount"
  | "invalidMonth"
  | "monthStillOpen"
  | "statementLocked"
  | "invalidAdjustment"
  | "paymentSetupFailed"
  | "paymentMethodRequired"
  | "statementNotChargeable"
  | "alreadyCharging";

export type RoomBookingConflict = {
  bookingId: string;
  roomId: string;
  startsAt: string;
  endsAt: string;
};

export class RoomError extends Error {
  constructor(
    readonly code: RoomErrorCode,
    readonly conflicts: RoomBookingConflict[] = [],
  ) {
    super(code);
    this.name = "RoomError";
  }
}
