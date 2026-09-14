# DwellGuard Release Checklist & Submission Matrix

**Date:** 14 September 2026  
**Product:** DwellGuard — Keep the dock plan moving.  
**Repository:** https://github.com/Syedsaadhhh/DwellGuard-AI  
**Hackathon:** CALL-E: Your Code Is Calling  

---

## 1. Release & Verification Matrix

| Checklist Item | Status | Value / Link / Verification |
| --- | --- | --- |
| **Typecheck** | `PASS` | `npm run typecheck` (`tsc --noEmit`) passes with 0 errors. |
| **Unit Tests** | `PASS` | 10 test suites covering domain, proof chain, reconciliation, security, and wire contracts. |
| **Production Build** | `PASS` | `npm run build` succeeds cleanly across all routes. |
| **CI Workflow Proof** | `PASS` | `.github/workflows/ci.yml` configured for typecheck, tests, and build. |
| **Public Replay Safety** | `PASS` | `/demo` executes offline fixture transport; cannot dial or consume credits. |
| **Private Routes Protected** | `PASS` | Operator session auth required on private incident routes; returns 401/503 without session/credentials. |
| **Fail-Closed Live Gateway** | `PASS` | Unauthenticated live calls return 503 `BLOCKED_LIVE`; no mock progress in live paths. |
| **Causal Appointment Proof** | `PASS` | Deterministic SHA-256 hash and display ID (`DG-PROOF-xxxxxxxx`) match across desktop and driver phone. |
| **Source Repository** | `READY` | https://github.com/Syedsaadhhh/DwellGuard-AI (branch: `main`) |
| **Upstream Contribution** | `READY` | Packaged in `contrib/spoken-constraint-relay/` ready for PR to https://github.com/CALLE-AI/awesome-phone-call-agents |
| **Live Telephony Proof** | `BLOCKED_LIVE` | `CALLE_API_KEY` absent locally; fails closed by design. Ready for production credentials. |
| **Deployed Application** | `READY_FOR_DEPLOY` | Ready for deployment to Vercel/Supabase. |
| **Public Video** | `PENDING_RECORDING` | Ready to record using three-minute script in `DWELLGUARD_ANTIGRAVITY_MASTER.md`. |
| **CALL-E Account Email** | `MANUAL_ENTRY` | Enter the registered CALL-E account email in the Devpost submission form. |

---

## 2. Devpost Submission Copy

### One-Sentence Pitch
DwellGuard coordinates a late truck's revised dock appointment by turning the driver's real arrival limits into the next CALL-E request, validating the dock's confirmation, and returning the agreed plan to the driver.

### Testing Instructions
1. Open the public replay at `/demo`.
2. Select the **Positive Replay** scenario.
3. Click **Play the 45-second flow** (or use step controls).
4. Watch the driver's spoken arrival limits reshape the Plan Rail and rewrite the receiving dock prompt before call 2.
5. In Step 4, inspect the **Causal Appointment Proof** chain (`Why this plan is valid`) and note the proof ID (e.g. `DG-PROOF-7A91C2E4`).
6. Click the mobile handoff link or tap **I've received this plan** on the simulated driver handoff view.
7. Observe the desktop pass immediately update to **Driver received** and link 6 turn green.
8. Switch to the **Fee Refusal** scenario and verify that an unapproved $350 fee halts at **Dispatcher needed** with an amber broken link (never false green).

---

## 3. Upstream Pull Request Details

- **Target Repository:** `https://github.com/CALLE-AI/awesome-phone-call-agents`
- **Contribution Title:** `feat: add DwellGuard Spoken Constraint Relay pattern`
- **Directory:** `contrib/spoken-constraint-relay/`
- **Included Files:**
  - `relay.ts`: Production implementation of the two-call sequential relay.
  - `fixtures.ts`: Offline test fixtures for zero-call validation.
  - `relay.test.ts`: Test suite verifying positive, fee refusal, and permission refusal paths.
  - `README.md`: Architecture diagrams, sequence flow, and usage examples.
