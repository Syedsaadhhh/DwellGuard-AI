import { NextResponse } from "next/server";
import { getStore, getCalleGateway, getClock, getTokenGenerator } from "@/server/context";
import { AuthorizeIncidentSchema } from "@/domain/schemas";
import { advanceIncident } from "@/domain/workflow/advance-incident";
import { checkOperatorAuth } from "@/server/auth/session";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = checkOperatorAuth(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized: Operator session required." }, { status: 401 });
  }

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

    await store.recordAuditEvent({
      incident_id: params.id,
      authority_version: frozenAuthority.version,
      state_revision: incident.state_revision,
      event_type: "AUTHORITY_FROZEN",
      details: { ...validated },
    });

    let gateway;
    try {
      gateway = getCalleGateway();
    } catch (gwErr: any) {
      // Fail closed with clear non-2xx BLOCKED_LIVE response if credentials missing
      return NextResponse.json(
        {
          error: gwErr.message || "BLOCKED_LIVE: CALL-E gateway credentials missing.",
          status: "BLOCKED_LIVE",
          authority: frozenAuthority,
        },
        { status: 503 }
      );
    }

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
