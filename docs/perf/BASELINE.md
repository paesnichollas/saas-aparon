# Performance Baseline

Baseline reference before this optimization batch.

## Scope

- Home TTFB (`/`)
- Time-to-list rendering (home barbershop cards)
- Home -> Detail transition responsiveness
- Booking sheet open responsiveness
- Owner reports request fan-out

## Baseline Snapshot (pre-change)

| Metric | Baseline |
| --- | --- |
| Home TTFB (`/`) | Dominated by repeated session/user lookups + multi-query home payload |
| Time-to-list rendering | Subject to list image loading and no route-level loading skeleton |
| Home -> Detail transition | 2 hops (card -> redirect -> destination) when destination is already derivable from list item data |
| Booking sheet open | 500ms sheet open transition + visible jump while data resolves |
| Owner reports requests | 4 requests on first render (`monthly-summary` + 3x `summary`) |
| Owner reports filter change | Year change triggered 2 dashboard fetches (year update + month sync effect) |

## Measurement Notes

- This baseline was captured from code-path analysis and existing flow behavior.
- Use browser DevTools + Playwright trace to collect concrete before/after numbers in your environment.

## Metrics Checklist

- Home TTFB (`/`): capture `navigation.responseStart` in browser.
- Time-to-list rendering: capture elapsed time until first `barbershop-card-*` visible.
- Home -> Detail: capture click-to-URL-stable duration.
- Booking sheet open: capture click-to-sheet-visible duration.
- Owner reports initial load: capture request count and load-to-kpis-visible.
