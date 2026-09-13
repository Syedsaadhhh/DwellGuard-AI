import { NextResponse } from "next/server";
import { getStore, getCalleGateway, getClock, getTokenGenerator } from "@/server/context";
import { AuthorizeIncidentSchema } from "@/domain/schemas";
import { advanceIncident } from "@/domain/workflow/advance-incident";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const validated = AuthorizeIncidentSchema.parse(body);

    const store = getStore();
    const incident = await store.getIncident(params.id);
    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    // Freeze authority
    const frozenAuthority = await store.freezeAuthority(params.id, validated);

    // Record audit event
    await store.recordAuditEvent({
      incident_id: params.id,
      authority_version: frozenAuthority.version,
      state_revision: incident.state_revision,
      event_type: "AUTHORITY_FROZEN",
      details: { ...validated },
    });

    // Advance incident
    const gateway = getCalleGateway();
    const clock = getClock();
    const tokenGenerator = getTokenGenerator();

    const host = req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const webhookBaseUrl = host ? `${proto}://${host}` : undefined;

    const updated = await advanceIncident(params.id, store, gateway, clock, tokenGenerator, {
      webhookBaseUrl,
    });

    return NextResponse.json({
      incident: updated,
      authority: frozenAuthority,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Authorization failed" }, { status: 400 });
  }
}
