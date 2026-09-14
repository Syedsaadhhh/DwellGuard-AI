import { describe, it, expect } from "vitest";
import { executeSpokenConstraintRelay, RelayConfig } from "./relay";
import { createFixtureClient } from "./fixtures";

describe("Spoken Constraint Relay — CALL-E Pattern Verification", () => {
  const baseConfig: RelayConfig = {
    incidentId: "inc_contrib_001",
    loadRef: "LD-CONTRIB-77",
    driverPhone: "+1555018888",
    dockPhone: "+1555019999",
    dockName: "Midwest Distribution Center",
    earliestAllowed: "2026-09-14T11:00:00-04:00",
    latestAllowed: "2026-09-14T13:00:00-04:00",
    feeCeiling: 150,
    currency: "USD",
    timezone: "America/New_York",
  };

  it("completes full relay: driver bounds dock request and produces Causal Proof", async () => {
    const client = createFixtureClient("positive");
    const result = await executeSpokenConstraintRelay(baseConfig, client);

    expect(result.success).toBe(true);
    expect(result.status).toBe("confirmed");
    expect(result.confirmedTime).toBe("2026-09-14T11:45:00-04:00");
    expect(result.designatedDoor).toBe("Door 4");
    expect(result.feeAmount).toBe(0);
    expect(result.causalProofId).toMatch(/^DG-PROOF-[A-F0-9]{8}$/);
    expect(result.proofHash).toHaveLength(64);
  });

  it("refuses confirmation and flags dispatcher needed if fee exceeds ceiling", async () => {
    const client = createFixtureClient("fee_refusal");
    const result = await executeSpokenConstraintRelay(baseConfig, client);

    expect(result.success).toBe(false);
    expect(result.status).toBe("human_dispatcher_needed");
    expect(result.explanation).toContain("exceeding authorized ceiling");
  });

  it("refuses dock dispatch if driver declines slot selection permission", async () => {
    const client = createFixtureClient("driver_refusal");
    const result = await executeSpokenConstraintRelay(baseConfig, client);

    expect(result.success).toBe(false);
    expect(result.status).toBe("human_dispatcher_needed");
    expect(result.explanation).toContain("declined scheduling permission");
  });
});
