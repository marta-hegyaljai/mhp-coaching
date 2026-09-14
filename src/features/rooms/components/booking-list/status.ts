import type {RoomBookingStatus} from "@/db/schema";

/** 3px rail + matching status type. Never a filled surface. */
export function bookingStatusRailClass(status: RoomBookingStatus): string {
  return status === "CANCELLED" ? "border-l-status-stop" : "border-l-status-ok";
}

export function bookingStatusTextClass(status: RoomBookingStatus): string {
  return status === "CANCELLED" ? "text-status-stop" : "text-status-ok";
}
