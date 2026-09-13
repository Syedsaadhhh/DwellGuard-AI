import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStore } from "@/infrastructure/store/memory-store";
import { CryptoTokenGenerator } from "@/domain/ports/tokens";
import { HandoffToken, Receipt } from "@/domain/types";

describe("Driver Handoff Token Security & Acknowledgment", () => {
  let store: MemoryStore;
  const tokenGenerator = new CryptoTokenGenerator();

  beforeEach(() => {
    store = new MemoryStore(true);
  });

  it("generates tokens with >= 192 bits entropy and verifiable sha256 hash", () => {
    const { rawToken, tokenHash } = tokenGenerator.generateToken();

    // 32 bytes hex encoded = 64 characters (256 bits > 192 bits)
    expect(rawToken.length).toBe(64);
    expect(tokenHash.length).toBe(64);

    const rehashed = tokenGenerator.hashToken(rawToken);
    expect(rehashed).toBe(tokenHash);
  });

  it("acknowledges valid unexpired token and transitions incident to driver_received", async () => {
    const incidentId = "inc_dg2048";
    const receipt: Receipt = {
      id: "rcpt_test_1",
      incident_id: incidentId,
      version: 1,
      load_ref: "DG-2048",
      confirmed_time: "2026-09-14T11:45:00-04:00",
      timezone: "America/New_York",
      dock_name: "Northline Receiving",
      fee_amount: 0,
      fee_currency: "USD",
      confirmation_basis: "Dock verified",
      created_at: new Date().toISOString(),
    };
    await store.finalizeReceipt(receipt);

    const { rawToken, tokenHash } = tokenGenerator.generateToken();
    const token: HandoffToken = {
      id: "tok_test_1",
      incident_id: incidentId,
      receipt_id: receipt.id,
      receipt_version: 1,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      created_at: new Date().toISOString(),
    };
    await store.createHandoffToken(token);

    // Perform acknowledgment using tokenHash
    const ackRes = await store.acknowledgeHandoff(tokenHash, {
      acknowledged_at: new Date().toISOString(),
      user_agent: "Mobile Safari",
    });

    expect(ackRes.success).toBe(true);
    expect(ackRes.receipt?.id).toBe("rcpt_test_1");

    const incident = await store.getIncident(incidentId);
    expect(incident?.status).toBe("driver_received");
  });

  it("rejects acknowledgment for expired token", async () => {
    const { rawToken, tokenHash } = tokenGenerator.generateToken();
    const expiredToken: HandoffToken = {
      id: "tok_expired",
      incident_id: "inc_dg2048",
      receipt_id: "rcpt_test_1",
      receipt_version: 1,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() - 60000).toISOString(), // Expired 1 min ago
      created_at: new Date(Date.now() - 3600000).toISOString(),
    };
    await store.createHandoffToken(expiredToken);

    const ackRes = await store.acknowledgeHandoff(tokenHash, {
      acknowledged_at: new Date().toISOString(),
    });

    expect(ackRes.success).toBe(false);
  });

  it("handles duplicate acknowledgment idempotently", async () => {
    const incidentId = "inc_dg2048";
    const receipt: Receipt = {
      id: "rcpt_test_2",
      incident_id: incidentId,
      version: 1,
      load_ref: "DG-2048",
      confirmed_time: "2026-09-14T11:45:00-04:00",
      timezone: "America/New_York",
      dock_name: "Northline Receiving",
      fee_amount: 0,
      fee_currency: "USD",
      confirmation_basis: "Dock verified",
      created_at: new Date().toISOString(),
    };
    await store.finalizeReceipt(receipt);

    const { rawToken, tokenHash } = tokenGenerator.generateToken();
    const token: HandoffToken = {
      id: "tok_test_2",
      incident_id: incidentId,
      receipt_id: receipt.id,
      receipt_version: 1,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      created_at: new Date().toISOString(),
    };
    await store.createHandoffToken(token);

    const firstAck = await store.acknowledgeHandoff(tokenHash, {
      acknowledged_at: new Date().toISOString(),
    });
    expect(firstAck.success).toBe(true);

    const secondAck = await store.acknowledgeHandoff(tokenHash, {
      acknowledged_at: new Date().toISOString(),
    });
    expect(secondAck.success).toBe(true);
    expect(secondAck.receipt?.id).toBe("rcpt_test_2");
  });
});
