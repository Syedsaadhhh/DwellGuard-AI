import { CalleClient } from "@call-e/calle";
import { CalleGateway, CreateCallTaskParams, CalleTaskResult } from "@/domain/ports/calle-gateway";

export const OFFICIAL_CALLE_BASE_URL = "https://api.heycall-e.com";

const DRIVER_RESULT_SCHEMA = {
  type: "object",
  properties: {
    verified_interval_start: {
      type: "string",
      description: "Driver's earliest workable arrival as an ISO 8601 timestamp with timezone offset.",
    },
    verified_interval_end: {
      type: "string",
      description: "Driver's latest workable arrival as an ISO 8601 timestamp with timezone offset.",
    },
    selection_permitted: {
      type: "boolean",
      description: "True only when the driver explicitly permits selection inside the stated interval.",
    },
    evidence_text: {
      type: "array",
      items: { type: "string" },
      description: "Short, attributed evidence phrases supporting the structured result.",
    },
  },
  required: [
    "verified_interval_start",
    "verified_interval_end",
    "selection_permitted",
    "evidence_text",
  ],
};

const DOCK_RESULT_SCHEMA = {
  type: "object",
  properties: {
    confirmed_time: {
      type: "string",
      description: "The dock's committed appointment as an ISO 8601 timestamp with timezone offset.",
    },
    door: { type: "string", description: "Assigned dock door, when stated." },
    fee_amount: { type: "number", description: "The exact fee amount; use 0 when no fee applies." },
    fee_currency: { type: "string", description: "Three-letter currency code such as USD." },
    conditions: { type: "string", description: "Any operational conditions stated by the dock." },
    confirmation_basis: {
      type: "string",
      description: "What the dock coordinator explicitly agreed to.",
    },
    evidence_text: {
      type: "array",
      items: { type: "string" },
      description: "Short, attributed evidence phrases supporting the commitment.",
    },
  },
  required: [
    "confirmed_time",
    "fee_amount",
    "fee_currency",
    "confirmation_basis",
    "evidence_text",
  ],
};

function resultSchemaFor(params: CreateCallTaskParams) {
  return params.metadata?.call_type === "driver" ? DRIVER_RESULT_SCHEMA : DOCK_RESULT_SCHEMA;
}

export class LiveCalleGateway implements CalleGateway {
  private client: CalleClient;
  public readonly baseUrl: string;

  constructor(apiKey: string, baseUrl?: string, customFetch?: (input: Request) => Promise<Response>) {
    if (!apiKey) {
      throw new Error("BLOCKED_LIVE: Missing required apiKey for LiveCalleGateway.");
    }
    this.baseUrl = baseUrl || process.env.CALLE_BASE_URL || OFFICIAL_CALLE_BASE_URL;

    this.client = new CalleClient({
      apiKey,
      baseUrl: this.baseUrl,
      fetch: customFetch,
    });
  }

  async createCallTask(params: CreateCallTaskParams): Promise<CalleTaskResult> {
    const call = await this.client.calls.create(
      {
        task: params.task,
        recipient: {
          phone: params.phone,
        },
        recipientResultSchema: resultSchemaFor(params),
        metadata: params.metadata,
        webhookUrl: params.webhookUrl,
      },
      {
        idempotencyKey: params.idempotencyKey,
      }
    );

    const firstRecipient = call.recipients?.[0];
    const firstAttempt = firstRecipient?.attempts?.[0];

    return {
      calleCallId: call.id,
      providerCallId: firstAttempt?.providerCallId ?? null,
      status: call.status,
      structuredResult: (call.structuredResult ?? firstRecipient?.structuredResult) as Record<string, unknown> | null,
      summary: call.summary ?? firstRecipient?.summary ?? null,
      rawResponse: call as unknown as Record<string, unknown>,
    };
  }

  async getCallTask(calleCallId: string): Promise<CalleTaskResult> {
    const call = await this.client.calls.get(calleCallId);
    const firstRecipient = call.recipients?.[0];
    const firstAttempt = firstRecipient?.attempts?.[0];

    return {
      calleCallId: call.id,
      providerCallId: firstAttempt?.providerCallId ?? null,
      status: call.status,
      structuredResult: (call.structuredResult ?? firstRecipient?.structuredResult) as Record<string, unknown> | null,
      summary: call.summary ?? firstRecipient?.summary ?? null,
      rawResponse: call as unknown as Record<string, unknown>,
    };
  }
}
