import { NextResponse } from "next/server";
import { getStore, getCalleGateway, getClock, getTokenGenerator } from "@/server/context";
import { checkRateLimit } from "@/server/auth/rate-limit";
import { reconcileCallTask } from "@/domain/workflow/reconcile";

export async function POST(req: Request) {
  // 1. Rate limiting: max 60 requests/minute per IP
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimit = checkRateLimit(`webhook_${ip}`, 60, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // 2. Strict CALL-E event headers
  const eventIdHeader = req.headers.get("call-e-event-id");
  if (!eventIdHeader) {
    return NextResponse.json(
      { error: "Webhook rejected: Missing required CALL-E-Event-Id header." },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const bodyEventId = body.id || body.event_id;

    if (!bodyEventId || eventIdHeader !== bodyEventId) {
      return NextResponse.json(
        { error: "Webhook rejected: CALL-E-Event-Id header does not match body event id." },
        { status: 400 }
      );
    }

    const store = getStore();

    // 3. Extract the CallTask ID
    const calleCallId = body.data?.id || body.call_id || (body.object === "call_task" ? body.id : null);
    if (!calleCallId) {
      return NextResponse.json({ error: "Missing CallTask ID in webhook payload" }, { status: 400 });
    }

    // 4. Map the CallTask ID strictly to a saved intent in the store
    // NEVER choose an incident solely from untrusted webhook body metadata!
    const intent = await store.getCallIntentByCalleCallId(calleCallId);
    if (!intent) {
      return NextResponse.json(
        { received: true, ignored: true, reason: "No matching intent for CallTask ID" },
        { status: 200 }
      );
    }

    // 5. Deduplicate event ID
    const recentAudits = await store.getAuditEvents(intent.incident_id);
    const alreadyProcessed = recentAudits.some(
      (a) => a.event_type === "WEBHOOK_EVENT_PROCESSED" && a.details.event_id === bodyEventId
    );
    if (alreadyProcessed) {
      return NextResponse.json({ received: true, deduplicated: true }, { status: 200 });
    }

    // Record receipt of this verified webhook event
    await store.recordAuditEvent({
      incident_id: intent.incident_id,
      authority_version: intent.authority_version,
      state_revision: 0,
      event_type: "WEBHOOK_EVENT_PROCESSED",
      details: { event_id: bodyEventId, call_id: calleCallId },
    });

    // 6. Authoritative re-fetch using server credentials (or demo gateway in demo mode)
    const gateway = getCalleGateway();
    const clock = getClock();
    const tokenGenerator = getTokenGenerator();

    const updatedIncident = await reconcileCallTask(calleCallId, store, gateway, clock, tokenGenerator);

    return NextResponse.json({
      received: true,
      event_id: bodyEventId,
      incident_id: intent.incident_id,
      status: updatedIncident?.status,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Webhook processing error" }, { status: 500 });
  }
}
