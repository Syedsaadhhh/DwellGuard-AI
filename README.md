# DwellGuard

**Keep the dock plan moving.**

DwellGuard is a CALL-E-powered coordination assistant for late freight arrivals. Within dispatcher-approved limits, it calls the driver to learn the real arrival window, uses that result to shape the dock request, verifies the dock's confirmation, and presents the revised plan back to the driver for acknowledgment.

> Build status: implementation in progress. The repository currently contains the final build specification; capabilities are not considered complete until they are implemented and verified.

## The problem

A late truck often starts a manual chain of calls between dispatchers, drivers, and receiving docks. That process is slow, easy to miscommunicate, and difficult to audit.

DwellGuard focuses on one practical outcome: turn a disrupted appointment into a clear confirmed plan without giving the system unlimited authority.

## Core flow

1. A dispatcher selects the shipment and approves the recipients, time limits, fee ceiling, and call budget.
2. CALL-E asks the driver for the expected arrival and permitted check-in window.
3. DwellGuard computes the overlap with the dispatcher's authority.
4. That exact range shapes the receiving-dock call.
5. The dock must explicitly confirm the shipment, date, time, timezone, appointment meaning, fee, and conditions.
6. DwellGuard validates the evidence and creates a versioned appointment receipt.
7. The driver's scoped handoff page displays the plan and records acknowledgment.

If the evidence is incomplete, conditional, or outside authority, DwellGuard does not show a false success—it routes the case to a dispatcher.

## Why it is different

The first call materially changes the next action. DwellGuard is not a generic calling dashboard or two unrelated phone demos: driver-approved constraints become the dock request, and the resulting agreement is visibly handed back to the driver.

The system is designed around:

- explicit, versioned human authority;
- dependent driver-to-dock coordination;
- conservative evidence validation;
- idempotent calling and restart-safe recovery;
- honest separation of phone confirmation, local receipt, and driver acknowledgment;
- a public offline replay that cannot trigger live calls.

## Planned stack

- Next.js App Router, TypeScript, and Tailwind CSS
- Official `@call-e/calle` SDK
- Supabase Postgres
- Zod and Vitest
- Vercel

## Build source of truth

[`DWELLGUARD_ANTIGRAVITY_MASTER.md`](./DWELLGUARD_ANTIGRAVITY_MASTER.md) is the single implementation authority. It contains the technical contract, premium interface direction, three execution runs, verification gates, demo plan, and CALL-E contribution requirements.

Older five-run plans are superseded.

## Safety and scope

Live calls are limited to named, consenting test recipients and server-defined contacts. Secrets stay server-side. Public demo routes use isolated fixtures and cannot enable live mode. A DwellGuard receipt records what the application verified; it does not claim a warehouse-system write, legal finality, or physical arrival.

## Hackathon

Built for **CALL-E: Your Code Is Calling**, targeting the **Most Practical Use Case** prize.

## License

Released under the [MIT License](./LICENSE).
