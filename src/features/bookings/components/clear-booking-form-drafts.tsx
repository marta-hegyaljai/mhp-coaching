"use client";

import {useEffect} from "react";

import {clearAllBookingFormDrafts} from "@/features/bookings/form-draft";

export function ClearBookingFormDrafts() {
  useEffect(() => {
    clearAllBookingFormDrafts();
  }, []);

  return null;
}
