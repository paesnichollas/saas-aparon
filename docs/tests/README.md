# Test Runbook

## Prerequisites

- Node.js 22 LTS
- `pnpm install`
- Local PostgreSQL available (ex: `docker compose up -d postgres`)
- `.env.test` configured with an isolated database URL

## Required .env.test contract

Use local isolated DB and include `schema=e2e` marker:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/aparatus?schema=e2e"
BETTER_AUTH_SECRET="test-better-auth-secret"
NEXT_PUBLIC_APP_URL="http://127.0.0.1:3000"
```

## Command Matrix

- Unit/integration (Vitest):
  - `pnpm test`
- E2E headless (Playwright):
  - `pnpm test:e2e`
- E2E UI mode:
  - `pnpm test:e2e:ui`
- CI contract:
  - `pnpm test:ci`

## DB Lifecycle (E2E)

Playwright `global-setup` always enforces deterministic state before suite:

1. `pnpm prisma migrate reset --force`
2. `pnpm tsx prisma/seed.test.ts`

This ensures all specs run against reproducible fixtures.

## Flaky Test Prevention Rules

- Prefer explicit URL/text/visibility assertions over timing assumptions.
- Do not use arbitrary sleeps.
- Keep data deterministic (`prisma/seed.test.ts` + fixed IDs).
- Keep each scenario independent (different test users and timeslots).
- Use `trace: on-first-retry` and screenshot/video only on failures.
