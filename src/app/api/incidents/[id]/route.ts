import { NextResponse } from "next/server";
import { getStore } from "@/server/context";
import { checkOperatorAuth } from "@/server/auth/session";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = checkOperatorAuth(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized: Operator session required." }, { status: 401 });
  }

  const store = getStore();
  const incident = await store.getIncident(params.id);
  if (!incident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  const authority = await store.getLatestAuthority(params.id);
  const observations = await store.getObservations(params.id);
  const receipt = await store.getReceiptByIncident(params.id);
  const rawTokenRecord = await store.getHandoffTokenByIncident(params.id);
  const causalProof = await store.getCausalProof(params.id);
  const auditEvents = await store.getAuditEvents(params.id);

  // Sanitize handoffToken: never expose token_hash to client
  const handoffToken = rawTokenRecord
    ? {
        id: rawTokenRecord.id,
        receipt_id: rawTokenRecord.receipt_id,
        receipt_version: rawTokenRecord.receipt_version,
        raw_token_display: rawTokenRecord.raw_token_display,
        expires_at: rawTokenRecord.expires_at,
        acknowledged_at: rawTokenRecord.acknowledged_at,
      }
    : null;

  return NextResponse.json({
    incident,
    authority,
    observations,
    receipt,
    handoffToken,
    causalProof,
    auditEvents,
  });
}
