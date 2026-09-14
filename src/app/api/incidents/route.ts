import { NextResponse } from "next/server";
import { getStore } from "@/server/context";
import { CreateIncidentSchema } from "@/domain/schemas";
import { Incident } from "@/domain/types";
import { checkOperatorAuth } from "@/server/auth/session";

export async function GET(req: Request) {
  const auth = checkOperatorAuth(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized: Operator session required." }, { status: 401 });
  }

  const store = getStore();
  const incidents = await store.listIncidents();
  // Sanitize: ensure no internal token hashes are exposed in public list
  const sanitized = incidents.map((inc) => ({
    id: inc.id,
    load_ref: inc.load_ref,
    carrier: inc.carrier,
    origin: inc.origin,
    destination: inc.destination,
    dock_name: inc.dock_name,
    original_appointment: inc.original_appointment,
    updated_eta: inc.updated_eta,
    status: inc.status,
    authority_version: inc.authority_version,
    causal_proof_short_id: inc.causal_proof_short_id,
    created_at: inc.created_at,
  }));
  return NextResponse.json({ incidents: sanitized });
}

export async function POST(req: Request) {
  const auth = checkOperatorAuth(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized: Operator session required." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = CreateIncidentSchema.parse(body);

    const store = getStore();
    const id = `inc_${Date.now()}`;
    const newIncident: Incident = {
      ...validated,
      id,
      status: "draft",
      authority_version: 0,
      state_revision: 1,
      task_budget_remaining: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const created = await store.createIncident(newIncident);
    return NextResponse.json({ incident: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid input" }, { status: 400 });
  }
}
