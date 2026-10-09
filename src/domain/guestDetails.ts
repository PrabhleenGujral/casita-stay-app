export interface GuestDetails {
  name: string;
  email: string;
  guests: number;
}

export type GuestDetailsErrors = Partial<Record<keyof GuestDetails, string>>;

// email pattern check
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateGuestDetails(
  values: GuestDetails,
  maxGuests: number
): GuestDetailsErrors {
  const errors: GuestDetailsErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();

  if (!name) errors.name = "Enter your full name.";
  else if (name.length < 2) errors.name = "Name must be at least 2 characters.";

  if (!email) errors.email = "Enter your email address.";
  else if (!EMAIL_PATTERN.test(email))
    errors.email = "Enter an email like name@example.com.";

  if (!Number.isInteger(values.guests) || values.guests < 1) {
    errors.guests = "At least one guest is required.";
  } else if (values.guests > maxGuests) {
    errors.guests = `This home fits up to ${maxGuests} guests.`;
  }

  return errors;
}
