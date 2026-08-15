IMPLEMENTATION PLAN — Your Buy-and-Sell POS (Loyverse-equivalent, non‑UI copy)

LEGAL NOTE
- I will NOT copy Loyverse source code, UI, logos, or other copyrighted/trademarked assets.
- I will reproduce the same feature set and workflows (functionality parity), implemented with original code, original UIs, and different branding. This is a lawful clean‑room reimplementation.

GOAL (your instruction)
- Recreate Loyverse POS feature-for-feature (100% functional parity) except we will not copy the Loyverse UI; also add the buying/selling twist and a points system that applies to both buying and selling activities.
- Deliver production-ready server + mobile + admin apps, hardware integration support, and deployment automation.

SCOPE — Feature matrix (target parity)
Core POS sales
- Item lookup, barcode scanning, modifiers/options, variants/SKUs
- Discounts (per-item, per-sale), rounding rules
- Split payments, split receipts, refunds/returns, sales edits
- Receipt printing (ESC/POS / network / Bluetooth) + email receipts
- Offline-first device behavior (local DB / queued sales / sync)

Inventory & purchasing
- Product catalog, categories, pricing, cost
- Inventory tracking (per-store), stock adjustments, stock take
- Purchases (store buys from supplier) to add inventory

Employees & Stores
- Employee accounts, roles & permissions (ADMIN/MANAGER/CASHIER)
- Multi-store support, store-level config

Customers & Loyalty (your twist)
- Customer profiles, purchase history
- Points ledger: earn on sales, optional earn on sell-to-store (configurable)
- Redeem points on sales (mixed payments), manual adjustments, ledger UI

Restaurant features
- Orders, table/seat management, KDS (kitchen display), order routing
- Kitchen/receipt printers per station

Payments
- Cash and ONLINE_WALLET (manual confirm flow) supported now
- Payment records, statuses (PENDING/COMPLETED/FAILED)
- Future: integrate gateways if required (Stripe/Adyen/local)

Reports & Exports
- Daily sales, product / employee / store reports, CSV / XLS export
- Accounting export (basic CSV for QuickBooks / Xero import)

APIs & Integrations
- REST API for mobile & admin, webhooks for external events
- SDKs / samples for printer integrations and payment terminals

Non-functional
- Security: JWT auth, roles, secrets management, basic input validation
- Observability: error reporting (Sentry) and logs (structured)
- CI/CD: GitHub Actions, Docker images, infra manifests (Helm/Terraform optional)

DELIVERABLES & ACCEPTANCE CRITERIA
- All endpoints documented (OpenAPI) and working with tests
- Mobile Expo app: login, sales flow, points redeem, offline queue placeholder
- Web admin: login, product management, customers & points ledger, purchases
- Seed data + scripts for test accounts
- CI runs lint + tests + prisma generate + migrations
- Basic deployment configuration and run instructions

PRIORITIZED ROADMAP (high-level sprints)
Sprint 0 (done): monorepo scaffold, auth, Prisma schema, basic products/inventory, seed, mobile + web scaffolds, points minimal support
Sprint 1 (1–2 weeks): Complete core sales flows
  - Modifiers/options, variants, SKU management
  - Discounts, returns/refunds flow, partial refunds
  - Receipt generation endpoint (HTML/PDF) and ESC/POS printing helper
  - Improve mobile checkout UI (apply discounts, use points, mixed payments)
Sprint 2 (1–2 weeks): Inventory & purchasing
  - Purchases (supplier) flows + stock take endpoints
  - Inventory history, adjustments, alerts (low stock)
Sprint 3 (1–2 weeks): Restaurant features
  - Orders, KDS, seat splitting, kitchen printing
Sprint 4 (1–2 weeks): Reporting & exports, accounting export
Sprint 5 (1–2 weeks): Hardening & infra
  - Validation (Zod), RBAC enforcement, integration tests, CI upgrades, Sentry
Sprint 6 (2–4 weeks): Offline-first & hardware
  - Robust offline sync (SQLite/WatermelonDB), queued sales, conflict resolution
  - Bluetooth/Network ESC/POS print support, barcode hardware support
Sprint 7 (ongoing): Payments & provider integrations (if requested); performance and production hardening

Estimated time to reach functional parity (server+mobile+admin, excluding production-grade offline+hardware): ~8–10 weeks with a 3–5 developer team. Speed depends on priorities and parallel work.

IMMEDIATE NEXT ACTION (I will start now)
1. Implement Sprint 1 items (modifiers/variants, discounts, refunds, receipts endpoint, mobile checkout improvements) and push incremental commits to branch dev/scaffold.
2. Add OpenAPI summary for the POS endpoints and acceptance tests for sale/return/points flows.
3. Keep pushing small PRs to dev/scaffold for your review; open a PR to the default branch when you want to merge.

DETAIL: Sprint 1 breakdown (first tasks I will implement now)
- POST /api/products/:id/modifiers + data model for Modifier and ModifierOption
- Apply discounts at item and cart level (discount type: percentage/fixed)
- Refund endpoint: POST /api/sales/:id/refund (creates refund sale or credit, adjusts inventory)
- Receipt endpoint: GET /api/sales/:id/receipt -> HTML/PDF and printed ESC/POS helper
- Mobile UI: show modifiers, apply discounts, show receipt/confirmation flow

CONFIG / POLICY DECISIONS I will enforce (unless you tell me otherwise)
- Inventory decremented on sale creation (current behavior). For ONLINE_WALLET PENDING payments we can change to decrement on payment confirmation — tell me if you prefer that.
- Points earn and redemption rules are configurable via env vars (POINTS_EARN_DIVISOR, POINTS_REDEMPTION_RATE).
- No Loyverse trademarks, brand names, or assets will be used.

HOW I’LL WORK
- I will push small, reviewable commits to dev/scaffold and include clear commit messages.
- I will open PRs for major feature sets and include screenshots / API docs for review.
- I will run tests locally and ensure CI runs pass (prisma generate, migrate, tests).

PRIVACY / LEGAL REMINDER
- Do not provide Loyverse-protected assets (images, code, design files). If you have migration data exports (CSV of products/customers), I can import them but you must confirm you have the right to use that data.

NEXT STEPS (no confirmation needed)
- I will begin Sprint 1 immediately and push the first changes to dev/scaffold (modifiers model + endpoints + discounts + refunds + receipt endpoint).
- I will update this roadmap file and post commit/PR links as I make progress.

If you want to change priorities (e.g., prioritize offline-first or hardware sooner), tell me and I will re-order work. Otherwise I will proceed now.