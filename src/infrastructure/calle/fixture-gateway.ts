import { CalleGateway, CreateCallTaskParams, CalleTaskResult } from "@/domain/ports/calle-gateway";

export interface FixtureScenarioConfig {
  scenario: "positive" | "fee_refusal" | "no_overlap" | "no_permission";
  driverStartTime?: string;
  driverEndTime?: string;
  dockConfirmedTime?: string;
  dockFee?: number;
  dockFeeCurrency?: string;
  dockDoor?: string;
}

export class FixtureCalleGateway implements CalleGateway {
  public callsRecorded: CreateCallTaskParams[] = [];
  public scenario: FixtureScenarioConfig["scenario"] = "positive";
  private mockCallCount = 0;

  constructor(scenario: FixtureScenarioConfig["scenario"] = "positive") {
    this.scenario = scenario;
  }

  setScenario(scenario: FixtureScenarioConfig["scenario"]) {
    this.scenario = scenario;
  }

  async createCallTask(params: CreateCallTaskParams): Promise<CalleTaskResult> {
    this.callsRecorded.push(params);
    this.mockCallCount++;
    const callId = `call_fixture_${this.mockCallCount}_${Date.now()}`;
    const providerCallId = `prov_${callId}`;

    const isDriverCall = params.metadata?.call_type
      ? params.metadata.call_type === "driver"
      : !params.task.toLowerCase().includes("dock") && !params.task.toLowerCase().includes("receiving") && params.task.toLowerCase().includes("driver");

    let structuredResult: Record<string, unknown> = {};

    if (isDriverCall) {
      if (this.scenario === "no_permission") {
        structuredResult = {
          verified_interval_start: "2026-09-14T11:35:00-04:00",
          verified_interval_end: "2026-09-14T11:50:00-04:00",
          selection_permitted: false,
          evidence_text: [
            "Driver says check-in possible 11:35 to 11:50",
            "Driver explicitly did NOT authorize dock coordinator to pick time",
          ],
        };
      } else if (this.scenario === "no_overlap") {
        structuredResult = {
          verified_interval_start: "2026-09-14T15:00:00-04:00",
          verified_interval_end: "2026-09-14T15:30:00-04:00",
          selection_permitted: true,
          evidence_text: [
            "Driver delayed severely; earliest check-in 15:00",
            "Authorized selection in window",
          ],
        };
      } else {
        // Positive and fee_refusal both have valid driver window
        structuredResult = {
          verified_interval_start: "2026-09-14T11:35:00-04:00",
          verified_interval_end: "2026-09-14T11:50:00-04:00",
          selection_permitted: true,
          evidence_text: [
            "Driver confirmed check-in window between 11:35 AM and 11:50 AM EDT",
            "Driver authorized selecting any slot in that window",
          ],
        };
      }
    } else {
      // Dock call
      if (this.scenario === "fee_refusal") {
        structuredResult = {
          confirmed_time: "2026-09-14T11:45:00-04:00",
          door: "Door 6",
          fee_amount: 350, // Exceeds $150 ceiling
          fee_currency: "USD",
          conditions: "Late gate fee applies ($350)",
          confirmation_basis: "Dock coordinator approved 11:45 slot with $350 emergency fee",
          evidence_text: [
            "Northline Receiving offered 11:45 AM slot",
            "Dock supervisor demanded $350 late charge",
          ],
        };
      } else {
        // Positive dock confirmation
        structuredResult = {
          confirmed_time: "2026-09-14T11:45:00-04:00",
          door: "Door 6",
          fee_amount: 0,
          fee_currency: "USD",
          conditions: "Standard check-in procedure",
          confirmation_basis: "Northline Receiving coordinator Mary verified Door 6 for 11:45 AM EDT with no extra fee",
          evidence_text: [
            "Dock coordinator confirmed Door 6 for 11:45 AM EDT",
            "Zero additional fee required",
          ],
        };
      }
    }

    return {
      calleCallId: callId,
      providerCallId,
      status: "completed",
      structuredResult,
      summary: isDriverCall
        ? "Spoke with driver; confirmed 11:35-11:50 arrival window."
        : "Spoke with dock supervisor; confirmed 11:45 AM appointment.",
      rawResponse: {
        id: callId,
        object: "call_task",
        status: "completed",
        recipients: [
          {
            id: `rec_${callId}`,
            phones: [params.phone],
            status: "completed",
            structuredResult,
            attempts: [
              {
                id: `att_${callId}`,
                phone: params.phone,
                providerCallId,
                status: "completed",
              },
            ],
          },
        ],
      },
    };
  }

  async getCallTask(calleCallId: string): Promise<CalleTaskResult> {
    return {
      calleCallId,
      providerCallId: `prov_${calleCallId}`,
      status: "completed",
      structuredResult: null,
      rawResponse: { id: calleCallId, status: "completed" },
    };
  }
}
