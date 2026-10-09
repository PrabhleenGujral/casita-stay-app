import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const listingSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  city: z.string(),
  pricePerNight: z.number().nonnegative(),
  maxGuests: z.number().int().positive(),
  rating: z.number().min(0).max(5),
  thumbnailUrl: z.string().url(),
});

export const hostSchema = z.object({
  name: z.string(),
  avatarUrl: z.string().url(),
  joinedYear: z.number().int(),
  isSuperhost: z.boolean(),
});

export const listingSchema = listingSummarySchema.extend({
  description: z.string(),
  photos: z.array(z.string().url()).min(1),
  amenities: z.array(z.string()),
  host: hostSchema,
  bedrooms: z.number().int().nonnegative(),
});

export const listingPageSchema = z.object({
  items: z.array(listingSummarySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});

export const availabilitySchema = z.object({
  bookedDates: z.array(isoDate),
});

export const bookingRequestSchema = z.object({
  listingId: z.string(),
  checkIn: isoDate,
  checkOut: isoDate,
  guests: z.number().int().positive(),
  name: z.string().trim().min(1),
  email: z.string().email(),
});

export const bookingSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  checkIn: isoDate,
  checkOut: isoDate,
  guests: z.number().int().positive(),
  totalPrice: z.number().nonnegative(),
});

export const errorBodySchema = z.object({ message: z.string() });

export type ListingSummary = z.infer<typeof listingSummarySchema>;
export type Listing = z.infer<typeof listingSchema>;
export type ListingPage = z.infer<typeof listingPageSchema>;
export type Availability = z.infer<typeof availabilitySchema>;
export type BookingRequest = z.infer<typeof bookingRequestSchema>;
export type Booking = z.infer<typeof bookingSchema>;
