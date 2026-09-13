export interface CreateCallTaskParams {
  task: string;
  phone: string;
  recipientName?: string;
  metadata?: Record<string, unknown>;
  webhookUrl?: string;
  idempotencyKey: string;
}

export interface CalleTaskResult {
  calleCallId: string;
  providerCallId?: string | null;
  status: string;
  structuredResult?: Record<string, unknown> | null;
  summary?: string | null;
  rawResponse: Record<string, unknown>;
}

export interface CalleGateway {
  createCallTask(params: CreateCallTaskParams): Promise<CalleTaskResult>;
  getCallTask(calleCallId: string): Promise<CalleTaskResult>;
}
