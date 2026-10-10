# Casita Stays

A home rental app built with **React 19, TypeScript, and TanStack Query**. Users can search for homes, view details, check availability, calculate prices, and book stays.

Features infinite scroll, mini calendar previews, and performance optimizations.

The API is mocked with MSW and intentionally simulates slow requests and errors.

**Project Link**: https://casita-stays-app.netlify.app/  
 **Build**: 584 modules | **Size**: 308 KB gzipped

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
    search/      Results page, filters, card, VirtualizedGrid (memoized), infinite scroll
    listing/     Details page, gallery, calendar, price breakdown, booking form
    booking/     Confirmation page
    favourites/  localStorage-backed favourites and the saved homes page
  components/    Empty, error and not found states
  hooks/         useInfiniteScroll (IntersectionObserver), useDebouncedCallback
  app/           Router, layout, query client wiring
  lib/           Formatting helpers
```

## Key Decisions

- **URL search state:** Filters, sorting, and pagination live in the URL, making searches shareable and browser navigation work as expected.
- **TanStack Query:** Handles caching, request cancellation, retries, and loading states.
- **Zod:** Validates API responses before they reach UI components.
- **MSW:** Simulates API requests, delays, server errors, and booking conflicts.
- **Booking validation:** Prevents date ranges from including already-booked nights.
- **Infinite Scroll:** IntersectionObserver-based auto-pagination (replaces traditional pagination).
- **Mini Calendar Preview:** 3-month availability calendar on each listing card with toggle.
- **Component Memoization:** VirtualizedGrid with memoized cards to prevent unnecessary re-renders.
- **Performance:** Lazy-loaded routes, image lazy loading (first 4 eager, rest lazy), component memoization, React Query deduplication.
- **Accessibility:** Keyboard navigation, labelled form fields, visible focus, screen-reader announcements, WCAG AA color contrast.

## New Features (Enhanced Edition)

✨ **Infinite Scroll Pagination**

- Auto-loads next page when scrolling near bottom (500px threshold)
- Loading indicator with spinner
- "End of results" message
- Preserves filter state across pages

🗓️ **Mini Calendar Preview**

- 3-month availability preview on each listing card
- Toggle "Check dates" button with smooth slide-in animation
- Color-coded dates (available/booked/past)
- Integrated with booking system

⚡ **Performance Optimizations**

- Component memoization (VirtualizedGrid, GridItem, ListingCard)
- Responsive CSS Grid with auto-fill columns
- React Query caching and deduplication
- Image lazy loading with priority loading for above-fold cards

🚀 **Deployment Ready**

- Netlify configuration (netlify.toml)
- SPA routing setup
- Production build: 584 modules in 143ms
- Bundle: 965 KB → 308 KB (gzipped)

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
