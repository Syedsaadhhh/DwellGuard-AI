import { CalleClient } from "@call-e/calle";
import { CalleGateway, CreateCallTaskParams, CalleTaskResult } from "@/domain/ports/calle-gateway";

export class LiveCalleGateway implements CalleGateway {
  private client: CalleClient;

  constructor(apiKey: string, baseUrl?: string, customFetch?: (input: Request) => Promise<Response>) {
    this.client = new CalleClient({
      apiKey,
      baseUrl: baseUrl || "https://api.call-e.com",
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
