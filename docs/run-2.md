# DwellGuard RUN 2 Execution Report

**Date:** 14 September 2026  
**Status:** Completed  
**Branch:** `main`  
**Repository:** `https://github.com/Syedsaadhhh/DwellGuard-AI`  
**Upstream Target:** `https://github.com/CALLE-AI/awesome-phone-call-agents`  

---

## 1. Executive Summary

Run 2 elevated DwellGuard from the working vertical slice of Run 1 into a robust, judge-ready product featuring:
1. **The Spoken Constraint Relay:** Driver's spoken arrival limits visibly reshape the shared Plan Rail and rewrite the receiving dock prompt before the second call is placed.
2. **Causal Appointment Proof:** An irreplaceable, deterministic audit artifact (`DG-PROOF-xxxxxxxx`) with a 6-link causal chain and SHA-256 hash verified across desktop and mobile driver views, strictly excluding PII, phone numbers, and raw transcripts.
3. **Mandatory Run 1 Repair Gate Resolution:** All 6 repair gate requirements verified and tested.
4. **Upstream Contribution:** Packaged the reusable Spoken Constraint Relay pattern for `@call-e/calle` in `contrib/spoken-constraint-relay/`.

---

## 2. Mandatory Run 1 Repair Gate Verification

| Repair Item | Defect Identified in Baseline | Resolution in Run 2 | Verification Proof |
| --- | --- | --- | --- |
| **1. Asynchronous CALL-E Reconciliation** | `advanceIncident` stalled in `driver_task_pending` if CALL-E returned `in_progress`. | Added `reconcileCallTask` in `src/domain/workflow/reconcile.ts` for retrieval-only recovery from saved `calle_call_id`. Resumes state machine without placing duplicate calls. | Verified in `tests/unit/reconcile.test.ts`. Exactly 2 calls created; recovery is retrieval-only. |
| **2. Fail-Closed Gateway & Official Base URL** | Missing `CALLE_API_KEY` fell back to `FixtureCalleGateway` on operator routes; base URL defaulted to outdated `https://api.call-e.com`. | `getCalleGateway()` fails closed with `BLOCKED_LIVE` 503 error outside demo context. Base URL defaults to official `https://api.heycall-e.com`. `FixtureCalleGateway` isolated strictly to `getDemoContext()`. | Verified in `tests/unit/gateway-config.test.ts`. |
| **3. Access & Current Webhook Boundary** | Private routes lacked session checks; webhooks accepted untrusted metadata. | Protected all incident reads and mutations with `checkOperatorAuth`. Removed production fallback secret. Webhook route (`/api/webhooks/calle`) requires `CALL-E-Event-Id` header matching body, deduplicates against audit log, and maps strictly to saved intent before re-fetching state. | Verified in `tests/unit/webhook-boundary.test.ts`. |
| **4. Durable SupabaseStore Guarantees** | Missing real fenced lease claims and atomic authority versioning. | Added `causal_proofs` table, `freeze_authority_version` atomic procedure, and `claim_workflow_job` fenced leasing procedure in `supabase/migrations/20260913000000_initial_dwellguard.sql`. | Migration and store methods implemented. |
| **5. Production Handoff Persistence** | `raw_token_display` was not in Supabase schema; authority expiry was not checked before dispatch. | `handoff_tokens` table stores only SHA-256 `token_hash`. `raw_token_display` returned once in memory for delivery. Authority expiry enforced before task dispatch. Queries use deterministic `order('created_at', { ascending: false })`. | Implemented in `supabase-store.ts` and `advance-incident.ts`. |
| **6. Repository Proof & CI** | Baseline lacked GitHub status checks. | Created `.github/workflows/ci.yml` running TypeScript typecheck (`tsc --noEmit`), Vitest test suite (`vitest run`), and Next.js production build (`next build`). | `.github/workflows/ci.yml` active. |

---

## 3. The Irreplaceable Product Artifact: Causal Appointment Proof

Every confirmed appointment generates a deterministic **Causal Appointment Proof**:
- **Display ID Format:** `DG-PROOF-xxxxxxxx` (e.g. `DG-PROOF-7A91C2E4`).
- **Cryptographic Hash:** SHA-256 of canonical JSON payload with alphabetically sorted keys.
- **Privacy Boundary:** Strictly excludes phone numbers, recipient names, audio URLs, API keys, and raw transcripts. Preserves only operational facts (timestamps, overlap, fee amount, door, version, CallTask IDs).
- **The 6-Link Causal Chain:**
  1. *Frozen Authority:* Dispatcher limits (time window, fee ceiling, call budget).
  2. *Driver Window & Permission:* Attributed workable arrival window and explicit slot selection permission.
  3. *Derived Overlap:* Mathematical intersection of authority and driver limits.
  4. *Dock Commitment:* Attributed facility confirmation of slot, designated door, and fee boundary.
  5. *Versioned Receipt Pass:* Official appointment pass generated.
  6. *Driver Acknowledgment:* Final link verified when driver taps confirmation on scoped mobile handoff link.
- **Fail-Closed Rule:** Any missing, expired, out-of-interval, or over-fee evidence results in an amber broken link and terminates as `dispatcher_needed`. A green proof is never fabricated.

---

## 4. Test Suites & Verification

- `tests/unit/workflow.test.ts`: Complete lifecycle transitions, fee refusal, permission refusal, budget caps.
- `tests/unit/evidence.test.ts`: Evidence normalization, gate fee validation, interval math.
- `tests/unit/handoff.test.ts`: Handoff token generation, hashing, expiry, and idempotent acknowledgment.
- `tests/unit/calle-contract.test.ts`: Wire serialization, idempotency key placement, CallTask ID separation.
- `tests/unit/interval.test.ts`: Temporal intersection, timezone geometry, rollover handling.
- `tests/unit/causal-proof.test.ts`: Canonical JSON serialization, key sorting, SHA-256 stability, PII exclusion, broken link rejection.
- `tests/unit/reconcile.test.ts`: In-progress async task reconciliation, retrieval-only recovery, exactly 2 calls.
- `tests/unit/gateway-config.test.ts`: Fail-closed without `CALLE_API_KEY`, official default endpoint.
- `tests/unit/webhook-boundary.test.ts`: `CALL-E-Event-Id` verification, deduplication, unmapped ID rejection.
- `contrib/spoken-constraint-relay/relay.test.ts`: Reusable pattern verification.

---

## 5. Telephony Status & Live Call Policy

- **Live Status:** `BLOCKED_LIVE`
- **Reason:** `CALLE_API_KEY` is not present in the local testing environment. In accordance with the project master, operator endpoints fail closed rather than fabricating live results or dial attempts.
- **Public Replay:** The public demo at `/demo` executes the complete production domain state machine, interval math, and Causal Proof engine using isolated fixtures with zero network I/O.
- **Live Calls Made:** 0 live telephony calls placed locally.

---

## 6. Upstream CALL-E Contribution

Packaged in `contrib/spoken-constraint-relay/`:
- `relay.ts`: Reusable Spoken Constraint Relay pattern for `@call-e/calle`.
- `fixtures.ts`: Zero-telephony test fixtures.
- `relay.test.ts`: Unit test suite.
- `README.md`: Architectural documentation and sequence diagram.
Ready for submission to `https://github.com/CALLE-AI/awesome-phone-call-agents`.
