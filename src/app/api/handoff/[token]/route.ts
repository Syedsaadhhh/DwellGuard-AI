import { NextResponse } from "next/server";
import { getStore, getTokenGenerator } from "@/server/context";
import crypto from "crypto";

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const tokenGen = getTokenGenerator();
  const store = getStore();

  // Support querying by raw token (hashed) or token hash
  const tokenHash = params.token.length === 64 ? params.token : tokenGen.hashToken(params.token);
  let tokenRecord = await store.getHandoffTokenByHash(tokenHash);

  // If not found by computed hash, check direct match
  if (!tokenRecord) {
    tokenRecord = await store.getHandoffTokenByHash(params.token);
  }

  if (!tokenRecord) {
    return NextResponse.json({ error: "Invalid or expired handoff link." }, { status: 404 });
  }

  const receipt = await store.getReceipt(tokenRecord.receipt_id);
  const incident = await store.getIncident(tokenRecord.incident_id);

  const isExpired = new Date(tokenRecord.expires_at) < new Date();

  const causalProof = await store.getCausalProof(tokenRecord.incident_id, tokenRecord.receipt_version);

  return NextResponse.json({
    tokenRecord: {
      id: tokenRecord.id,
      receipt_id: tokenRecord.receipt_id,
      receipt_version: tokenRecord.receipt_version,
      expires_at: tokenRecord.expires_at,
      acknowledged_at: tokenRecord.acknowledged_at,
      isExpired,
    },
    receipt,
    causalProof,
    incident: incident
      ? {
          load_ref: incident.load_ref,
          carrier: incident.carrier,
          origin: incident.origin,
          destination: incident.destination,
        }
      : null,
  });
}

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const tokenGen = getTokenGenerator();
  const store = getStore();

  const tokenHash = params.token.length === 64 ? params.token : tokenGen.hashToken(params.token);
  let tokenRecord = await store.getHandoffTokenByHash(tokenHash);
  if (!tokenRecord) {
    tokenRecord = await store.getHandoffTokenByHash(params.token);
  }

  if (!tokenRecord) {
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
    return NextResponse.json({ error: "Handoff token has expired or is invalid." }, { status: 400 });
  }

  const updatedProof = await store.getCausalProof(tokenRecord.incident_id, tokenRecord.receipt_version);

  return NextResponse.json({
    acknowledged: true,
    acknowledged_at: result.token?.acknowledged_at,
    receipt: result.receipt,
    causalProof: updatedProof,
  });
}
