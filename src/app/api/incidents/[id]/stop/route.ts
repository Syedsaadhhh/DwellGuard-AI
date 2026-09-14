import { NextResponse } from "next/server";
import { getStore } from "@/server/context";
import { stopIncident } from "@/domain/workflow/advance-incident";
import { checkOperatorAuth } from "@/server/auth/session";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = checkOperatorAuth(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized: Operator session required." }, { status: 401 });
  }

  try {
    const store = getStore();
    const updated = await stopIncident(params.id, store);
    return NextResponse.json({ incident: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to stop incident" }, { status: 500 });
  }
}
