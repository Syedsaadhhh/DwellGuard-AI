# DWELLGUARD — FINAL ANTIGRAVITY MASTER

**13 September 2026 · Three execution runs · One implementation authority**

**Product:** DwellGuard — Keep the dock plan moving.

**Repository:** https://github.com/Syedsaadhhh/DwellGuard-AI

**Target:** CALL-E: Your Code Is Calling — Most Practical Use Case; Innovation is secondary.

This document supersedes both earlier five-run masters. Do not concatenate them, implement their old run order, or treat their corrections as additional work. This is a specification, not evidence of a completed application. The GitHub repository was empty when inspected on 13 September; competitor source inspection did not include executing their applications.

---

## 1. Final verdict

**Proceed with the focused build. Do not restart ideation.** The practical problem and sponsor fit are credible. The general combination of logistics, phone calls, evidence and policy checks already exists. Our strongest opportunity is an exceptionally clear, working coordination experience: the driver's actual limits change the next call, a dock appointment is explicitly confirmed, and the driver receives and acknowledges the resulting plan.

The hard parts are obtaining usable call evidence, expressing authority precisely and recovering without duplicate calls. A large dashboard, a longer README or more agents will not solve those problems. Winning remains unproven until the product and demonstration work; this plan makes no prize or originality guarantee.

### What the GitHub check actually established

| Inspected project | Existing strength | DwellGuard requirement arising from the comparison |
| --- | --- | --- |
| [DockSignal](https://github.com/HectorTa1989/docksignal) | Driver/dock fact finding, an incident room, stable call keys, database dispatch claims, retrieval after webhooks and a separately approved follow-up | Those capabilities are baseline. Show a sequential driver-authorized scheduling decision and the completed handoff, with fewer dispatcher decisions inside the initial authority. |
| [ResolveCall](https://github.com/Arvindkumar006/RESOLVECALL) | Operational recovery and executable deadline policy evaluation | Preserve real date/time offsets and persisted workflow state. Demonstrate recovery instead of relying on a strong README claim. |
| [Verity Verification Core](https://github.com/CALLE-AI/awesome-phone-call-agents/tree/main/skills/verity-verification-core) | Explicit read-back requirements, correction handling and conservative transcript verification | Evidence gating is not unique. Make the evidence understandable inside a useful product and show what happens when confirmation is incomplete. |
| [DockBrief contribution #476](https://github.com/CALLE-AI/awesome-phone-call-agents/pull/476) | Submitted code includes offline SDK transport tests, saved request/key recovery and careful disclosure of incomplete live evidence | Include a meaningful SDK serialization test and honest live-proof reporting. A high test count is not the objective. |

Evidence inspected: DockSignal `lib/rules.ts` (blob `e28995090b5b89ffa9c33e116ce323861c174a59`), `lib/dispatch.ts`, `app/globals.css`, README and its upstream skill; ResolveCall `policy_engine.py` (blob `ae3ead0aa2489862d5c2f8dcb4f791caca34fb5a`) and `orchestrator.py`; Verity SKILL.md (blob `9683e18dfb8f726687b7cc85b559d275140c2b43`); DockBrief PR file patches. These are scoped observations, not an exhaustive competitor audit.

Two concrete lessons from the inspected code: ResolveCall's time parser removes timezone information from parsed ISO values and has a 09:00 fallback for certain relative-date inputs. Its inspected orchestrator maintains incident state in memory. DockSignal's recovery rules classify a reached follow-up with `can_accept = conditional` as `exception_granted`. DwellGuard must preserve offsets, persist its state, and keep unresolved conditions out of its confirmed outcome. These observations are limited to those files, not claims that every competitor deployment behaves identically.

### FirstFrame strategy, applied correctly

[FirstFrame's project page](https://devpost.com/software/firstframe) presents a visible improvement, app-measured timing, sponsor-dependent functionality, inspectable failure handling and upstream contributions. It is listed there as a Grand Prize winner. Our inference is to make the benefit visible and verifiable, not to copy its surface design or assume we know the judges' private reasoning.

For DwellGuard: show the feasible appointment range as soon as the driver result is validated; let the audience watch it determine the dock request; finish with an actual acknowledged handoff. Measure that run. Contribute the reusable implementation, not just a promotional link.

---

## 2. Locked product and demonstration

**One sentence:** DwellGuard calls the driver and receiving dock to arrange a late truck's revised appointment within pre-authorized limits, then presents the confirmed plan to the driver.

**Audience:** a dispatcher coordinating an existing load with authorized driver and receiving contacts. No cold outreach or production warehouse integration is required for the controlled demonstration.

### The memorable sequence

1. A shipment's updated ETA makes its original appointment impossible.
2. The dispatcher approves the recipients, allowable times, fee ceiling and two-call task budget once.
3. CALL-E asks the driver for exact arrival and check-in limits and explicit permission to select a slot within them.
4. The app computes the feasible interval. The screen visibly changes from the original authority to the narrower driver-compatible range.
5. That computed range becomes the dock call's instructions. The dock explicitly confirms the load, date, time, timezone, appointment meaning, total additional fee and relevant conditions.
6. The server validates the evidence and saves the appointment receipt.
7. On a second device, the driver's previously opened handoff page shows that same plan. The driver taps **“I've received this plan.”** The dispatcher sees the acknowledgment.

This is the complete presentation path. Two CALL-E tasks plus a browser acknowledgment; do not call it three phone calls or imply that a website tap is a voice result.

### One controlled variation

Use a changed driver ETA/availability in a rehearsal so the dock request and final plan differ from the original fixture. For example, the driver now allows 11:35–11:50 rather than 11:25–11:40. The software must derive the new request; no scenario-name branch may choose the answer.

For the final video, use the clearest successfully recorded run. Do not gamble on an unrehearsed surprise or conceal a scripted role-play. Use one clearly labelled offline fee-refusal replay to show the boundary without spending more call credits.

### Three distinct outcomes

- **Dock plan confirmed:** evidence supports the phone confirmation and the frozen policy. This is the local `COMMITTED` state.
- **Driver acknowledged:** the recipient of the scoped handoff link acknowledged this exact receipt version. This completes the demonstrated coordination, but is not proof of physical identity or arrival.
- **Dispatcher action needed:** the plan is unresolved, refused, outside authority or possibly changed externally without adequate confirmation. Show the next practical action.

A local receipt does not prove a warehouse database write, TMS synchronization, legal transaction finality or successful unloading. In the demo, all contacts are consenting role-players; shipment inputs are explicitly seeded or operator-entered.

---

## 3. Premium frontend specification

### Visual direction: a carefully designed logistics desk

Build a deliberate composition with an ink-blue navigation rail, warm ivory working canvas, paper-like appointment surfaces and precise typography. Use darkness as framing, not as a full-screen wall of identical panels. The shipment and the appointment are the visual centre.

No cyberpunk, neon outlines, glowing agent nodes, fake waveforms, moving world maps, decorative KPI grids, giant generic marketing hero, invented badges or placeholder nav items. No gratuitous 3D, parallax or scroll smoothing. Use native scrolling.

### Design tokens

| Token | Value / rule |
| --- | --- |
| Navigation ink | `#172B3A` |
| Main canvas | `#F4F1EA` |
| Raised paper | `#FFFEFA` |
| Primary text | `#182B36` |
| Secondary text | `#5B6870` |
| Structural border | `#D9DED9` |
| Primary action | `#254B62`, with light text |
| Confirmed state | `#24654B` on `#E8F1EA` |
| Attention state | `#8A561B` on `#FBF0DB` |
| Hard failure | `#A63F36` on `#F9E9E6` |
| Typography | One locally served sans family; system fallback. Prefer Inter if available without adding a blocking font dependency. |
| Type scale | Page title 32–40px; major appointment time 40–56px; section title 20–24px; body 15–16px; metadata 12–13px. |
| Layout | 8px spacing rhythm; 24–32px section gaps; content max-width about 1440px. |
| Corners | 8–12px on working surfaces; pills only for concise status labels. |
| Motion | 140–220ms for controls, at most 300ms for state changes; respect reduced motion. |

These are design specifications, not measured accessibility results. Check actual contrast combinations during the UI pass. Border colors are not text colors. Use tabular numerals for clocks and amounts. No tiny uppercase paragraphs.

### Pages and their jobs

| Route | Purpose and composition |
| --- | --- |
| `/` | Shipment desk. Compact navigation, date and operations heading, one prominent at-risk shipment, then a readable list of 3–5 fictional loads. Filters only if functional. |
| `/incidents/new` | Short operator form: load, facility, appointment, ETA, timezone and server-defined contact references. Progressive validation; no raw JSON entry. |
| `/incidents/[id]` | Appointment workspace: shipment context, the shared time display, current action, driver/dock facts, and a focused authority panel before launch. |
| `/receipts/[id]` | Appointment document: previous and new time, door, explicit fee, confirmation basis, driver acknowledgment and expandable evidence. Print CSS and JSON download only. |
| `/handoff/[token]` | Mobile driver page: pending state or final load/time/door details, then one receipt acknowledgment button. No operator controls or private transcript. |
| `/demo` | Public isolated offline scenarios; persistent “Offline replay — no call is being placed” label. |
| `/about` | Brief explanation of the problem, real versus simulated parts and limitations. Keep it short. |

Navigation should remain simple: **Shipments · Demo · How it works**. Do not invent empty Analytics, Billing, Teams or Settings pages.

### Appointment workspace at desktop size

The hierarchy must work at a glance:

1. **Top:** load reference, destination, local date/timezone and plain-language state.
2. **Main left area, roughly two-thirds:** a large old/new appointment treatment followed by one shared time display. Below it, the latest meaningful action and compact driver/dock evidence sections.
3. **Right area:** before launch, the editable authority card; after launch, its frozen summary and stop control. After a terminal result, replace its primary content with the receipt or human handoff.
4. **Lower area:** expandable evidence and concise event history. Never make a technical audit log dominate the screen.

The interface should explain: **What changed? What is happening now? What needs me?** Only one primary action per state. Green appears only for the confirmed fact or completed step it represents.

### Signature component: the shared appointment time display

Use one common, correctly scaled time axis, not a decorative progress bar. Show:

- original appointment marker;
- operator-authorized interval;
- driver-approved check-in interval after evidence arrives;
- computed overlap;
- explicitly confirmed dock point/window when available.

All positions come from timestamps. An absent interval is labelled unknown, not drawn as zero. Keep the original appointment visible; label date rollover. Do not imply that an unoffered time is available at the warehouse. Before dock confirmation the overlap means **“Within our limits”**, not **“Available dock slots.”**

A click or keyboard action on the driver interval opens the supporting fact; the receipt links to the same evidence. When the driver's range changes, the overlap changes because server data changed. A short transition may connect the states visually; never animate fabricated facts.

On mobile, stack the appointment, current step and action first. Replace the dense axis with labelled intervals if it becomes unreadable. Do not shrink text or require horizontal scrolling to understand the outcome.

### Driver handoff page

Design it as a compact appointment pass, not a phone-shaped dashboard. Large time, full date/timezone, load reference, facility, door if established, and “I've received this plan.” Before confirmation show “Your revised plan is being arranged.”

For the demonstration, the operator opens the generated scoped link on the consenting driver's phone before starting; a QR code is optional. The app does not send SMS or guarantee notification to a closed browser. Acknowledgment updates the dispatcher through normal server state. UI polling observes progress and never owns phone execution.

### Required interaction quality

- Keyboard-accessible forms, dialogs, evidence disclosure and buttons; visible focus.
- Real pending, empty, error, stopped, expired and stalled states.
- Prevent double submission on the server as well as in the button.
- Preserve entered form values after validation errors; place errors beside fields.
- Do not move focus or auto-scroll while a person is reading.
- Evidence shows its origin; summaries and verbatim quotes have different labels.
- Receipt and handoff must agree on receipt ID/version, date, time, fee and status.
- Long references wrap; no overflow at 390, 1280 and 1440px.
- Slow network shows stale/read-only information honestly; it must not become a false success.

### Visual acceptance gate

Capture the actual app at desktop and mobile in four states: ready to authorize, driver range received, confirmed, and human required. Review the screens once, then fix specific hierarchy/overflow/contrast issues. Do not create a new theme run or cycle through design alternatives.

---

## 4. Technical contract

### Stack and scope

Next.js App Router, strict TypeScript, Tailwind, Zod, official `@call-e/calle`, Supabase Postgres, Vitest, Vercel. Use an existing compatible lockfile if present; otherwise choose stable packages once and freeze them. Do not upgrade dependencies during polishing without a concrete blocker.

Business logic depends on a Store interface and a CalleGateway interface. Provide deterministic in-memory fixtures and a deployed Supabase implementation. No extra LLM, speech provider, maps, billing, multi-tenancy, TMS, telematics vendor, EDI, warehouse booking API or SMS service.

### Provider contract: verify once in Run 1

[CALL-E Calls documentation](https://docs.heycall-e.com/calls) distinguishes the top-level CallTask `id` from attempt-level `provider_call_id`. Save the former as `calle_call_id`. It documents stable idempotency keys, recovery by replaying an unchanged saved request when its ID was lost, and retrieval for known IDs. Its schema subset does not support arbitrary Zod-generated unions. Do not infer success from lifecycle status or completion confidence; client cancellation of an already-created call is not documented.

Record the installed SDK version, actual method/options, result mapping and supported wire schema in one short contract note. Keep uncertain wire values explicit; normalize to application nulls only in the adapter. Validate dates, currencies and business semantics locally.

[CALL-E webhook documentation](https://docs.heycall-e.com/webhooks) describes unsigned terminal events. Validate event-ID consistency and shape, then retrieve the stored task with server credentials before business transitions. Incoming webhook values are not trusted evidence.

Pakistan was listed in the [region documentation](https://docs.heycall-e.com/regions) during the earlier review, alongside a warning about temporary destination restrictions. Actual account/route availability must be checked in Run 1. Do not promise routing from an E.164 format check alone. Use two consenting `+92` recipients if supported; investigate formatting/account/carrier errors before one authorized fallback. Do not buy a foreign SIM or Twilio account preemptively.

### Environment example

```dotenv
CALLE_API_KEY=
CALLE_BASE_URL=https://api.heycall-e.com
LIVE_CALLS_ENABLED=false
ALLOWED_TEST_PHONES=
DEMO_DRIVER_PHONE=
DEMO_DOCK_PHONE=
DEMO_REGION=PK
DEMO_TIMEZONE=Asia/Karachi
DWELLGUARD_MODE=fixture
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APP_ORIGIN=http://localhost:3000
OPERATOR_ACCESS_SECRET=
SESSION_SIGNING_SECRET=
RECOVERY_RUNNER_SECRET=
```

Secrets and real phones stay server-side and gitignored. `.env.example` contains empty secret fields and safe defaults. Live operation requires explicit enabled mode, authorized recipients and an authenticated operator. Executing an automated test must never dial. Refuse client-supplied recipient numbers, arbitrary CALL-E URLs, custom live prompts or mode overrides. Restrict the provider origin to the verified service origin.

### Minimal durable model

Use UUIDs internally and human-readable references separately. One incident may have a versioned run; a new attempt is never hidden by resetting a previous live record.

| Record | Essential content |
| --- | --- |
| Incident/run | Load/facility references, original appointment, latest ETA, timezone, revision, state, source, frozen execution mode, timestamps |
| Authority | Version, actor, recipient references, interval, fee ceiling in integer minor units, currency, buffer, allowed purposes, task budget, expiry, policy hash |
| CallTask | Role/purpose, run/authority version, unique semantic key, exact saved request and hash, `calle_call_id`, status, attempts observed, timing, normalized result |
| Evidence | Task/recipient/attempt reference, field, raw and normalized value, source category, quote/turn reference when present, certainty, freshness |
| WorkflowJob | Inbox/reconcile/dispatch/finalize kind, unique dedupe key, pending/leased/done state, lease owner/version/expiry, next attempt time, error |
| Receipt | One per run, exact point or window, door if known, fee/currency, authority version, evidence IDs, checks, payload fingerprint, commit time |
| AuditEvent | Unique material event, run revision, actor/source and sanitized details |
| Handoff | Scoped token hash, expiry, receipt version, acknowledgment timestamp |

Policy checks may live in the receipt/run JSON if a separate table adds no value. One small jobs table can serve inbox/outbox roles; separate queue services are unnecessary. Use database constraints and transactions for correctness, not a proliferation of tables.

### Deterministic scheduling and confirmation

Driver result: reached and shipment recognition with unknown states; exact ETA; earliest/latest acceptable check-in; explicit delegated selection permission; relevant constraints and supporting evidence.

Compute:

```text
feasible_start = max(authority_start, driver_start, ETA + explicit_buffer)
feasible_end   = min(authority_end, driver_end)
```

If start exceeds end, no valid point exists and no dock request is dispatched. Equality permits a point only when the authority explicitly allows point appointments; a time window requires positive duration. Do not require the driver to arrive before their ETA. Do not treat ETA as permission to select any later slot.

Generate a small set of permitted check-in choices from this interval, using an explicit demo increment if needed. Tell the dock agent exactly which points or range are authorized. These are permitted requests, not warehouse availability. Any dock alternative must still satisfy the same frozen limits. Unknown constraints require a human.

Dock result: reached, shipment/facility recognition, offered/confirmed/conditional/declined/unknown status, appointment kind, exact point or bounds, total fee and currency, conditions, reference if provided, and final read-back evidence. “I can offer 11:30” does not mean “11:30 is booked.”

Persist UTC timestamps and the facility IANA timezone. Confirm the full date/timezone aloud. Reject ambiguous relative dates, nonexistent/ambiguous local times, reversed windows and stale evidence. Do not silently replace “tomorrow” with 09:00 or discard timezone offsets. Require a confirmed point inside the feasible interval, or an entire confirmed window inside it.

Use integer minor units: USD 150 = 15000. Unknown fee is not zero. Require explicit total additional fee and currency; no FX conversion. The demo currency is an input, independent of the test phone's country. No money is actually paid by this application.

### State and finalization

```text
EXCEPTION_DETECTED -> AUTHORITY_READY -> DRIVER_PENDING
-> DRIVER_VERIFIED -> DOCK_PENDING -> POLICY_VALIDATION -> COMMITTED
```

From any relevant step, allow `UNRESOLVED`, `CONFLICTED`, `HUMAN_REQUIRED` or `RECONCILIATION_REQUIRED` with precise reasons. Store stop intent separately so an in-flight call can still be reconciled. Track handoff independently as `pending | acknowledged | expired`; a booking stays confirmed even if the driver has not acknowledged it.

Commit requires current authority, unexpired evidence, known task IDs, appropriate terminal results, explicit shipment recognition, driver permission, feasible time, known permitted fee, explicit dock confirmation, no unresolved condition/conflict, available task budget and no stop/stale-revision conflict.

Commit receipt, checks, audit event and incident state together in one database transaction. A stale worker must not finalize over a newer revision. A receipt fingerprint is a local consistency aid; someone who can alter both data and hash can replace both. No “immutable proof” claim.

### Real-world boundaries

Prompt instructions constrain what the agent should say; post-call deterministic checks constrain what the application will record. The latter cannot undo a spoken agreement. If evidence suggests unauthorized acceptance or an uncertain external booking, route to reconciliation and disclose possible external change. Never imply an automatic rollback or show a clean refusal when the call may already have committed externally.

Conversation content cannot modify authority, destinations, secrets or tool configuration. A recipient's “ignore your rules” is untrusted data. Display text safely. Require recipient-attributed evidence of critical facts; a bot question, schema-valid extraction or high confidence is insufficient. Do not build a general natural-language theorem prover: use the narrow read-back contract, preserve corrections and abstain when it cannot establish the result.

### Durable execution and recovery

Implement `advanceIncident()` as short, restartable server steps. Before external I/O, atomically reserve the task budget, create the semantic call intent, freeze its exact request and obtain a fenced job claim. Use one stable key per `(run, authority_version, role, purpose)`. Renewal/reclaim uses the persisted key and request, never a newly generated semantic task.

No database transaction stays open during network I/O. Save the returned CallTask ID promptly. Final writes require the current lease/revision. Never rely on disabled buttons, module globals or the browser tab for idempotency.

| Failure point | Recovery |
| --- | --- |
| Request not yet sent | Resume the same claimed intent |
| Create response lost, exact request/key saved | Supported replay of that same request/key; persist recovered ID |
| ID already known | Retrieve the existing task only |
| Neither ID nor reproducible request is available | `CREATE_UNCERTAIN`; no automatic redial |
| Webhook duplicated | Resume unfinished durable job or acknowledge completed job; no duplicate effects |
| Process dies after inbox storage | Recover pending job; do not confuse “received” with “processed” |
| Dock confirmed but receipt write failed | Reconcile and finalize from persisted evidence; no second booking call |
| Stop/revision change while call is active | Block later dispatch, retain result, reconcile possible external change |

For a webhook, persist the work before processing; fetch trusted state, perform bounded advancement, then mark done. Do not return success and depend on an unawaited promise. Keep timed-out work recoverable. Provide `pnpm worker:recover --watch` using the same claim logic. Start it for the demo if no verified hosted recovery scheduler exists; disclose this dependency. Do not claim always-on recovery from a local script that is not running.

### Access and handoff

Public routes expose only isolated fixtures and intentionally published, redacted proof. Protect live writes AND private reads with a short-lived server-verified operator session. Use a server-only login secret, signed HttpOnly cookie, Secure in production, SameSite and request-origin/CSRF protection. Rate-limit login, writes and webhooks. Private tables need appropriate RLS/grants, but service-role access still requires route-level authorization.

Handoff uses an unguessable random token of at least 192 bits, stored hashed, scoped to one run and limited lifetime. Treat possession as limited access, not identity verification. Avoid logging tokens; use no-store and no-referrer responses, no third-party assets/analytics, and expose no transcript or unrelated load. Bind acknowledgment to the current receipt ID/version, reject expired/revoked links, and make repeat taps idempotent. Test expiration and version mismatch. It grants acknowledgment only, never booking authority.

---

## 5. Three runs, with fixed internal checkpoints

**Why three:** Run 1 proves the sponsor path before heavy development. Run 2 builds the engine and persistence together, avoiding a throwaway in-memory application followed by a rewrite. Run 3 completes the UI, evidence and release. The reduction is in repeated setup, reports and verification, not in essential safeguards.

| New run | Work combined | Suggested share of remaining build time |
| --- | --- | --- |
| 1 — Foundation and proof | Former foundation plus provider contract, tiny deploy check and UI skeleton | 20% |
| 2 — Working coordination product | Former core + persistence/recovery + functional pages and handoff | 45% |
| 3 — Product finish and submission | Former frontend finish + release evidence and contribution | 35% |

These percentages guide scope; they are not runtime or token estimates. Three runs are not a promise of a specific speedup. No default Runs 1.1/2.1/4/5. Fix a failed checkpoint inside its current run, then continue. A brief checkpoint commit/report preserves progress if context is interrupted; it does not require a new user turn.

### Run 1 — Foundation and real CALL-E proof

**Mission:** create a sound foundation and learn whether the actual sponsor call route works.

1. Inspect existing files and Git state. Preserve user work; do not reinitialize an existing repo. The master file may already exist in an otherwise empty repository.
2. Scaffold Next.js/TypeScript/Tailwind, lock versions, add Zod, SDK and Vitest. Use the existing package manager if one is established.
3. Create `lib/domain`, `lib/calle`, `lib/stores`, `lib/security`, `fixtures`, `tests`, `docs`, and `supabase/migrations`. Interfaces precede implementations.
4. Implement mode, allowlist, masking, safe errors and test no-call gates. Define wire/domain schemas and inspect actual SDK types. Add one SDK fixture-transport test proving request serialization and idempotency option placement.
5. Create a server-only probe that persists the exact request/key before creation, saves the returned CallTask ID and retrieves its result. Private runtime data goes in gitignored `.runtime/`. Automated tests never invoke this live command.
6. When credentials and explicit authorization for the named consenting test recipient are present, perform one minimal live probe. Ask for one precise fictional ETA and capture the real result. Show automated-assistant disclosure. Do not retry across numbers without investigating the error and existing call state.
7. Add the design tokens, navigation and one fixture shipment page. No detailed design polishing yet. Attempt a minimal deploy/build smoke check when access is configured; do not block the provider probe on deployment setup.
8. Write one short report in `docs/run-1.md`: code commit, installed SDK contract, tests/build actually run, proof status, calls used, exact blocker and next command. Keep evidence sanitized.

**Exit:** build succeeds, fixture path needs no keys, server-only boundaries are in place, SDK request contract is exercised and real proof is either recorded or explicitly `BLOCKED_LIVE`.

If live access is blocked, stop repeated provider experiments and complete useful fixture work. Run 2 may proceed with the live blocker visible. Do not rename the blocked gate PASS. Deployment access may also remain clearly marked pending.

### Run 2 — Complete working coordination loop

**Mission:** produce the functional product on durable state, including the driver handoff.

Checkpoint A — domain and persistence:

1. Implement versioned authority, full-date interval arithmetic, point/window validation, fee/currency checks, evidence provenance and reason codes.
2. Build MemoryStore for isolated fixtures and SupabaseStore with migration, unique semantic keys, atomic task budget reservation, fenced jobs and final receipt transaction. Use database RPC/transactions for multi-record atomic changes; avoid a sequence of client calls pretending to be a transaction.
3. Implement driver task compilation, evidence normalization, feasible interval computation, dock task compilation and exact confirmation read-back. Add no general LLM layer.
4. Create four useful fixtures: valid agreement, changed driver range, fee refused, ambiguous/conditional booking. Additional edge cases belong in tests, not extra demo screens.

Checkpoint B — execution and real pages:

5. Implement durable dispatch, webhook hint intake, trusted retrieval, recovery worker, stop intent and stale-result handling. Keep provider task status separate from business outcome.
6. Implement operator session and protected live routes. Public replay remains isolated and cannot enable live mode or mutate live data.
7. Build all functional routes from Section 3 with the shared timeline, authority preview, evidence disclosure, receipt, human handoff and mobile acknowledgment. All displayed facts come from domain records.
8. Implement the scoped handoff token and receipt-version acknowledgment. Test cross-run access, expiry and repeat taps. Public replay uses synthetic handoff state only.
9. Run focused fixture verification below. Include one real database concurrency/transaction test using synthetic provider responses; do not substitute MemoryStore evidence for a database guarantee.
10. If the live gate passed, perform one authorized two-task role-play and actual browser handoff. Derive the dock request from the real driver result. Record success or exact failure; do not create a replacement result.

**Exit:** a user can create an exception, grant authority, observe the dependent calls or honest fixture replay, inspect a truthful receipt/handoff, and acknowledge the current plan. Refresh/restart/duplicate requests cannot knowingly create a second semantic call. Failed boundaries do not produce a green plan.

Prepare the upstream contribution's smallest runnable core now so repository requirements are not discovered in the final hour. No need to open an extra product PR.

### Run 3 — Premium finish, evidence and release

**Mission:** improve what judges see, prove the core story and prepare the actual submission.

1. Apply the design specification to the working pages. Correct hierarchy, density, spacing, type, states, contrast and mobile flow. One theme, one focused pass; no redesign loop.
2. Verify the whole journey on desktop and phone. Screenshot four meaningful states. Test keyboard actions, expired handoff, stalled recovery and ordinary form errors. Fix specific findings.
3. Finish the controlled demonstration. Prefer the successful Run 2 live run; repeat only to resolve a concrete problem or capture essential evidence. Never spend calls to improve an arbitrary test count.
4. Produce README, concise architecture/testing/limitations notes, demo script and copy-ready Devpost content. Consolidate related documentation; do not create a library of repetitive reports. Include measured timestamps, live task IDs in sanitized proof, source type and actual limitations.
5. Prepare the reusable CALL-E contribution under the current upstream contribution area. Prefer a small runnable TypeScript implementation of the authority/driver-window/confirmation contract with no-call examples and tests. Do not submit a generic prompt-only dock caller or copy competitors' code without license compliance and attribution. Check current upstream `AGENTS.md`, contribution format and validation command before editing that repository.
6. Validate the contribution and prepare its exact PR body and files. Open the required upstream PR when session authorization covers publishing it; otherwise leave a concrete ready-to-open contribution and explicitly record that required action. A merged PR is not the requirement. Avoid unrelated issues or PRs.
7. Run one final typecheck, lint, relevant tests, production build and secret scan after substantive changes. Reuse unaffected earlier results instead of repeating every suite at every documentation edit.
8. Verify the deployed app, public no-call replay, private live boundaries and actual video URL. Finish `docs/release-checklist.md` with artifact links, exact status, remaining manual actions and no invented PASS entries.

**Exit:** the live proof, deployed experience, reproducible offline path, driver acknowledgment, evidence, upstream PR link and actual playable public video are ready. A written video script alone is not submission-ready. Final Devpost submission remains an explicit user action unless already authorized in the session.

---

## 6. Focused verification and credit discipline

Every test should protect a meaningful contract. Do not write snapshot tests that merely freeze wording or duplicate implementation line by line.

Required fixture assertions:

- Positive case commits, changed driver range changes the generated dock request.
- Driver permission absent, wrong shipment or empty overlap prevents automatic dock booking.
- Point/window boundaries, full dates, midnight rollover, timezone offsets and ambiguous local times behave correctly.
- Unknown/wrong-currency/out-of-authority fee, conditional offer or missing read-back cannot commit.
- A bot question, clipped qualifier, later correction or fabricated quote cannot become confirmed recipient evidence.
- Same-key replay preserves the original request; known-ID recovery never POSTs a replacement call.
- Concurrent launch reserves one task budget; simultaneous finalization produces one receipt.
- An inbox event recorded before a crash still gets processed on recovery.
- Forged webhook contents, stale authority and stale worker revisions cannot finalize.
- Stop blocks future tasks; a late possible booking change becomes reconciliation.
- Anonymous requests cannot dial or read private live records.
- Handoff acknowledgment requires the correct unexpired token and exact receipt version.
- Closing the operator browser does not terminate server-owned progress; a running recovery worker resumes interrupted work.

The live-call spending plan is a budget, not a requirement: one probe, one two-task golden run, and at most one additional two-task rehearsal if needed. Keep a separate observed physical-attempt count because provider retries are not equivalent to application tasks. Once sufficient proof exists, stop optional calls.

Cut first when time is short: extra scenarios, custom icons, elaborate animation, charts, QR generation, optional PDF output and full theme switching. Preserve the core loop, readable UI, actual CALL-E evidence, access control, recovery and submission artifacts. Do not cut a security boundary to make an anonymous live demo.

---

## 7. Three-minute demo and proof contract

| Time | Screen / real action | Narration purpose |
| --- | --- | --- |
| 0:00–0:15 | At-risk load; original appointment and changed ETA | Establish one understandable problem. |
| 0:15–0:30 | Authority preview and one activation | Show exactly what the system may decide. |
| 0:30–1:00 | Actual driver call excerpt, then evidence-driven time range | Make human information visibly change the software. |
| 1:00–1:35 | Dock request shaped by that range; actual confirmation excerpt | Demonstrate dependent action, not two unrelated calls. |
| 1:35–2:00 | Confirmed appointment, then driver phone page and acknowledgment | Finish the operational handoff visibly. |
| 2:00–2:25 | Clearly labelled offline $150 request against $0 authority | Show refusal or reconciliation truthfully. |
| 2:25–2:45 | Inspect the supporting evidence and measured timing; concise architecture | Let judges verify the claim without reading raw logs. |
| 2:45–3:00 | Working receipt and reusable contribution | Close with the outcome and sponsor's role. |

Suggested close: **“The delay happened. The plan kept moving.”**

Show “Controlled test recipients” on live role-play footage and “Offline replay” on fixture footage. Edit ringing/dead air honestly; edited video length is not workflow duration. Avoid invented provider audio/transcripts or reenacted evidence presented as live.

Measure separately:

- exception detection to local appointment confirmation;
- authorization to confirmation;
- confirmation to driver acknowledgment;
- dispatcher actions/calls after authorization that were actually observed.

A driver answering a call and tapping acknowledgment is human participation; do not claim “zero human involvement.” The defensible goal is zero dispatcher phone calls after the initial authorization for the demonstrated in-policy run. Do not claim cost savings or a human baseline without evidence.

The [official event overview](https://call-e.devpost.com/) requires an upstream contribution PR URL, approximately three-minute public video and CALL-E account email; the functional demo URL is optional on the submission form. The displayed deadline during this review was **14 September 2026, 15:45 UTC / 20:45 Pakistan time**. Recheck the official page before submission; keep the account email private. [Full rules](https://call-e.devpost.com/rules).

---

## 8. What the operator needs

1. Clone/open `Syedsaadhhh/DwellGuard-AI` in Antigravity and keep this file at the project root.
2. Have the CALL-E account and server API key ready locally. Do not paste secrets into chat or screenshots.
3. Arrange two consenting test recipients and their E.164 numbers. One can serve the Run 1 probe; both are needed for the driver/dock proof.
4. Use a separate DwellGuard Supabase project; do not modify COMMONS or another project's database.
5. Have Vercel/GitHub access and a phone browser available for the scoped handoff page.
6. Reserve time for recording, public video upload and submission. These are manual deliverables, not extra coding runs.

No additional AI API, paid UI tool, SMS account or map provider is required by this plan.

## 9. Copy-ready Antigravity launch prompts

Paste one prompt at a time. There is no need to paste all of this document into the chat when it is already in the repository.

### Start Run 1

```text
Read DWELLGUARD_ANTIGRAVITY_MASTER.md completely. It supersedes the older five-run files.
Execute RUN 1 only, including its shared technical and design requirements. Inspect existing code first and preserve working files. Use fixtures for automated tests and verify the installed CALL-E SDK contract. Only run the live probe when the actual recipient authorization, credentials and live gates are configured. If blocked, complete useful offline work and record BLOCKED_LIVE honestly. Do not add features, research loops, extra runs or separate design artifacts. Produce the short Run 1 report and stop at its exit gate.
```

### Start Run 2

```text
Read DWELLGUARD_ANTIGRAVITY_MASTER.md and docs/run-1.md. Execute RUN 2 only. Build the engine and durable storage together, then the functional appointment workspace, receipt and scoped driver acknowledgment. Complete internal checkpoints in this same run. Keep every live gate and evidence boundary. Run focused tests for actual remaining risks; preserve prior passing work. Use the configured live authorization for one necessary golden-path proof only when ready. Record the exact outcome and stop at the Run 2 exit gate. Do not invent a Run 2.1.
```

### Start Run 3

```text
Read DWELLGUARD_ANTIGRAVITY_MASTER.md and the latest run report. Execute RUN 3 only. Finish the specified premium logistics interface with one focused visual pass, verify desktop/mobile behavior, finalize the evidence and submission package, and prepare the reusable upstream contribution. Reuse sufficient live proof and unaffected passing tests. Do not add features or a fourth run. Report actual deployed/video/PR status and the precise remaining manual actions; never label missing live proof or a video script as submission-ready.
```

**Final build principle:** make the first phone result change the next action, make the final agreement visible to the driver, and make every displayed success explainable. Everything else must earn its place.
