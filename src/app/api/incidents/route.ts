import { NextResponse } from "next/server";
import { getStore } from "@/server/context";
import { CreateIncidentSchema } from "@/domain/schemas";
import { Incident } from "@/domain/types";

export async function GET() {
  const store = getStore();
  const incidents = await store.listIncidents();
  return NextResponse.json({ incidents });
}

export async function POST(req: Request) {
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
