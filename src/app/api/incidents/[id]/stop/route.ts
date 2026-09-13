import { NextResponse } from "next/server";
import { getStore } from "@/server/context";
import { stopIncident } from "@/domain/workflow/advance-incident";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const store = getStore();
    const updated = await stopIncident(params.id, store);
    return NextResponse.json({ incident: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to stop incident" }, { status: 500 });
  }
}
