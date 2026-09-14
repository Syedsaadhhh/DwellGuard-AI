/**
 * Fixture CalleClient for offline verification of the Spoken Constraint Relay pattern.
 * Performs zero network I/O and places no telephone calls.
 */

import { CalleClient } from "@call-e/calle";

export function createFixtureClient(scenario: "positive" | "fee_refusal" | "driver_refusal"): CalleClient {
  let callCount = 0;

  const fakeCalls = {
    create: async (params: any) => {
      callCount++;
      const id = `call_task_mock_${callCount}`;
      return { id, status: "completed" } as any;
    },
    get: async (callId: string) => {
      if (callId === "call_task_mock_1") {
        // Driver Call response
        if (scenario === "driver_refusal") {
          return {
            id: callId,
            status: "completed",
            structuredResult: {
              selection_permitted: false,
              evidence_text: ["Driver refused automated slot selection"],
            },
          } as any;
        }
        return {
          id: callId,
          status: "completed",
          structuredResult: {
            verified_interval_start: "2026-09-14T11:30:00-04:00",
            verified_interval_end: "2026-09-14T12:30:00-04:00",
            selection_permitted: true,
            evidence_text: ["Driver verified workable window 11:30 to 12:30"],
          },
        } as any;
      }

      if (callId === "call_task_mock_2") {
        // Dock Call response
        if (scenario === "fee_refusal") {
          return {
            id: callId,
            status: "completed",
            structuredResult: {
              confirmed_time: "2026-09-14T11:45:00-04:00",
              door: "Door 4",
              fee_amount: 350, // Exceeds $150 limit
              evidence_text: ["Dock demanded $350 fee"],
            },
          } as any;
        }
        return {
          id: callId,
          status: "completed",
          structuredResult: {
            confirmed_time: "2026-09-14T11:45:00-04:00",
            door: "Door 4",
            fee_amount: 0,
            evidence_text: ["Dock confirmed 11:45 at Door 4 with $0 fee"],
          },
        } as any;
      }

      throw new Error(`Unknown mock call ID: ${callId}`);
    },
  };

  return {
    calls: fakeCalls,
  } as unknown as CalleClient;
}
