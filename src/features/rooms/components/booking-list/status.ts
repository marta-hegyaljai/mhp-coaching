import type {RoomBookingStatus} from "@/db/schema";
import {statusToneClass, type StatusTone} from "@/shared/ui/status-label";

export function bookingStatusTone(status: RoomBookingStatus): StatusTone {
  return status === "CANCELLED" ? "stop" : "ok";
}

/** 3px rail colour. Never a filled surface. */
export function bookingStatusRailClass(status: RoomBookingStatus): string {
  return bookingStatusTone(status) === "stop" ? "border-l-status-stop" : "border-l-status-ok";
}

export function bookingStatusTextClass(status: RoomBookingStatus): string {
  return statusToneClass[bookingStatusTone(status)];
}
