import { describe, it, expect } from "vitest";
import {
  buildCanonicalProofPayload,
  canonicalStringify,
  computeProofHashAndId,
  buildProofChain,
  generateCausalProof,
} from "@/domain/proof/causal-proof";
import { Incident, AuthorityVersion, Observation, Receipt, TimeInterval } from "@/domain/types";
import { MemoryStore } from "@/infrastructure/store/memory-store";

describe("Causal Appointment Proof Engine", () => {
  const mockIncident: Incident = {
    id: "inc_test_1",
    load_ref: "LD-9901",
    carrier: "Swift Freight",
    original_appointment: "2026-09-14T10:30:00-04:00",
    updated_eta: "2026-09-14T11:20:00-04:00",
    origin: "Chicago, IL",
    destination: "Detroit, MI",
    dock_name: "Apex Logistics Center",
    dock_phone: "+1555019999",
    driver_phone: "+1555018888",
    driver_contact_name: "Marcus Vance",
    dock_contact_name: "Apex Receiving Desk",
    status: "draft",
    authority_version: 1,
    state_revision: 1,
    task_budget_remaining: 2,
    created_at: "2026-09-14T10:00:00Z",
    updated_at: "2026-09-14T10:00:00Z",
  };

  const mockAuthority: AuthorityVersion = {
    id: "auth_inc_test_1_v1",
    incident_id: "inc_test_1",
    version: 1,
    earliest_time: "2026-09-14T11:00:00-04:00",
    latest_time: "2026-09-14T13:00:00-04:00",
    timezone: "America/New_York",
    fee_ceiling: 150,
    currency: "USD",
    budget: 2,
    allow_selection_inside_interval: true,
    expires_at: "2026-09-14T14:00:00-04:00",
    created_at: "2026-09-14T10:05:00Z",
  };

  const mockDriverObs: Observation = {
    id: "obs_drv_1",
    incident_id: "inc_test_1",
    calle_call_id: "call_task_drv_123",
    speaker_role: "driver",
    verified_interval_start: "2026-09-14T11:30:00-04:00",
    verified_interval_end: "2026-09-14T12:30:00-04:00",
    selection_permitted: true,
    evidence_text: ["Driver stated arrival between 11:30 and 12:30"],
    raw_transcript_snippet: "Yeah 11:30 to 12:30 works, go ahead and book it",
    created_at: "2026-09-14T10:10:00Z",
  };

  const mockDockObs: Observation = {
    id: "obs_dock_1",
    incident_id: "inc_test_1",
    calle_call_id: "call_task_dock_456",
    speaker_role: "dock",
    confirmed_time: "2026-09-14T11:45:00-04:00",
    door: "Door 14",
    fee_amount: 0,
    fee_currency: "USD",
    confirmation_basis: "Dock coordinator confirmed slot",
    evidence_text: ["Confirmed 11:45 at Door 14 with $0 fee"],
    raw_transcript_snippet: "Bring it in at 11:45, Door 14, no charge.",
    created_at: "2026-09-14T10:15:00Z",
  };

  const mockOverlap: TimeInterval = {
    start: "2026-09-14T11:30:00-04:00",
    end: "2026-09-14T12:30:00-04:00",
    timezone: "America/New_York",
  };

  const mockReceipt: Receipt = {
    id: "rcpt_test_1_v1",
    incident_id: "inc_test_1",
    version: 1,
    load_ref: "LD-9901",
    confirmed_time: "2026-09-14T11:45:00-04:00",
    timezone: "America/New_York",
    dock_name: "Apex Logistics Center",
    door: "Door 14",
    fee_amount: 0,
    fee_currency: "USD",
    confirmation_basis: "Dock coordinator confirmed slot",
    created_at: "2026-09-14T10:16:00Z",
  };

  it("produces deterministic canonical string with alphabetically sorted keys", () => {
    const payloadA = { b: 2, a: 1, z: 99, d: "text" };
    const payloadB = { z: 99, d: "text", a: 1, b: 2 };

    const strA = canonicalStringify(payloadA);
    const strB = canonicalStringify(payloadB);

    expect(strA).toBe(strB);
    expect(strA).toBe('{"a":1,"b":2,"d":"text","z":99}');
  });

  it("strictly excludes PII, phone numbers, recipient names, and raw transcripts from canonical payload", () => {
    const payload = buildCanonicalProofPayload(
      mockIncident,
      mockAuthority,
      mockDriverObs,
      mockDockObs,
      mockOverlap,
      mockReceipt,
      null
    );

    const serialized = JSON.stringify(payload);

    // Verify phone numbers excluded
    expect(serialized).not.toContain("+1555018888");
    expect(serialized).not.toContain("+1555019999");

    // Verify recipient names excluded
    expect(serialized).not.toContain("Marcus Vance");
    expect(serialized).not.toContain("Apex Receiving Desk");

    // Verify raw transcripts excluded
    expect(serialized).not.toContain("Yeah 11:30 to 12:30 works");
    expect(serialized).not.toContain("Door 14, no charge");

    // Verify operational facts are present
    expect(payload.incident_id).toBe("inc_test_1");
    expect(payload.driver_call_id).toBe("call_task_drv_123");
    expect(payload.dock_call_id).toBe("call_task_dock_456");
    expect(payload.dock_confirmed_time).toBe("2026-09-14T11:45:00-04:00");
    expect(payload.dock_door).toBe("Door 14");
    expect(payload.dock_fee_amount).toBe(0);
  });

  it("generates deterministic SHA-256 hash and format-compliant short display ID", () => {
    const payload = buildCanonicalProofPayload(
      mockIncident,
      mockAuthority,
      mockDriverObs,
      mockDockObs,
      mockOverlap,
      mockReceipt,
      null
    );

    const canonicalJson = canonicalStringify(payload);
    const { proofHash, shortId } = computeProofHashAndId(canonicalJson);

    expect(proofHash).toHaveLength(64);
    expect(shortId).toMatch(/^DG-PROOF-[A-F0-9]{8}$/);

    // Hash consistency: identical input produces identical output
    const check = computeProofHashAndId(canonicalJson);
    expect(check.proofHash).toBe(proofHash);
    expect(check.shortId).toBe(shortId);
  });

  it("changes hash when any appointment fact changes", () => {
    const payload1 = buildCanonicalProofPayload(
      mockIncident,
      mockAuthority,
      mockDriverObs,
      mockDockObs,
      mockOverlap,
      mockReceipt,
      null
    );
    const hash1 = computeProofHashAndId(canonicalStringify(payload1)).proofHash;

    // Mutate dock confirmed time by 5 minutes
    const mutatedDockObs = { ...mockDockObs, confirmed_time: "2026-09-14T11:50:00-04:00" };
    const payload2 = buildCanonicalProofPayload(
      mockIncident,
      mockAuthority,
      mockDriverObs,
      mutatedDockObs,
      mockOverlap,
      mockReceipt,
      null
    );
    const hash2 = computeProofHashAndId(canonicalStringify(payload2)).proofHash;

    expect(hash1).not.toBe(hash2);
  });

  it("fails closed and throws if any causal link is broken", () => {
    // Dock fee exceeds authority ceiling ($250 > $150)
    const invalidDockObs = { ...mockDockObs, fee_amount: 250 };

    expect(() =>
      generateCausalProof(
        mockIncident,
        mockAuthority,
        mockDriverObs,
        invalidDockObs,
        mockOverlap,
        mockReceipt,
        null
      )
    ).toThrow("Cannot finalize Causal Appointment Proof");

    // Driver refused selection permission
    const refusedDriverObs = { ...mockDriverObs, selection_permitted: false };
    expect(() =>
      generateCausalProof(
        mockIncident,
        mockAuthority,
        refusedDriverObs,
        mockDockObs,
        mockOverlap,
        mockReceipt,
        null
      )
    ).toThrow("Cannot finalize Causal Appointment Proof");
  });

  it("buildProofChain accurately reflects valid vs broken steps", () => {
    const overFeeDockObs = { ...mockDockObs, fee_amount: 300 };
    const { chain, isValid } = buildProofChain(
      mockAuthority,
      mockDriverObs,
      overFeeDockObs,
      mockOverlap,
      mockReceipt,
      null
    );

    expect(isValid).toBe(false);
    expect(chain).toHaveLength(6);

    const dockLink = chain.find((c) => c.step === "dock");
    expect(dockLink?.status).toBe("broken");
    expect(dockLink?.fact).toContain("exceeding ceiling");
  });

  it("persists and retrieves proof in store preserving short display ID", async () => {
    const store = new MemoryStore(false);
    const proof = generateCausalProof(
      mockIncident,
      mockAuthority,
      mockDriverObs,
      mockDockObs,
      mockOverlap,
      mockReceipt,
      null
    );

    await store.saveCausalProof(proof);

    const retrieved = await store.getCausalProof("inc_test_1", 1);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.short_id).toBe(proof.short_id);
    expect(retrieved?.proof_hash).toBe(proof.proof_hash);
    expect(retrieved?.status).toBe("valid");
  });
});
