export function formatEnrolmentAddress(booking: {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}) {
  const locality = [booking.postalCode, booking.city].filter(Boolean).join(" ").trim();
  return [booking.street, locality, booking.country].filter(Boolean).join(", ");
}
