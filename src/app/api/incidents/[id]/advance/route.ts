import { NextResponse } from "next/server";
import { getStore, getCalleGateway, getClock, getTokenGenerator } from "@/server/context";
import { advanceIncident } from "@/domain/workflow/advance-incident";
import { checkOperatorAuth } from "@/server/auth/session";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = checkOperatorAuth(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized: Operator session required." }, { status: 401 });
  }

  try {
    const store = getStore();

    let gateway;
    try {
      gateway = getCalleGateway();
    } catch (gwErr: any) {
      return NextResponse.json(
        {
          error: gwErr.message || "BLOCKED_LIVE: CALL-E gateway credentials missing.",
          status: "BLOCKED_LIVE",
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

    return NextResponse.json({ incident: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to advance incident" }, { status: 500 });
  }
}
