import { NextResponse } from "next/server";
import { getStore, getCalleGateway, getClock, getTokenGenerator } from "@/server/context";
import { checkRateLimit } from "@/server/auth/rate-limit";
import { advanceIncident } from "@/domain/workflow/advance-incident";

export async function POST(req: Request) {
  // Rate limit webhooks: max 60 per minute per IP
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimit = checkRateLimit(`webhook_${ip}`, 60, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const hintBody = await req.json();
    const callId = hintBody.call_id || hintBody.id || hintBody.data?.id;
    const incidentId = hintBody.metadata?.incident_id || hintBody.data?.metadata?.incident_id;

    if (!callId) {
      return NextResponse.json({ error: "Missing call identifier in webhook payload" }, { status: 400 });
    }

    const store = getStore();
    const gateway = getCalleGateway();
    const clock = getClock();
    const tokenGenerator = getTokenGenerator();

    // Persist event hint into audit log
    if (incidentId) {
      const incident = await store.getIncident(incidentId);
      if (incident) {
        await store.recordAuditEvent({
          incident_id: incidentId,
          authority_version: incident.authority_version,
          state_revision: incident.state_revision,
          event_type: "WEBHOOK_HINT_RECEIVED",
          details: { call_id: callId, status_hint: hintBody.status },
        });
      }
    }

    // Authoritative re-fetch using server credentials
    const authoritativeTask = await gateway.getCallTask(callId);

    // If incidentId known, advance workflow with authoritative state
    if (incidentId) {
      await advanceIncident(incidentId, store, gateway, clock, tokenGenerator);
    }

    return NextResponse.json({ received: true, call_id: callId, status: authoritativeTask.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Webhook processing error" }, { status: 500 });
  }
}
