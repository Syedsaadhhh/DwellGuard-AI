import { NextResponse } from "next/server";
import { getDemoContext } from "@/server/context";
import { advanceIncident } from "@/domain/workflow/advance-incident";

export async function GET() {
  const { store } = getDemoContext();
  const incidentId = "inc_dg2048";
  const incident = await store.getIncident(incidentId);
  const authority = await store.getLatestAuthority(incidentId);
  const observations = await store.getObservations(incidentId);
  const receipt = await store.getReceiptByIncident(incidentId);
  const handoffToken = await store.getHandoffTokenByIncident(incidentId);
  const causalProof = await store.getCausalProof(incidentId);
  const auditEvents = await store.getAuditEvents(incidentId);

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action || "step"; // "reset" | "step" | "authorize" | "acknowledge"
    const scenario = body.scenario || "positive"; // "positive" | "fee_refusal"

    const demo = getDemoContext();
    const incidentId = "inc_dg2048";

    if (action === "reset") {
      demo.resetDemo(scenario);
      const inc = await demo.store.getIncident(incidentId);
      return NextResponse.json({
        message: `Demo reset to ${scenario} scenario`,
        incident: inc,
        step: 0,
      });
    }

    if (action === "authorize") {
      const auth = await demo.store.freezeAuthority(incidentId, {
        earliest_time: "2026-09-14T11:00:00-04:00",
        latest_time: "2026-09-14T13:00:00-04:00",
        timezone: "America/New_York",
        fee_ceiling: 150,
        currency: "USD",
        budget: 2,
        allow_selection_inside_interval: true,
        expires_at: "2026-09-14T14:00:00-04:00",
      });

      const updated = await advanceIncident(
        incidentId,
        demo.store,
        demo.gateway,
        demo.clock,
        demo.tokenGenerator
      );

      const obs = await demo.store.getObservations(incidentId);
      const rcpt = await demo.store.getReceiptByIncident(incidentId);
      const token = await demo.store.getHandoffTokenByIncident(incidentId);
      const causalProof = await demo.store.getCausalProof(incidentId);

      return NextResponse.json({
        incident: updated,
        authority: auth,
        observations: obs,
        receipt: rcpt,
        handoffToken: token,
        causalProof,
      });
    }

    if (action === "acknowledge") {
      const token = await demo.store.getHandoffTokenByIncident(incidentId);
      if (!token) {
        return NextResponse.json({ error: "No active handoff token" }, { status: 400 });
      }

      const ackRes = await demo.store.acknowledgeHandoff(token.token_hash, {
        acknowledged_at: new Date().toISOString(),
        user_agent: "Demo Driver Phone Simulator",
      });

      const updated = await demo.store.getIncident(incidentId);
      const authority = await demo.store.getLatestAuthority(incidentId);
      const observations = await demo.store.getObservations(incidentId);
      const receipt = await demo.store.getReceiptByIncident(incidentId);
      const handoffToken = await demo.store.getHandoffTokenByIncident(incidentId);
      const causalProof = await demo.store.getCausalProof(incidentId);
      return NextResponse.json({
        acknowledged: ackRes.success,
        incident: updated,
        authority,
        observations,
        receipt,
        handoffToken,
        causalProof,
      });
    }

    // Default step action: automatically performs the next logical action
    const current = await demo.store.getIncident(incidentId);
    if (!current) {
      return NextResponse.json({ error: "Demo incident not found" }, { status: 404 });
    }

    if (current.status === "draft") {
      // Step 1: Authorize
      await demo.store.freezeAuthority(incidentId, {
        earliest_time: "2026-09-14T11:00:00-04:00",
        latest_time: "2026-09-14T13:00:00-04:00",
        timezone: "America/New_York",
        fee_ceiling: 150,
        currency: "USD",
        budget: 2,
        allow_selection_inside_interval: true,
        expires_at: "2026-09-14T14:00:00-04:00",
      });
      demo.gateway.setScenario(scenario);
    }

    const updated = await advanceIncident(
      incidentId,
      demo.store,
      demo.gateway,
      demo.clock,
      demo.tokenGenerator
    );

    const authority = await demo.store.getLatestAuthority(incidentId);
    const observations = await demo.store.getObservations(incidentId);
    const receipt = await demo.store.getReceiptByIncident(incidentId);
    const handoffToken = await demo.store.getHandoffTokenByIncident(incidentId);
    const causalProof = await demo.store.getCausalProof(incidentId);

    return NextResponse.json({
      incident: updated,
      authority,
      observations,
      receipt,
      handoffToken,
      causalProof,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Demo action failed" }, { status: 500 });
  }
}
