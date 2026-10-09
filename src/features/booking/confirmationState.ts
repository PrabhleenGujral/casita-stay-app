import { z } from "zod";
import { bookingSchema, listingSummarySchema } from "../../api/schemas";

export const confirmationStateSchema = z.object({
  booking: bookingSchema,
  listing: listingSummarySchema.pick({
    title: true,
    city: true,
    thumbnailUrl: true,
  }),
  guest: z.object({ name: z.string(), email: z.string() }),
});

export type ConfirmationState = z.infer<typeof confirmationStateSchema>;
