import type { FormEvent } from "react";
import { useState } from "react";
import type {
  GuestDetails,
  GuestDetailsErrors,
} from "../../domain/guestDetails";
import { validateGuestDetails } from "../../domain/guestDetails";
import type { DateRange } from "../../domain/dates";
import styles from "./BookingForm.module.css";

interface BookingFormProps {
  maxGuests: number;
  isSubmitting: boolean;
  datesError: string | null;
  range?: DateRange;
  onSubmit: (details: GuestDetails) => void;
}

type Field = keyof GuestDetails;

// Used to focus the first field with an error.
const FIELD_ORDER: Field[] = ["name", "email", "guests"];

export function BookingForm({
  maxGuests,
  isSubmitting,
  datesError,
  // range,
  onSubmit,
}: BookingFormProps) {
  const [values, setValues] = useState<GuestDetails>({
    name: "",
    email: "",
    guests: 1,
  });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const errors: GuestDetailsErrors = validateGuestDetails(values, maxGuests);

  // show an error after the guest left the field or tried to submit.
  const getError = (field: Field) =>
    touched[field] || submitted ? errors[field] : undefined;

  const updateValue = <K extends Field>(field: K, value: GuestDetails[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    const firstInvalid = FIELD_ORDER.find((field) => errors[field]);
    if (firstInvalid) {
      const input = event.currentTarget.querySelector<HTMLElement>(
        `[name="${firstInvalid}"]`
      );
      input?.focus();
      return;
    }
    if (datesError) return;

    onSubmit({
      ...values,
      name: values.name.trim(),
      email: values.email.trim(),
    });
  };

  // Props every input shares (id, name and accessibility attributes).
  const getFieldProps = (field: Field) => {
    const hasError = Boolean(getError(field));
    return {
      id: `booking-${field}`,
      name: field,
      "aria-invalid": hasError ? true : undefined,
      "aria-describedby": hasError ? `booking-${field}-error` : undefined,
      onBlur: () => setTouched((current) => ({ ...current, [field]: true })),
    };
  };

  const renderError = (field: Field) => {
    const error = getError(field);
    if (!error) return null;

    return (
      <p id={`booking-${field}-error`} className={styles.error}>
        {error}
      </p>
    );
  };

  // Every visible error in field order.
  const visibleErrors = FIELD_ORDER.flatMap((field) => {
    const error = getError(field);
    return error ? [{ field, error }] : [];
  });

  const guestOptions = Array.from({ length: maxGuests }, (_, i) => i + 1);

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      noValidate
      aria-label="Guest details"
    >
      {submitted && visibleErrors.length > 0 && (
        <div role="alert" className={styles.errorSummary}>
          <p>Please fix the following:</p>
          <ul>
            {visibleErrors.map(({ field, error }) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <fieldset disabled={isSubmitting} className={styles.fieldset}>
        <div className={styles.field}>
          <label htmlFor="booking-name">Full name</label>
          <input
            {...getFieldProps("name")}
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={(event) => updateValue("name", event.target.value)}
          />
          {renderError("name")}
        </div>

        <div className={styles.field}>
          <label htmlFor="booking-email">Email</label>
          <input
            {...getFieldProps("email")}
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => updateValue("email", event.target.value)}
          />
          {renderError("email")}
        </div>

        <div className={styles.field}>
          <label htmlFor="booking-guests">Guests</label>
          <select
            {...getFieldProps("guests")}
            value={values.guests}
            onChange={(event) =>
              updateValue("guests", Number(event.target.value))
            }
          >
            {guestOptions.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
          {renderError("guests")}
        </div>
      </fieldset>

      {submitted && datesError && (
        <p className={styles.error} role="alert">
          {submitted && datesError}
        </p>
      )}

      <button
        type="submit"
        className={`button ${styles.submit}`}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Booking…" : "Book now"}
      </button>
    </form>
  );
}
