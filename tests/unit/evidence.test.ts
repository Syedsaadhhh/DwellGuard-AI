import { describe, it, expect } from "vitest";
import { validateDriverEvidence, validateDockEvidence } from "@/domain/workflow/evidence";
import { Observation, AuthorityVersion, TimeInterval } from "@/domain/types";

describe("Evidence Normalization & Gating", () => {
  const dummyAuthority: AuthorityVersion = {
    id: "auth_test",
    incident_id: "inc_1",
    version: 1,
    earliest_time: "2026-09-14T11:00:00-04:00",
    latest_time: "2026-09-14T13:00:00-04:00",
    timezone: "America/New_York",
    fee_ceiling: 150,
    currency: "USD",
    budget: 2,
    allow_selection_inside_interval: true,
    expires_at: "2026-09-14T14:00:00-04:00",
    created_at: new Date().toISOString(),
  };

  const dummyOverlap: TimeInterval = {
    start: "2026-09-14T11:35:00-04:00",
    end: "2026-09-14T11:50:00-04:00",
    timezone: "America/New_York",
  };

  describe("Driver Evidence", () => {
    it("approves valid driver arrival interval with explicit selection permission", () => {
      const obs: Observation = {
        id: "obs_1",
        incident_id: "inc_1",
        calle_call_id: "call_1",
        speaker_role: "driver",
        verified_interval_start: "2026-09-14T11:35:00-04:00",
        verified_interval_end: "2026-09-14T11:50:00-04:00",
        selection_permitted: true,
        evidence_text: ["Driver confirmed arrival range 11:35 to 11:50 AM"],
        created_at: new Date().toISOString(),
      };

      const result = validateDriverEvidence(obs);
      expect(result.permitted).toBe(true);
      expect(result.validInterval).toBe(true);
    });

    it("rejects when driver refuses selection permission", () => {
      const obs: Observation = {
        id: "obs_2",
        incident_id: "inc_1",
        calle_call_id: "call_2",
        speaker_role: "driver",
        verified_interval_start: "2026-09-14T11:35:00-04:00",
        verified_interval_end: "2026-09-14T11:50:00-04:00",
        selection_permitted: false, // Refused
        evidence_text: ["Driver refused automated selection"],
        created_at: new Date().toISOString(),
      };

      const result = validateDriverEvidence(obs);
      expect(result.permitted).toBe(false);
      expect(result.validInterval).toBe(true);
      expect(result.reason).toContain("did not grant permission");
    });
  });

  describe("Dock Evidence", () => {
    it("confirms when dock appointment is inside overlap and under fee ceiling", () => {
      const obs: Observation = {
        id: "obs_3",
        incident_id: "inc_1",
        calle_call_id: "call_3",
        speaker_role: "dock",
        confirmed_time: "2026-09-14T11:45:00-04:00",
        door: "Door 6",
        fee_amount: 0,
        fee_currency: "USD",
        confirmation_basis: "Dock lead agreed to 11:45 AM slot",
        evidence_text: ["Confirmed Door 6 for 11:45 AM EDT"],
        created_at: new Date().toISOString(),
      };

      const result = validateDockEvidence(obs, dummyAuthority, dummyOverlap);
      expect(result.valid).toBe(true);
      expect(result.outcome).toBe("PLAN_CONFIRMED");
    });

    it("refuses appointment outside authorized overlap interval", () => {
      const obs: Observation = {
        id: "obs_4",
        incident_id: "inc_1",
        calle_call_id: "call_4",
        speaker_role: "dock",
        confirmed_time: "2026-09-14T12:30:00-04:00", // Outside 11:35-11:50
        door: "Door 6",
        fee_amount: 0,
        fee_currency: "USD",
        confirmation_basis: "Dock offered 12:30 PM",
        evidence_text: ["Only 12:30 PM slot open"],
        created_at: new Date().toISOString(),
      };

      const result = validateDockEvidence(obs, dummyAuthority, dummyOverlap);
      expect(result.valid).toBe(false);
      expect(result.outcome).toBe("DISPATCHER_NEEDED");
      expect(result.reason).toBe("OUTSIDE_PERMITTED_INTERVAL");
    });

    it("refuses appointment when fee exceeds authority ceiling", () => {
      const obs: Observation = {
        id: "obs_5",
        incident_id: "inc_1",
        calle_call_id: "call_5",
        speaker_role: "dock",
        confirmed_time: "2026-09-14T11:45:00-04:00",
        door: "Door 6",
        fee_amount: 350, // Exceeds $150 ceiling
        fee_currency: "USD",
        confirmation_basis: "Dock confirmed with $350 fee",
        evidence_text: ["$350 fee required"],
        created_at: new Date().toISOString(),
      };

      const result = validateDockEvidence(obs, dummyAuthority, dummyOverlap);
      expect(result.valid).toBe(false);
      expect(result.outcome).toBe("DISPATCHER_NEEDED");
      expect(result.reason).toBe("FEE_EXCEEDS_CEILING");
      expect(result.explanation).toContain("exceeding approved ceiling");
    });

    it("refuses fee with currency mismatch", () => {
      const obs: Observation = {
        id: "obs_6",
        incident_id: "inc_1",
        calle_call_id: "call_6",
        speaker_role: "dock",
        confirmed_time: "2026-09-14T11:45:00-04:00",
        fee_amount: 50,
        fee_currency: "EUR", // Wrong currency
        confirmation_basis: "Confirmed with EUR fee",
        evidence_text: ["50 EUR fee"],
        created_at: new Date().toISOString(),
      };

      const result = validateDockEvidence(obs, dummyAuthority, dummyOverlap);
      expect(result.valid).toBe(false);
      expect(result.outcome).toBe("DISPATCHER_NEEDED");
      expect(result.reason).toBe("CURRENCY_MISMATCH");
    });
  });
});
