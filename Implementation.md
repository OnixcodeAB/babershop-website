# BarberShop MVP Implementation Plan

## 1. Overview
This document outlines the plan to deliver a minimum viable product for a barbershop appointment platform. The MVP enables clients to discover services and barbers, view available times, and book appointments, while staff manage availability and confirm bookings.

## 2. Goals & Success Criteria
- Clients can choose a service, optionally select a preferred barber, and reserve an available slot.
- Barbershop staff access an internal dashboard to review, confirm, or cancel appointments and adjust availability.
- Booking confirmations are logged (console/email placeholder) for future notification integration.
- Basic operational metrics (daily bookings, service usage) are captured for the dashboard.
- Deployment pipeline supports staging and production with environment-based configuration.

## 3. Target Tech Stack
| Layer        | Technology                                      | Notes |
|--------------|--------------------------------------------------|-------|
| Frontend     | React + Vite, TypeScript, Tailwind CSS           | Rapid UI iteration, component reuse. |
| Backend      | Node.js + Fastify (TypeScript)                   | Lightweight, fast routing & validation. |
| ORM & DB     | Prisma + SQLite (dev/staging) / Postgres-ready   | Start with file-based DB; migrate easily later. |
| Auth         | Magic link (email token) via Nodemailer (dev)    | Passwordless admin/staff login. |
| Infra/Deploy | Vercel/Netlify (frontend), Render/Fly.io (backend)| Support CI/CD and environment variables. |
| Tooling      | PNPM workspaces, Zod validation, Vitest/Jest     | Monorepo-friendly, type-safe schemas. |

## 4. Architecture Overview
1. **Client App**: SPA served statically; communicates with backend APIs.
2. **API Server**: Fastify service exposing JSON endpoints; handles validation, persistence, and slot logic.
3. **Database**: Prisma schema for services, barbers, slots, appointments, users.
4. **Auth**: Magic link tokens stored hashed; sessions via signed cookies.
5. **Notifications**: Initial implementation logs confirmation payloads; future pluggable provider.
6. **Deployment**: Infrastructure-as-code scripts or platform configuration for reproducibility.

```
[Client SPA] -- REST --> [Fastify API] -- Prisma --> [SQLite/Postgres]
                         |
                     Notifications (console/email placeholder)
```

## 5. Data Model
| Entity       | Key Fields                                                                   |
|--------------|------------------------------------------------------------------------------|
| Service      | `id`, `name`, `description`, `durationMinutes`, `price`, `isActive`         |
| Barber       | `id`, `name`, `bio`, `photoUrl`, `services` (many-to-many)                  |
| TimeSlot     | `id`, `barberId`, `start`, `end`, `isBlocked`, `recurringRule (future)`     |
| Appointment  | `id`, `clientName`, `clientEmail`, `clientPhone`, `serviceId`, `barberId?`, `slotId`, `status`, `notes`, `source` |
| User         | `id`, `email`, `role` (`admin`, `barber`), `magicLinkTokenHash`, `tokenExpiry` |
| MetricEvent  | `id`, `eventType`, `payload`, `occurredAt` (optional, for analytics)         |

## 6. API Design (v1)
- `GET /api/services` -> List active services.
- `GET /api/barbers` -> List barbers; filter by `serviceId`.
- `GET /api/availability?date=YYYY-MM-DD&serviceId=&barberId=` -> Available slots.
- `POST /api/appointments` -> Create pending appointment. Request body includes client info, serviceId, optional barberId, preferred slot.
- `PATCH /api/appointments/:id` -> Update status (`confirmed`, `cancelled`), assign barber.
- `GET /api/appointments?status=&dateRange=` (staff) -> Query upcoming appointments.
- `POST /api/time-slots/block` (staff) -> Create/update blocked slots.
- `POST /api/auth/magic-link` -> Request staff login link.
- `POST /api/auth/verify` -> Exchange token for session; sets signed cookie.
- `POST /api/logout` -> Destroy session.

### Validation & Error Handling
- Zod schemas for request/response.
- Consistent error envelope `{ error: { code, message, details } }`.
- Rate-limiting for auth endpoints (for example, IP-based).

## 7. Frontend Implementation
1. **Setup**
   - Initialize Vite + React + TypeScript; configure Tailwind and PNPM workspace.
   - Establish app layout, theme, and shared components (Button, Card, Form controls).

2. **Public Flow**
   - Landing page with hero, services preview, call to action.
   - Service selection step: list cards with duration and price.
   - Barber selection (optional): filter by service availability.
   - Calendar/time picker pulling from `GET /availability`.
   - Client details form with validation; review and confirmation screen.
   - Booking success page with summary, calendar file download, contact info.

3. **Admin Dashboard**
   - Login modal for magic link flow.
   - Dashboard layout with navigation (`Appointments`, `Availability`, `Analytics`).
   - Appointments table with status tags, filters, inline confirm/cancel.
   - Calendar/slots view to block or unblock time for barbers.
   - Basic analytics widgets (bookings by day, top services).

4. **State Management**
   - React Query (TanStack) for data fetching and caching.
   - Context/provider for auth and session state.

5. **Testing**
   - Component tests for booking flow forms.
   - Cypress or Playwright smoke test (optional if time permits).

## 8. Backend Implementation
1. **Project Bootstrapping**
   - PNPM workspace with `apps/api`.
   - Configure Fastify with TypeScript, nodemon or ts-node-dev for hot reload.
   - Add Prisma schema and migration scripts; seed data for services, barbers, slots.

2. **Core Modules**
   - `services` module: CRUD (only read exposed publicly).
   - `barbers` module: list and service associations.
   - `availability` service: compute open slots by subtracting booked appointments.
   - `appointments` module: create and update with transactional slot locking.
   - `auth` module: generate tokens, send via Nodemailer (console transport in dev).
   - `metrics` logger: simple database writes or StatsD placeholder.

3. **Middleware**
   - Session handling (Fastify cookie plus JWT or server-side session store).
   - Role-based access guard for admin endpoints.
   - Rate limiting for auth and booking endpoints.

4. **Testing**
   - Unit tests for availability calculations.
   - API integration tests (Vitest plus Supertest) for booking lifecycle.
   - Use sqlite in-memory for test runs via Prisma.

## 9. Deployment & DevOps
- **Environments**: `development`, `staging`, `production`.
- **Configuration**: `.env` files with safe defaults; environment variables for DB URL, session secret, mail transport.
- **CI/CD**: GitHub Actions to run lint and test on PRs; deploy main branch to staging; manual promotion to production.
- **Monitoring**: Minimal logging pipeline (JSON logs). Consider Logflare or Logtail integrations later.

## 10. Release Milestones
1. **Week 1**
   - Repo setup, tooling, Prisma schema, seed data.
   - Core APIs for services, barbers, availability.
   - Basic landing page and booking wizard skeleton.

2. **Week 2**
   - Complete booking flow end-to-end (frontend and backend).
   - Implement admin auth and dashboard skeleton.
   - Add appointment status management.

3. **Week 3**
   - Availability management UI (block slots).
   - Email logging, analytics widgets.
   - Testing coverage (unit and integration) and polish.

4. **Week 4**
   - Staging deploy, manual QA.
   - Fix bugs, refine UI copy, accessibility review.
   - Production deploy and documentation handoff.

## 11. Risks & Mitigations
- **Scheduling Conflicts**: Implement optimistic locking on slots; re-validate availability before confirming.
- **Magic Link Deliverability**: Start with console transport; integrate real email provider once domain ready.
- **Time Zone Handling**: Store timestamps in UTC, convert on client using Luxon or Day.js.
- **Scalability**: SQLite suitable for MVP; document migration path to Postgres (Prisma makes it straightforward).
- **User Adoption**: Add analytics hooks to observe drop-off in booking flow for future iterations.

## 12. Documentation & Handoff
- Maintain `README.md` with setup instructions.
- Document API endpoints via OpenAPI or Postman collection.
- Record admin workflows (login, confirm appointments, block slots).
- Prepare future roadmap items (payments, recurring customers, mobile app).

---

**Next Actions**
1. Confirm tech stack and adjust plan if existing tooling differs.
2. Create repository structure and initialize PNPM workspaces.
3. Draft wireframes for booking flow and dashboard to align on UX before coding.
