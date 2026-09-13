# DwellGuard RUN 1 Execution Report

**Date:** 13 September 2026  
**Checkpoint Commit:** `bf26d42` (`chore: checkpoint interrupted DwellGuard Run 1`)  
**SDK Version:** `@call-e/calle@0.7.0` (official TypeScript server SDK)  
**Wire Contract Doc:** `docs/provider-contract.md`

---

## 1. Commands Run
- `npm install`: Added 157 dependencies including `@call-e/calle@0.7.0`, Next.js 14, Tailwind, Zod, Vitest.
- `npx vitest run`: 5 test files, 20 tests executed.
- `npx tsc --noEmit`: 0 type errors.
- `npm run build`: Next.js 14.2 production build succeeded across all 10 routes.

---

## 2. Test Counts & Verification Matrix
- **Total Tests:** 20 passed / 0 failed.
  - `tests/unit/workflow.test.ts` (5 passed): Positive path to `plan_confirmed` & `driver_received`, fee refusal to `dispatcher_needed`, driver permission rejection gate, non-overlapping arrival window, and 2-call task budget limit.
  - `tests/unit/evidence.test.ts` (6 passed): Recipient evidence normalization, permission checks, fee ceiling, currency checks.
  - `tests/unit/handoff.test.ts` (4 passed): 256-bit token entropy, SHA-256 hash validation, unexpired acknowledgment, duplicate idempotent acknowledgment.
  - `tests/unit/calle-contract.test.ts` (1 passed): Request serialization, `Idempotency-Key` header injection, and `calle_call_id` / `provider_call_id` separation.
  - `tests/unit/interval.test.ts` (4 passed): Date/time intersection, rollover, and explanation generation.

---

## 3. Implemented Features & Architecture
- **Domain & Persistence:**
  - 10 minimal persisted records: `incidents`, `authority_versions`, `call_intents`, `call_snapshots`, `observations`, `workflow_jobs`, `receipts`, `handoff_tokens`, `handoff_acknowledgments`, `audit_events`.
  - In-memory transactional store (`MemoryStore`) and durable Supabase client store (`SupabaseStore`).
  - Migration script: `supabase/migrations/20260913000000_initial_dwellguard.sql`.
- **CALL-E Voice Calling:**
  - `LiveCalleGateway`: Uses `@call-e/calle` SDK with exact `create` and `get` wire contracts.
  - `FixtureCalleGateway`: Safe offline transport for public replay and tests; cannot dial.
- **Visual Design & Plan Rail:**
  - Strict palette tokens (#172B3A, #F4F1EA, #FFFEFA, #254B62, etc.).
  - Signature `Plan Rail` component showing shared axis, live overlap highlight, and "What changed" copy.
  - Paper-like `AppointmentPass` component.
- **Routes:**
  - `/`: Shipment desk with prominent at-risk load `DG-2048` and 3 supporting fleet loads.
  - `/incidents/new`: Incident registration without raw JSON.
  - `/incidents/[id]`: Coordination workspace with Plan Rail, authority freeze, and action triggers.
  - `/receipts/[id]`: Print-friendly appointment pass with JSON export.
  - `/handoff/[token]`: Mobile driver page with one-tap acknowledgment.
  - `/demo`: Isolated public replay with persistent "Offline replay — no call is being placed" label and 45-second player.
  - `/about`: System limits, sequential authority explanation, and real vs. simulated details.

---

## 4. Live Proof Status
- **Status:** `BLOCKED_LIVE`
- **Evidence:** `CALLE_API_KEY` is not present in the local environment. No real telephone numbers were dialed. No live calls fabricated.
- **Calls Used:** 0 live calls (4 fixture calls recorded during test runs).
- **Deployment Status:** Local production build verified (`next build` exited 0). Ready for deployment to Vercel/Supabase once host environment keys are supplied.

---

## 5. Next Steps for Run 2
- Run 2 Start Command:
  ```bash
  # Execute Run 2 proof, wow transition, and release
  # See Section 6 (RUN 2) in DWELLGUARD_ANTIGRAVITY_MASTER.md
  ```
