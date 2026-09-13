# CALL-E Provider Contract & Wire Specification

**Installed SDK:** `@call-e/calle@0.7.0`  
**Package Repository:** `https://github.com/CALLE-AI/server-sdk-typescript`  
**Contract Date:** 13 September 2026

## 1. SDK Installation & Initialization

The project imports the official TypeScript SDK:
```typescript
import { CalleClient } from "@call-e/calle";

const client = new CalleClient({
  apiKey: process.env.CALLE_API_KEY!,
  baseUrl: process.env.CALLE_BASE_URL || "https://api.call-e.com",
  fetch: customFetch, // optional injection for test transport & replay
});
```

## 2. Wire Contract & Request Serialization

### Call Task Creation
- **Method:** `client.calls.create(input, options)`
- **HTTP Target:** `POST /v1/calls`
- **Idempotency Placement:** In the HTTP request header:
  ```http
  Idempotency-Key: <idempotency_key>
  ```
  The SDK receives `options.idempotencyKey` and injects it into OpenAPI headers `params: { header: { "Idempotency-Key": options.idempotencyKey } }`.
- **Payload Serialization:**
  - `task`: Plain text directive for the voice agent.
  - `recipient`: `{ phone: string, locale?: string, region?: string }` mapped to `recipients: [{ phones: [phone] }]`.
  - `metadata`: Key-value JSON object containing `incident_id`, `load_ref`, `authority_version`.
  - `webhookUrl`: Callback destination for call lifecycle events.

### Call Task Retrieval
- **Method:** `client.calls.get(callId)`
- **HTTP Target:** `GET /v1/calls/{call_id}`
- **Task Identity Rule:**
  - The top-level CALL-E CallTask identifier (`call.id`) is stored as `calle_call_id`.
  - Attempt-level telephony IDs (`call.recipients[0].attempts[0].providerCallId`) are stored as `provider_call_id` and never conflated with `calle_call_id`.

## 3. Idempotency & Failure Recovery

| Condition | SDK / Gateway Action |
| --- | --- |
| Request not sent | Resume intent with saved `idempotency_key`. |
| Response lost but request saved | Replay exact request using same `idempotency_key`. |
| `calle_call_id` already known | Invoke `client.calls.get(calle_call_id)` exclusively; never call `create()` again. |
| Inbound webhook received | Webhook payload treated as untrusted hint; retrieve authoritative task state via `client.calls.get()`. |

## 4. Gating & Offline Replay Safety

- In production without `CALLE_API_KEY`, live creation fails cleanly with `BLOCKED_LIVE (Missing credentials)`.
- Public replay routes (`/demo`) and tests bind exclusively to `FixtureCalleGateway`, which operates in-memory with zero network I/O and cannot dial.
