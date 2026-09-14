import { NextResponse } from "next/server";
import { getDemoContext, getStore, getTokenGenerator } from "@/server/context";
import { advanceIncident } from "@/domain/workflow/advance-incident";
import { Store } from "@/domain/ports/store";
import crypto from "crypto";

const DEMO_TOKEN = "demo";
const DEMO_INCIDENT_ID = "inc_dg2048";

async function prepareDemoStore(): Promise<Store> {
  let demo = getDemoContext();
  let receipt = await demo.store.getReceiptByIncident(DEMO_INCIDENT_ID);
  let token = await demo.store.getHandoffTokenByIncident(DEMO_INCIDENT_ID);

  if (receipt && token) {
    return demo.store;
  }

  demo.resetDemo("positive");
  demo = getDemoContext();

  await demo.store.freezeAuthority(DEMO_INCIDENT_ID, {
    earliest_time: "2026-09-14T11:00:00-04:00",
    latest_time: "2026-09-14T13:00:00-04:00",
    timezone: "America/New_York",
    fee_ceiling: 150,
    currency: "USD",
    budget: 2,
    allow_selection_inside_interval: true,
    expires_at: "2026-09-14T14:00:00-04:00",
  });

  for (let step = 0; step < 4 && !receipt; step += 1) {
    await advanceIncident(
      DEMO_INCIDENT_ID,
      demo.store,
      demo.gateway,
      demo.clock,
      demo.tokenGenerator
    );
    receipt = await demo.store.getReceiptByIncident(DEMO_INCIDENT_ID);
  }

  token = await demo.store.getHandoffTokenByIncident(DEMO_INCIDENT_ID);
  if (!receipt || !token) {
    throw new Error("Demo handoff could not be prepared.");
  }

  return demo.store;
}

async function resolveHandoffToken(store: Store, token: string) {
  const tokenGen = getTokenGenerator();

  // Raw tokens and SHA-256 hashes are both 64 characters. Always hash the
  // incoming value first, then accept a stored hash as a compatibility path.
  const rawTokenHash = tokenGen.hashToken(token);
  return (
    (await store.getHandoffTokenByHash(rawTokenHash)) ||
    (await store.getHandoffTokenByHash(token))
  );
}

async function getHandoffContext(token: string) {
  const isDemo = token === DEMO_TOKEN;
  const store = isDemo ? await prepareDemoStore() : getStore();
  const tokenRecord = isDemo
    ? await store.getHandoffTokenByIncident(DEMO_INCIDENT_ID)
    : await resolveHandoffToken(store, token);

  return { store, tokenRecord };
}

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  try {
    const { store, tokenRecord } = await getHandoffContext(params.token);

    if (
      !tokenRecord ||
      (params.token !== DEMO_TOKEN && new Date(tokenRecord.expires_at) < new Date())
    ) {
      return NextResponse.json({ error: "Invalid or expired handoff link." }, { status: 404 });
    }

    const receipt = await store.getReceipt(tokenRecord.receipt_id);
    const incident = await store.getIncident(tokenRecord.incident_id);

    if (!receipt || !incident) {
      return NextResponse.json({ error: "This handoff is no longer available." }, { status: 404 });
    }

    const causalProof = await store.getCausalProof(
      tokenRecord.incident_id,
      tokenRecord.receipt_version
    );

    return NextResponse.json({
      tokenRecord: {
        id: tokenRecord.id,
        receipt_id: tokenRecord.receipt_id,
        receipt_version: tokenRecord.receipt_version,
        expires_at: tokenRecord.expires_at,
        acknowledged_at: tokenRecord.acknowledged_at,
        isExpired: false,
      },
      receipt,
      causalProof,
      incident: {
        load_ref: incident.load_ref,
        carrier: incident.carrier,
        origin: incident.origin,
        destination: incident.destination,
      },
    });
  } catch (error) {
    console.error("Handoff lookup failed", error);
    return NextResponse.json({ error: "This handoff is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    const { store, tokenRecord } = await getHandoffContext(params.token);

    if (
      !tokenRecord ||
      (params.token !== DEMO_TOKEN && new Date(tokenRecord.expires_at) < new Date())
    ) {
      return NextResponse.json({ error: "Invalid or expired handoff token." }, { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const clientIpHash = crypto.createHash("sha256").update(ip).digest("hex");
    const userAgent = req.headers.get("user-agent") || "Browser";

    const result = await store.acknowledgeHandoff(tokenRecord.token_hash, {
      acknowledged_at: new Date().toISOString(),
      client_ip_hash: clientIpHash,
      user_agent: userAgent,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Handoff token has expired or is invalid." },
        { status: 400 }
      );
    }

    const updatedProof = await store.getCausalProof(
      tokenRecord.incident_id,
      tokenRecord.receipt_version
    );

    return NextResponse.json({
      acknowledged: true,
      acknowledged_at: result.token?.acknowledged_at,
      receipt: result.receipt,
      causalProof: updatedProof,
    });
  } catch (error) {
    console.error("Handoff acknowledgment failed", error);
    return NextResponse.json(
      { error: "This handoff is temporarily unavailable." },
      { status: 503 }
    );
  }
}
