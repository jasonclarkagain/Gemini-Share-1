# Threat Model

## Project Overview

YouTube Sentinel is a video pre-moderation dashboard built as a pnpm monorepo. The production surface consists of an Express 5 API in `artifacts/api-server`, a React/Vite moderator UI in `artifacts/sentinel`, generated OpenAPI/Zod client libraries in `lib/api-*`, and a PostgreSQL database accessed through Drizzle in `lib/db`.

The application stores and exposes moderation jobs, violation records, risk scores, and review actions such as approving or rejecting flagged videos. For this scan, `artifacts/mockup-sandbox` is treated as dev-only and out of production scope unless production reachability is demonstrated. TLS is assumed to be handled by the platform in production.

## Assets

- **Moderation jobs and review decisions** — submitted video URLs, titles, risk scores, workflow state, and approve/reject outcomes. Unauthorized access or modification would let attackers inspect or alter moderation operations.
- **Violation records and activity history** — policy findings, timestamps, confidence values, and analyst-facing event history. This data may expose sensitive internal moderation logic and operational activity.
- **Database integrity and availability** — the PostgreSQL database backs the entire moderation pipeline. Abuse of write-heavy endpoints or unrestricted reads can degrade service or corrupt business state.
- **Application secrets and infrastructure configuration** — especially `DATABASE_URL` and any future auth or third-party API secrets. Compromise would expose stored moderation data and system control.

## Trust Boundaries

- **Browser to API** — all frontend and third-party requests to `/api/*` cross from an untrusted client into the Express server. The API must not trust caller identity, role, rate, or intent without server-side enforcement.
- **API to PostgreSQL** — the API has direct database access and can read or mutate all moderation records. Flaws in route handlers can therefore become full read/write exposure of operational data.
- **Public internet to moderator functions** — routes that create jobs, list jobs, view violations, and approve/reject videos represent a public-to-internal moderation boundary. These actions should only be available to explicitly authorized users or trusted systems.
- **Production vs dev-only code** — `artifacts/sentinel` and `artifacts/api-server` are production surfaces; `artifacts/mockup-sandbox` is assumed non-production and should normally be excluded from findings unless reachable in deployed builds.

## Scan Anchors

- Production API entry points: `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/*.ts`
- Production frontend entry points: `artifacts/sentinel/src/main.tsx`, `artifacts/sentinel/src/App.tsx`, `artifacts/sentinel/src/pages/*.tsx`
- Highest-risk area: moderator/reviewer routes in `artifacts/api-server/src/routes/jobs.ts`, plus global data listing routes in `dashboard.ts` and `violations.ts`
- Shared persistence layer: `lib/db/src/index.ts`, `lib/db/src/schema/*.ts`
- Usually ignore as dev-only: `artifacts/mockup-sandbox/**`

## Threat Categories

### Spoofing

The API currently exposes moderation workflow endpoints over HTTP without any evident authentication middleware, session validation, or bearer-token verification. The system must require a verified user or service identity before allowing access to any moderation data or reviewer action, and it must reject unauthenticated callers at the server boundary rather than relying on frontend navigation.

### Tampering

Approving, rejecting, or creating moderation jobs changes business state and drives downstream activity records. The application must ensure only authorized reviewers can change job state, and it must treat all client input as untrusted even when the frontend presents the action as an internal dashboard feature.

### Information Disclosure

Job listings, violation details, activity feeds, and aggregate dashboard data reveal internal moderation operations and potentially sensitive user-submitted content metadata. The API must scope these responses to authorized users and avoid exposing global moderation records to anonymous callers.

### Denial of Service

Job submission can trigger asynchronous analysis work and multiple database writes. Publicly reachable write paths must enforce rate and workload limits so attackers cannot create unbounded background work or database growth with repeated requests.

### Elevation of Privilege

Moderator actions such as approving or rejecting videos are privileged operations. The system must enforce server-side authorization on every state-changing route and prevent anonymous or low-privilege users from exercising reviewer capabilities simply by calling documented endpoints directly.
