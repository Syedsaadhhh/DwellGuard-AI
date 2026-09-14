import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/webhooks/calle/route";
import * as contextModule from "@/server/context";
import { MemoryStore } from "@/infrastructure/store/memory-store";
import { CalleGateway, CalleTaskResult } from "@/domain/ports/calle-gateway";
import { SystemClock } from "@/domain/ports/clock";
import { CryptoTokenGenerator } from "@/domain/ports/tokens";
import { Incident } from "@/domain/types";

describe("CALL-E Webhook Boundary & Deduplication", () => {
  let store: MemoryStore;
  let mockGateway: CalleGateway;
  const clock = new SystemClock();
  const tokenGenerator = new CryptoTokenGenerator();

  beforeEach(async () => {
    store = new MemoryStore(false);

    mockGateway = {
      createCallTask: vi.fn().mockResolvedValue({
        calleCallId: "call_task_dock_mock",
        status: "in_progress",
        summary: "Dock call initiated",
        rawResponse: {},
      } as CalleTaskResult),
      getCallTask: vi.fn().mockResolvedValue({
        calleCallId: "call_task_123",
        status: "completed",
        structuredResult: {
          verified_interval_start: "2026-09-14T11:30:00-04:00",
          verified_interval_end: "2026-09-14T12:30:00-04:00",
          selection_permitted: true,
          evidence_text: ["Driver confirmed"],
        },
        rawResponse: {},
      } as CalleTaskResult),
    };

    vi.spyOn(contextModule, "getStore").mockReturnValue(store as any);
    vi.spyOn(contextModule, "getCalleGateway").mockReturnValue(mockGateway);
    vi.spyOn(contextModule, "getClock").mockReturnValue(clock);
    vi.spyOn(contextModule, "getTokenGenerator").mockReturnValue(tokenGenerator);

    const inc: Incident = {
      id: "inc_webhook_test",
      load_ref: "LD-WH-01",
      carrier: "Atlas Line",
      origin: "Chicago, IL",
      destination: "Detroit, MI",
      original_appointment: "2026-09-14T10:30:00-04:00",
      updated_eta: "2026-09-14T11:20:00-04:00",
      dock_name: "Apex Logistics Center",
      dock_phone: "+1555019999",
      driver_phone: "+1555018888",
      driver_contact_name: "Marcus Vance",
      dock_contact_name: "Apex Desk",
      status: "driver_task_pending",
      authority_version: 1,
      state_revision: 1,
      task_budget_remaining: 2,
      driver_calle_call_id: "call_task_123",
      created_at: clock.isoNow(),
      updated_at: clock.isoNow(),
    };
    await store.createIncident(inc);

    await store.freezeAuthority("inc_webhook_test", {
      earliest_time: "2026-09-14T11:00:00-04:00",
      latest_time: "2026-09-14T13:00:00-04:00",
      timezone: "America/New_York",
      fee_ceiling: 150,
      currency: "USD",
      budget: 2,
      allow_selection_inside_interval: true,
      expires_at: "2026-09-14T14:00:00-04:00",
    });

    await store.saveCallIntent({
      id: "intent_drv_1",
      incident_id: "inc_webhook_test",
      authority_version: 1,
      call_type: "driver",
      idempotency_key: "idem_drv_1",
      calle_call_id: "call_task_123",
      status: "dispatched",
      payload: {},
      created_at: clock.isoNow(),
    });
  });

  it("rejects webhook missing CALL-E-Event-Id header with 400", async () => {
    const req = new Request("http://localhost:3000/api/webhooks/calle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "evt_123", call_id: "call_task_123" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Missing required CALL-E-Event-Id header");
  });

  it("rejects webhook when CALL-E-Event-Id header does not match body event id with 400", async () => {
    const req = new Request("http://localhost:3000/api/webhooks/calle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CALL-E-Event-Id": "evt_header_456",
      },
      body: JSON.stringify({ id: "evt_body_789", call_id: "call_task_123" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("does not match");
  });

  it("deduplicates identical event IDs without re-processing", async () => {
    const makeReq = () =>
      new Request("http://localhost:3000/api/webhooks/calle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CALL-E-Event-Id": "evt_unique_100",
        },
        body: JSON.stringify({ id: "evt_unique_100", call_id: "call_task_123" }),
      });

    // First arrival: processed
    const res1 = await POST(makeReq());
    expect(res1.status).toBe(200);
    const json1 = await res1.json();
    expect(json1.received).toBe(true);
    expect(json1.deduplicated).toBeUndefined();

    // Second arrival: deduplicated
    const res2 = await POST(makeReq());
    expect(res2.status).toBe(200);
    const json2 = await res2.json();
    expect(json2.received).toBe(true);
    expect(json2.deduplicated).toBe(true);
  });

  it("safely ignores unmapped CallTask IDs without choosing random incident", async () => {
    const req = new Request("http://localhost:3000/api/webhooks/calle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CALL-E-Event-Id": "evt_unknown_call",
      },
      body: JSON.stringify({ id: "evt_unknown_call", call_id: "call_unknown_999" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ignored).toBe(true);
    expect(json.reason).toContain("No matching intent");
  });
});
