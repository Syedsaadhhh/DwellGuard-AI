import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStore } from "@/infrastructure/store/memory-store";
import { FixtureCalleGateway } from "@/infrastructure/calle/fixture-gateway";
import { SystemClock } from "@/domain/ports/clock";
import { CryptoTokenGenerator } from "@/domain/ports/tokens";
import { advanceIncident } from "@/domain/workflow/advance-incident";

describe("DwellGuard End-to-End Workflow & Transitions", () => {
  let store: MemoryStore;
  let gateway: FixtureCalleGateway;
  const clock = new SystemClock();
  const tokenGenerator = new CryptoTokenGenerator();

  beforeEach(() => {
    store = new MemoryStore(true);
    gateway = new FixtureCalleGateway("positive");
  });

  it("completes full positive flow from authorized to plan_confirmed and driver_received", async () => {
    const incidentId = "inc_dg2048";

    // 1. Freeze authority
    await store.freezeAuthority(incidentId, {
      earliest_time: "2026-09-14T11:00:00-04:00",
      latest_time: "2026-09-14T13:00:00-04:00",
      timezone: "America/New_York",
      fee_ceiling: 150,
      currency: "USD",
      budget: 2,
      allow_selection_inside_interval: true,
      expires_at: "2026-09-14T14:00:00-04:00",
    });

    // 2. Advance incident (Driver call -> verified interval -> Dock call -> plan_confirmed)
    const result = await advanceIncident(incidentId, store, gateway, clock, tokenGenerator);

    expect(result.status).toBe("plan_confirmed");
    expect(result.confirmed_receipt_id).toBeDefined();
    expect(result.handoff_token_id).toBeDefined();

    // Verify exactly 2 calls were placed
    expect(gateway.callsRecorded.length).toBe(2);
    expect(gateway.callsRecorded[0].task).toContain("driver");
    expect(gateway.callsRecorded[1].task).toContain("Northline Receiving");

    // Verify receipt was generated
    const receipt = await store.getReceipt(result.confirmed_receipt_id!);
    expect(receipt).not.toBeNull();
    expect(receipt?.confirmed_time).toBe("2026-09-14T11:45:00-04:00");
    expect(receipt?.dock_name).toBe("Northline Receiving");
    expect(receipt?.fee_amount).toBe(0);

    // 3. Driver receives plan and taps acknowledgment
    const token = await store.getHandoffTokenByIncident(incidentId);
    expect(token).not.toBeNull();

    const ackRes = await store.acknowledgeHandoff(token!.token_hash, {
      acknowledged_at: new Date().toISOString(),
      user_agent: "Mobile Safari",
    });

    expect(ackRes.success).toBe(true);

    const updatedIncident = await store.getIncident(incidentId);
    expect(updatedIncident?.status).toBe("driver_received");
  });

  it("transitions to dispatcher_needed when dock fee exceeds ceiling", async () => {
    const incidentId = "inc_dg2048";
    gateway.setScenario("fee_refusal");

    await store.freezeAuthority(incidentId, {
      earliest_time: "2026-09-14T11:00:00-04:00",
      latest_time: "2026-09-14T13:00:00-04:00",
      timezone: "America/New_York",
      fee_ceiling: 150,
      currency: "USD",
      budget: 2,
      allow_selection_inside_interval: true,
      expires_at: "2026-09-14T14:00:00-04:00",
    });

    const result = await advanceIncident(incidentId, store, gateway, clock, tokenGenerator);

    expect(result.status).toBe("dispatcher_needed");
    expect(result.resolution_reason).toContain("exceeding approved ceiling");
    expect(result.confirmed_receipt_id).toBeUndefined();
  });

  it("blocks dock dispatch and transitions to dispatcher_needed when driver refuses selection permission", async () => {
    const incidentId = "inc_dg2048";
    gateway.setScenario("no_permission");

    await store.freezeAuthority(incidentId, {
      earliest_time: "2026-09-14T11:00:00-04:00",
      latest_time: "2026-09-14T13:00:00-04:00",
      timezone: "America/New_York",
      fee_ceiling: 150,
      currency: "USD",
      budget: 2,
      allow_selection_inside_interval: true,
      expires_at: "2026-09-14T14:00:00-04:00",
    });

    const result = await advanceIncident(incidentId, store, gateway, clock, tokenGenerator);

    expect(result.status).toBe("dispatcher_needed");
    expect(result.resolution_reason).toContain("did not grant permission");
    // Crucial requirement: dock call was never placed
    expect(gateway.callsRecorded.length).toBe(1);
  });

  it("blocks dock call when driver arrival does not overlap authorized window", async () => {
    const incidentId = "inc_dg2048";
    gateway.setScenario("no_overlap");

    await store.freezeAuthority(incidentId, {
      earliest_time: "2026-09-14T11:00:00-04:00",
      latest_time: "2026-09-14T13:00:00-04:00",
      timezone: "America/New_York",
      fee_ceiling: 150,
      currency: "USD",
      budget: 2,
      allow_selection_inside_interval: true,
      expires_at: "2026-09-14T14:00:00-04:00",
    });

    const result = await advanceIncident(incidentId, store, gateway, clock, tokenGenerator);

    expect(result.status).toBe("dispatcher_needed");
    expect(result.resolution_reason).toContain("does not overlap");
    // Dock call was NOT dispatched
    expect(gateway.callsRecorded.length).toBe(1);
  });

  it("enforces two-call task budget limit", async () => {
    const incidentId = "inc_dg2048";

    // Deplete budget completely
    const res1 = await store.reserveCallBudget(incidentId, 2);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(0);

    // Try reserving another
    const res2 = await store.reserveCallBudget(incidentId, 1);
    expect(res2.success).toBe(false);
    expect(res2.remaining).toBe(0);
  });
});
