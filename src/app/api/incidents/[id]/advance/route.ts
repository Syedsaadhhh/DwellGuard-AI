import { NextResponse } from "next/server";
import { getStore, getCalleGateway, getClock, getTokenGenerator } from "@/server/context";
import { advanceIncident } from "@/domain/workflow/advance-incident";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const store = getStore();
    const gateway = getCalleGateway();
    const clock = getClock();
    const tokenGenerator = getTokenGenerator();

    const host = req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const webhookBaseUrl = host ? `${proto}://${host}` : undefined;

    const updated = await advanceIncident(params.id, store, gateway, clock, tokenGenerator, {
      webhookBaseUrl,
    });

    return NextResponse.json({ incident: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to advance incident" }, { status: 500 });
  }
}
