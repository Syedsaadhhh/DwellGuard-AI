import { CalleClient } from "@call-e/calle";
import { CalleGateway, CreateCallTaskParams, CalleTaskResult } from "@/domain/ports/calle-gateway";

export const OFFICIAL_CALLE_BASE_URL = "https://api.heycall-e.com";

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
