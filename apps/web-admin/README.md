# Web Admin (Next.js) scaffold

This is a minimal Next.js + Tailwind admin app for the POS backend. It includes:
- Login page (/login) that calls the backend auth endpoint
- Products page (/products) that lists products and allows creating new products

How to run
1. From repo root: pnpm install
2. Start the app: pnpm --filter ./apps/web-admin dev

Notes
- The app reads API base from NEXT_PUBLIC_API_BASE (defaults to http://localhost:4000)
- Auth token is stored in localStorage for simplicity. For production, use httpOnly cookies and server-side auth.
