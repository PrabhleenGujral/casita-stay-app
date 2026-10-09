# Casita Stays

A home rental app built with **React, TypeScript, and TanStack Query**. Users can search for homes, view details, check availability, calculate prices, and book stays. The API is mocked with MSW and intentionally simulates slow requests and errors.

Project Link : https://casita-stays-app.netlify.app/

## Getting Started

**Requirements:** Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev
```

## Scripts

| Command             | Description          |
| ------------------- | -------------------- |
| `pnpm test`         | Run tests            |
| `pnpm lint`         | Check code quality   |
| `pnpm typecheck`    | Check TypeScript     |
| `pnpm format:check` | Check formatting     |
| `pnpm build`        | Build for production |

## Project Structure

```
src/
  domain/        Pure TypeScript. Pricing, date ranges, search params, form validation. No React.
  api/           fetch client, Zod schemas, query keys and hooks, retry policy
  mocks/         MSW handlers, seeded data generator, in-memory bookings
  features/
    search/      Results page, filters, card, pagination
    listing/     Details page, gallery, calendar, price breakdown, booking form
    booking/     Confirmation page
    favourites/  localStorage-backed favourites and the saved homes page
  components/    Empty, error and not found states
  hooks/         useDebouncedCallback
  app/           Router, layout, query client wiring
  lib/           Formatting helpers
```

## Key Decisions

- **URL search state:** Filters, sorting, and pagination live in the URL, making searches shareable and browser navigation work as expected.
- **TanStack Query:** Handles caching, request cancellation, retries, and loading states.
- **Zod:** Validates API responses before they reach UI components.
- **MSW:** Simulates API requests, delays, server errors, and booking conflicts.
- **Booking validation:** Prevents date ranges from including already-booked nights.
- **Performance:** Uses lazy-loaded routes, image lazy loading, and memoisation to reduce unnecessary work.
- **Accessibility:** Supports keyboard navigation, labelled form fields, visible focus, and screen-reader announcements.

## Testing

Includes **unit and integration tests** covering pricing, date rules, search filters, form validation, and booking scenarios, including `404` errors and `409` booking conflicts.

## Known Limitations

- Bookings are stored in memory and reset after a full reload.
- The app uses a mock API, not a real backend.
- Property images require an internet connection.

## Time Spent and AI tools used

- I have spent **7-8 Hrs** on the project.

- I used Claude, mainly for speed on code I’d otherwise type by hand.
  My decisions: the architecture (pure domain/ layer, TanStack Query for server state, URL as the only store for search state), the booking rules (stays as nights, integer cents, the 409 flow), the list of test cases, etc.

- AI-assisted: project setup, Zod schemas and MSW handlers from the API spec, the mock data generator, writing test code from my case list.

- How I verified it: I read every line, tested with the mock failure and conflict rates turned up, used the app with keyboard only and a screen reader on the calendar and form, and checked it at 360px.
