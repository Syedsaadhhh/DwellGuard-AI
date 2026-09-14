import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStore } from "@/infrastructure/store/memory-store";
import { CalleGateway, CalleTaskResult } from "@/domain/ports/calle-gateway";
import { SystemClock } from "@/domain/ports/clock";
import { CryptoTokenGenerator } from "@/domain/ports/tokens";
import { reconcileCallTask } from "@/domain/workflow/reconcile";
import { advanceIncident } from "@/domain/workflow/advance-incident";
import { Incident, CallIntent } from "@/domain/types";

// Mock Gateway that tracks creations vs retrievals
class AsyncMockCalleGateway implements CalleGateway {
  public createsCount = 0;
  public retrievalsCount = 0;
  public taskMap = new Map<string, CalleTaskResult>();

  async createCallTask(params: any): Promise<CalleTaskResult> {
    this.createsCount++;
    const calleCallId = `call_${params.metadata?.call_type}_${this.createsCount}`;
    const result: CalleTaskResult = {
      calleCallId,
      status: "in_progress", // Starts in progress
      summary: "Call task initiated",
      rawResponse: {},
    };
    this.taskMap.set(calleCallId, result);
    return result;
  }

  async getCallTask(calleCallId: string): Promise<CalleTaskResult> {
    this.retrievalsCount++;
    const existing = this.taskMap.get(calleCallId);
    if (!existing) {
      throw new Error(`Task ${calleCallId} not found`);
    }
    return existing;
  }

  // Simulate completion by webhook or provider finish
  simulateTaskCompletion(calleCallId: string, structuredResult: any) {
    const existing = this.taskMap.get(calleCallId);
    if (existing) {
      existing.status = "completed";
      existing.structuredResult = structuredResult;
      existing.summary = "Call task completed successfully";
    }
  }
}

describe("Asynchronous CALL-E Reconciliation & Recovery", () => {
  let store: MemoryStore;
  let gateway: AsyncMockCalleGateway;
  const clock = new SystemClock();
  const tokenGenerator = new CryptoTokenGenerator();

  const incidentId = "inc_async_test";

  beforeEach(async () => {
    store = new MemoryStore(false);
    gateway = new AsyncMockCalleGateway();

    const incident: Incident = {
      id: incidentId,
      load_ref: "LD-ASYNC-10",
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
      status: "draft",
      authority_version: 1,
      state_revision: 1,
      task_budget_remaining: 2,
      created_at: clock.isoNow(),
      updated_at: clock.isoNow(),
    };

    await store.createIncident(incident);

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
  });

  it("handles in-progress async driver task without premature advancement", async () => {
    // 1. Initial advance launches driver call
    const inc = await advanceIncident(incidentId, store, gateway, clock, tokenGenerator);

    expect(inc.status).toBe("driver_task_pending");
    expect(gateway.createsCount).toBe(1);
    expect(inc.driver_calle_call_id).toBe("call_driver_1");

    // 2. Re-running advance while still in-progress retrieves existing task and DOES NOT create a new call
    const incCheck = await advanceIncident(incidentId, store, gateway, clock, tokenGenerator);
    expect(incCheck.status).toBe("driver_task_pending");
    expect(gateway.createsCount).toBe(1); // Still exactly 1 create
    expect(gateway.retrievalsCount).toBeGreaterThanOrEqual(1);
  });

  it("reconciles completed driver task and proceeds to dock task with retrieval-only recovery", async () => {
    // 1. Start driver call
    await advanceIncident(incidentId, store, gateway, clock, tokenGenerator);

    // 2. Simulate driver call completion
    const driverCallId = "call_driver_1";
    gateway.simulateTaskCompletion(driverCallId, {
      verified_interval_start: "2026-09-14T11:30:00-04:00",
      verified_interval_end: "2026-09-14T12:30:00-04:00",
      selection_permitted: true,
      evidence_text: ["Driver verified 11:30 to 12:30"],
    });

    // 3. Reconcile via reconcileCallTask (retrieval-only)
    const recResult = await reconcileCallTask(driverCallId, store, gateway, clock, tokenGenerator);
    expect(recResult).not.toBeNull();
    expect(recResult?.status).toBe("dock_task_pending");

    // After driver completion, dock call was created and is pending
    const incAfterDriver = await store.getIncident(incidentId);
    expect(incAfterDriver?.status).toBe("dock_task_pending");
    expect(gateway.createsCount).toBe(2); // Exactly 2 calls created (1 driver, 1 dock)
    expect(incAfterDriver?.dock_calle_call_id).toBe("call_dock_2");

    // 4. Simulate dock call completion
    const dockCallId = "call_dock_2";
    gateway.simulateTaskCompletion(dockCallId, {
      confirmed_time: "2026-09-14T11:45:00-04:00",
      door: "Door 9",
      fee_amount: 0,
      fee_currency: "USD",
      confirmation_basis: "Dock agreed to 11:45",
      evidence_text: ["Dock coordinator confirmed 11:45 slot at Door 9"],
    });

    // 5. Reconcile dock call (retrieval-only)
    const dockRecResult = await reconcileCallTask(dockCallId, store, gateway, clock, tokenGenerator);
    expect(dockRecResult).not.toBeNull();
    expect(dockRecResult?.status).toBe("plan_confirmed");

    const finalInc = await store.getIncident(incidentId);
    expect(finalInc?.status).toBe("plan_confirmed");
    expect(finalInc?.confirmed_receipt_id).toBeDefined();
    expect(finalInc?.causal_proof_short_id).toBeDefined();

    // Verify exactly 2 calls were ever created in total across both tasks
    expect(gateway.createsCount).toBe(2);

    // Verify causal proof was saved
    const proof = await store.getCausalProof(incidentId);
    expect(proof).not.toBeNull();
    expect(proof?.short_id).toBe(finalInc?.causal_proof_short_id);
  });
});
