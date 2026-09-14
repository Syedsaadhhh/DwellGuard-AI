import { describe, it, expect } from "vitest";
import { LiveCalleGateway } from "@/infrastructure/calle/live-gateway";

describe("CALL-E SDK Wire Contract & Serialization", () => {
  it("serializes task request, sets Idempotency-Key header, and maps CallTask ID", async () => {
    let capturedRequest: Request | null = null;
    let capturedBody: any = null;

    // Custom fetch mock to intercept the exact HTTP request built by @call-e/calle
    const mockFetch = async (req: Request): Promise<Response> => {
      capturedRequest = req;
      const text = await req.clone().text();
      capturedBody = JSON.parse(text);

      const fakeResponse = {
        id: "call_task_mock_99182",
        object: "call_task",
        status: "in_progress",
        task: capturedBody.task,
        recipients: [
          {
            id: "rec_mock_1",
            phones: capturedBody.recipients?.[0]?.phones || [],
            status: "pending",
            structured_result: null,
            summary: null,
            attempts: [
              {
                id: "att_mock_1",
                phone: "+15550192834",
                provider_call_id: "prov_call_99182",
                status: "queued",
                started_at: null,
                completed_at: null,
              },
            ],
          },
        ],
        structured_result: null,
        summary: null,
        created_at: new Date().toISOString(),
      };

      return new Response(JSON.stringify(fakeResponse), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    };

    const gateway = new LiveCalleGateway("test_sk_secret_12345", "https://api.call-e.com", mockFetch);

    const idempotencyKey = "idem_test_driver_call_999";
    const result = await gateway.createCallTask({
      task: "Coordinate arrival window with driver Joe",
      phone: "+15550192834",
      recipientName: "Joe",
      metadata: { load_ref: "DG-2048", incident_id: "inc_123", call_type: "driver" },
      idempotencyKey,
    });

    // 1. Verify URL & Method
    expect(capturedRequest).not.toBeNull();
    const url = new URL(capturedRequest!.url);
    expect(url.pathname).toBe("/v1/calls");
    expect(capturedRequest!.method).toBe("POST");

    // 2. Verify Authorization and Idempotency-Key headers
    expect(capturedRequest!.headers.get("authorization")).toBe("Bearer test_sk_secret_12345");
    expect(capturedRequest!.headers.get("idempotency-key")).toBe(idempotencyKey);

    // 3. Verify Request Body serialization
    expect(capturedBody).toMatchObject({
      task: "Coordinate arrival window with driver Joe",
      recipients: [{ phones: ["+15550192834"] }],
      metadata: { load_ref: "DG-2048", incident_id: "inc_123", call_type: "driver" },
    });
    expect(capturedBody.recipient_result_schema.required).toEqual(
      expect.arrayContaining([
        "verified_interval_start",
        "verified_interval_end",
        "selection_permitted",
        "evidence_text",
      ])
    );

    // 4. Verify CallTask ID mapping
    expect(result.calleCallId).toBe("call_task_mock_99182");
    expect(result.providerCallId).toBe("prov_call_99182");
    expect(result.status).toBe("in_progress");
  });
});
