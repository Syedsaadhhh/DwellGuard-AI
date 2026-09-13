import { NextResponse } from "next/server";
import { getStore } from "@/server/context";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const incident = await store.getIncident(params.id);
  if (!incident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  const authority = await store.getLatestAuthority(params.id);
  const observations = await store.getObservations(params.id);
  const receipt = await store.getReceiptByIncident(params.id);
  const handoffToken = await store.getHandoffTokenByIncident(params.id);
  const auditEvents = await store.getAuditEvents(params.id);

  return NextResponse.json({
    incident,
    authority,
    observations,
    receipt,
    handoffToken,
    auditEvents,
  });
}
