# Feature Inventory (E2E)

## Coverage Map

| Feature Family | Happy Path Spec | Failure/Rule Spec | Spec File |
| --- | --- | --- | --- |
| Auth/Profile | Phone login succeeds | Mismatched existing identity returns conflict | `tests/e2e/auth-profile.spec.ts` |
| Home/Search/Detail | List renders and opens detail page | Unmatched search returns empty state | `tests/e2e/home-search-detail.spec.ts` |
| Booking Create | Booking creation succeeds via API | Invalid payload is blocked | `tests/e2e/booking-create.spec.ts` |
| Booking Conflict | First customer books slot | Second customer receives conflict | `tests/e2e/booking-conflict.spec.ts` |
| Cancellation | Future booking can be canceled | Repeated cancellation is blocked | `tests/e2e/cancellation.spec.ts` |
| Waitlist | Active waitlist entry is visible | Join is blocked when day still has available slots | `tests/e2e/waitlist.spec.ts` |
| Share Link | Valid token links customer after auth | Invalid token safely falls back to auth | `tests/e2e/share-link.spec.ts` |
| Review | Finished paid booking reviewed once | Second review path blocked by UI state | `tests/e2e/review.spec.ts` |
| Owner Flows | Owner creates service | Invalid owner form submit shows validation | `tests/e2e/owner-flows.spec.ts` |
| Owner Reports | Metrics card loads | Missing owner barbershop blocks context | `tests/e2e/owner-reports.spec.ts` |
| Admin Flows | Admin updates role | Promote owner without barbershop is blocked | `tests/e2e/admin-flows.spec.ts` |
| Demo Suite | Customer booking appears for owner | Owner sees canceled status after customer cancel | `tests/e2e/demo/owner-demo-flow.spec.ts` |

## Notes

- E2E coverage is Chromium-first for deterministic CI speed.
- Stripe checkout is intentionally not part of deterministic E2E; mocked behavior is covered in Vitest (`lib/stripe-booking-reconciliation.test.ts`).
