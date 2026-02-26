# Performance Changes

## Implemented Optimizations

1. Removed extra navigation round-trip on barbershop cards
- Change: non-exclusive cards now navigate directly to `/b/[slug]`.
- Impact: removes one redirect hop and reduces transition latency.
- Trade-off: card href now depends on slug contract in list payload (already present).

2. Consolidated owner reports fetch into one dashboard endpoint
- Change: `GET /api/reports/dashboard` returns `{ monthlySummary, summaries: { week, month, year } }`.
- Impact: reduces initial reports request fan-out from 4 to 1.
- Trade-off: endpoint payload is larger, but one network round-trip.

3. Request-scope memoization for session user resolution
- Change: `getSessionUser` in `lib/rbac.ts` now uses request-scoped memoization.
- Impact: avoids repeated auth/session/user DB lookups in the same request tree.
- Trade-off: side effects in that resolver run once per request (intended).

4. Query-key normalization for service combinations
- Change: service IDs are normalized/sorted in date-available-slots query key and fetch args.
- Impact: avoids duplicate cache misses caused by different service orderings.
- Trade-off: negligible in-memory sort cost.

5. Added stable loading skeletons for high-traffic routes
- Change: loading UIs in `app/loading.tsx`, `app/bookings/loading.tsx`, `app/b/[slug]/loading.tsx` and `app/owner/reports/loading.tsx`.
- Impact: smoother transitions and reduced visual jumps.
- Trade-off: minor additional component maintenance.

6. Optimized card/image rendering for lighter paint
- Change: `components/barbershop-item.tsx` defines `sizes` and removes badge backdrop blur.
- Impact: better responsive image selection and less expensive visual effect on card list.
- Trade-off: badge visual is slightly flatter.

7. Added booking hot-path index
- Change: new index on `Booking(barbershopId, barberId, date, cancelledAt)`.
- Impact: improves slot conflict and availability query selectivity.
- Trade-off: small write overhead and extra index storage.

8. Removed duplicate dashboard fetch on year change
- Change: `components/owner/reports-card.tsx` now updates year+month in one transition instead of syncing month in a separate effect.
- Impact: year change drops from 2 dashboard calls to 1.
- Trade-off: none.

9. Applied `startTransition` to non-urgent report filter updates
- Change: year/month/barbershop filter changes in reports now use React transitions.
- Impact: keeps input interactions responsive while chart + KPI recompute happens.
- Trade-off: filter controls stay disabled while transition/request is pending.

10. Slimmed booking query payloads
- Change: `data/bookings.ts` replaced broad relation selects (`barbershop/user/service: true`) with explicit field-level `select` for user/owner booking lists.
- Impact: lower DB payload and less serialization work on bookings pages.
- Trade-off: adding new UI fields now requires explicit select updates.

11. Reduced sheet animation duration
- Change: `components/ui/sheet.tsx` open/close animation from `500ms/300ms` to `250ms/200ms`.
- Impact: faster perceived modal/sheet response.
- Trade-off: slightly less dramatic transition.

## Before/After Summary

| Area | Before | After |
| --- | --- | --- |
| Home -> Detail navigation | 2 hops | 1 hop |
| Owner reports initial loading | 4 API requests | 1 API request |
| Owner reports year change | 2 dashboard calls | 1 dashboard call |
| Repeated server auth lookups | Possible within same request | Memoized per request |
| Slot query cache hit rate | Order-sensitive misses | Stable key by sorted IDs |
| Loading visual stability | Route gaps/jumps | Skeleton placeholders on key routes |
| Booking query payload | Broad relation payloads | Select-only fields used by UI |
| Booking sheet open transition | 500ms open animation | 250ms open animation |
