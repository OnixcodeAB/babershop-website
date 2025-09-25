# BarberShop Platform

This repository contains two independent projects for the BarberShop MVP:

- `backend/` - Fastify + Prisma API server.
- `frontend/` - React + Vite client application.

Each project runs and is deployed independently (no npm workspaces).

## Directory overview

The frontend is now split into two top-level entry points:

- `frontend/src/client` – the guest booking experience (landing, booking flow, shared UI pieces).
- `frontend/src/admin` – the future admin dashboard surface. Currently ships with a placeholder layout; real dashboards will live here.

`frontend/src/App.tsx` and `frontend/src/main.tsx` simply re-export/boot the client bundle so existing tooling keeps working. When the admin surface needs its own entry, add a dedicated `admin-main.tsx` or lazy route that mounts `AdminApp`.

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

The API exposes `GET /api/services`, `GET /api/barbers`, `GET /api/availability`, and a `GET /health` probe.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `frontend/.env` if the backend runs on a different host/port (defaults to `http://localhost:3000/api`).

## Milestone Week 1 Scope

- Establish independent backend and frontend projects.
- Define initial Prisma schema and seed data for services/barbers.
- Deliver core read-only endpoints for services, barbers, and availability.
- Implement a React landing page that lists services and fetches data from the API.

Refer to `Implementation.md` for the full roadmap and design details.
