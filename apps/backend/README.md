# Backend (scaffold) with Prisma

This backend is an Express + TypeScript scaffold wired to PostgreSQL via Prisma.

Quick start
1. Copy environment example:
   - cp apps/backend/.env.example apps/backend/.env
   - Edit apps/backend/.env and set DATABASE_URL and JWT_SECRET
2. From repository root, install dependencies: `pnpm install`
3. Start Postgres: `docker-compose up -d`
4. From repo root, run Prisma migrations / generate:
   - cd apps/backend
   - pnpm prisma:generate
   - pnpm prisma:migrate
5. Start the backend in dev mode:
   - pnpm --filter ./apps/backend dev

Available endpoints
- POST /api/auth/register { email, password, name? }
- POST /api/auth/login { email, password }
- GET  /api/auth/me (Authorization: Bearer <token>)

Notes
- This replaces the file-backed user store with a Postgres-backed Prisma model.
- For production, review Prisma migration commands and use `prisma migrate deploy` in CI/CD.
