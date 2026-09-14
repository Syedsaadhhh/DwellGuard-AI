import { Store } from "../ports/store";
import { CalleGateway } from "../ports/calle-gateway";
import { Clock } from "../ports/clock";
import { TokenGenerator } from "../ports/tokens";
import { Incident, Observation, Receipt, HandoffToken } from "../types";
import { computeIntervalIntersection } from "./interval";
import { validateDriverEvidence, validateDockEvidence } from "./evidence";
import { generateCausalProof } from "../proof/causal-proof";

export interface AdvanceOptions {
  workerId?: string;
  webhookBaseUrl?: string;
}

export async function advanceIncident(
  incidentId: string,
  store: Store,
  gateway: CalleGateway,
  clock: Clock,
  tokenGenerator: TokenGenerator,
  options: AdvanceOptions = {}
): Promise<Incident> {
  const incident = await store.getIncident(incidentId);
  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }

  // Terminal states do not advance automatically
  if (
    incident.status === "stopped" ||
    incident.status === "driver_received" ||
    incident.status === "dispatcher_needed"
  ) {
    return incident;
  }

  const authority = await store.getLatestAuthority(incidentId);
  if (!authority) {
    return incident;
  }

  // Enforce authority expiration before dispatch
  if (new Date(authority.expires_at).getTime() < clock.now().getTime()) {
    incident.status = "dispatcher_needed";
    incident.resolution_reason = "Authority window expired before plan confirmation.";
    await store.recordAuditEvent({
      incident_id: incident.id,
      authority_version: incident.authority_version,
      state_revision: incident.state_revision,
      event_type: "AUTHORITY_EXPIRED",
      details: { expires_at: authority.expires_at },
    });
    return await store.updateIncident(incident);
  }

  // STAGE 1: Launch Driver Call
  if (incident.status === "authorized") {
    const idempotencyKey = `idem_driver_${incident.id}_v${incident.authority_version}`;
    let intent = await store.getCallIntentByIdempotencyKey(idempotencyKey);

    if (!intent) {
      const budgetRes = await store.reserveCallBudget(incident.id, 1);
      if (!budgetRes.success) {
        incident.status = "dispatcher_needed";
        incident.resolution_reason = "Task budget exhausted (max 2 calls reached).";
        return await store.updateIncident(incident);
      }

      intent = await store.saveCallIntent({
        id: `intent_drv_${incident.id}_${Date.now()}`,
        incident_id: incident.id,
        authority_version: incident.authority_version,
        call_type: "driver",
        idempotency_key: idempotencyKey,
        payload: {
          driver_name: incident.driver_contact_name,
          phone: incident.driver_phone,
          load_ref: incident.load_ref,
        },
        status: "created",
        created_at: clock.isoNow(),
      });
    }

    incident.status = "driver_task_pending";
    await store.updateIncident(incident);

    // CALL-E I/O outside DB transaction
    let taskResult;
    if (intent.calle_call_id) {
      taskResult = await gateway.getCallTask(intent.calle_call_id);
    } else {
      taskResult = await gateway.createCallTask({
        task: `Call driver ${incident.driver_contact_name} regarding delayed load ${incident.load_ref}. Verify their earliest and latest workable check-in time and ask if they authorize DwellGuard to select a dock slot within that interval.`,
        phone: incident.driver_phone,
        recipientName: incident.driver_contact_name,
        metadata: { incident_id: incident.id, load_ref: incident.load_ref, call_type: "driver" },
        webhookUrl: options.webhookBaseUrl ? `${options.webhookBaseUrl}/api/webhooks/calle` : undefined,
        idempotencyKey,
      });

      intent.calle_call_id = taskResult.calleCallId;
      intent.status = taskResult.status === "completed" ? "completed" : "dispatched";
      await store.saveCallIntent(intent);

      await store.saveCallSnapshot({
        id: `snap_${intent.id}`,
        intent_id: intent.id,
        calle_call_id: taskResult.calleCallId,
        status: taskResult.status,
        request_dump: { phone: incident.driver_phone, task: intent.payload },
        response_dump: taskResult.rawResponse,
        created_at: clock.isoNow(),
      });

      incident.driver_calle_call_id = taskResult.calleCallId;
      await store.updateIncident(incident);
    }

    if (taskResult.status === "completed" && taskResult.structuredResult) {
      const res = taskResult.structuredResult as Record<string, any>;
      const obs: Observation = {
        id: `obs_drv_${incident.id}`,
        incident_id: incident.id,
        calle_call_id: taskResult.calleCallId,
        speaker_role: "driver",
        verified_interval_start: res.verified_interval_start,
        verified_interval_end: res.verified_interval_end,
        selection_permitted: res.selection_permitted ?? true,
        evidence_text: Array.isArray(res.evidence_text) ? res.evidence_text : [res.summary || "Driver arrival confirmed"],
        raw_transcript_snippet: taskResult.summary || undefined,
        created_at: clock.isoNow(),
      };
      await store.saveObservation(obs);
    }
  }

  // Check if driver call is pending in asynchronous mode
  if (incident.status === "driver_task_pending" && incident.driver_calle_call_id) {
    const existingObs = (await store.getObservations(incident.id)).find((o) => o.speaker_role === "driver");
    if (!existingObs) {
      const taskCheck = await gateway.getCallTask(incident.driver_calle_call_id);
      if (taskCheck.status === "completed" && taskCheck.structuredResult) {
        const res = taskCheck.structuredResult as Record<string, any>;
        const obs: Observation = {
          id: `obs_drv_${incident.id}`,
          incident_id: incident.id,
          calle_call_id: taskCheck.calleCallId,
          speaker_role: "driver",
          verified_interval_start: res.verified_interval_start,
          verified_interval_end: res.verified_interval_end,
          selection_permitted: res.selection_permitted ?? true,
          evidence_text: Array.isArray(res.evidence_text) ? res.evidence_text : [res.summary || "Driver arrival confirmed"],
          raw_transcript_snippet: taskCheck.summary || undefined,
          created_at: clock.isoNow(),
        };
        await store.saveObservation(obs);
      }
    }
  }

  // STAGE 2: Process Driver Observation and Launch Dock Call
  const observations = await store.getObservations(incident.id);
  const driverObs = observations.find((o) => o.speaker_role === "driver");

  if (driverObs && (incident.status === "driver_task_pending" || (incident.status as string) === "authorized")) {
    const driverCheck = validateDriverEvidence(driverObs);
    if (!driverCheck.permitted || !driverCheck.validInterval) {
      incident.status = "dispatcher_needed";
      incident.resolution_reason = driverCheck.reason || "Driver did not grant selection permission.";
      await store.recordAuditEvent({
        incident_id: incident.id,
        authority_version: incident.authority_version,
        state_revision: incident.state_revision,
        event_type: "DRIVER_PERMISSION_REFUSED",
        details: { reason: incident.resolution_reason },
      });
      return await store.updateIncident(incident);
    }

    const overlapResult = computeIntervalIntersection(
      authority.earliest_time,
      authority.latest_time,
      driverObs.verified_interval_start!,
      driverObs.verified_interval_end!,
      authority.timezone,
      incident.dock_name,
      driverObs.selection_permitted
    );

    if (!overlapResult.hasOverlap || !overlapResult.overlap) {
      incident.status = "dispatcher_needed";
      incident.resolution_reason = overlapResult.explanation;
      await store.recordAuditEvent({
        incident_id: incident.id,
        authority_version: incident.authority_version,
        state_revision: incident.state_revision,
        event_type: "EMPTY_INTERVAL_INTERSECTION",
        details: { reason: overlapResult.explanation },
      });
      return await store.updateIncident(incident);
    }

    incident.status = "driver_result_verified";
    await store.updateIncident(incident);

    // Launch Dock Call
    const idempotencyKey = `idem_dock_${incident.id}_v${incident.authority_version}`;
    let dockIntent = await store.getCallIntentByIdempotencyKey(idempotencyKey);

    if (!dockIntent) {
      const budgetRes = await store.reserveCallBudget(incident.id, 1);
      if (!budgetRes.success) {
        incident.status = "dispatcher_needed";
        incident.resolution_reason = "Task budget exhausted before dock call.";
        return await store.updateIncident(incident);
      }

      dockIntent = await store.saveCallIntent({
        id: `intent_dock_${incident.id}_${Date.now()}`,
        incident_id: incident.id,
        authority_version: incident.authority_version,
        call_type: "dock",
        idempotency_key: idempotencyKey,
        payload: {
          overlap_start: overlapResult.overlap.start,
          overlap_end: overlapResult.overlap.end,
          dock_name: incident.dock_name,
          dock_phone: incident.dock_phone,
        },
        status: "created",
        created_at: clock.isoNow(),
      });
    }

    incident.status = "dock_task_pending";
    await store.updateIncident(incident);

    let dockTaskResult;
    if (dockIntent.calle_call_id) {
      dockTaskResult = await gateway.getCallTask(dockIntent.calle_call_id);
    } else {
      dockTaskResult = await gateway.createCallTask({
        task: `${overlapResult.explanation} Please confirm an exact appointment time and designated receiving door for load ${incident.load_ref}.`,
        phone: incident.dock_phone,
        recipientName: incident.dock_contact_name,
        metadata: { incident_id: incident.id, load_ref: incident.load_ref, call_type: "dock" },
        webhookUrl: options.webhookBaseUrl ? `${options.webhookBaseUrl}/api/webhooks/calle` : undefined,
        idempotencyKey,
      });

      dockIntent.calle_call_id = dockTaskResult.calleCallId;
      dockIntent.status = dockTaskResult.status === "completed" ? "completed" : "dispatched";
      await store.saveCallIntent(dockIntent);

      await store.saveCallSnapshot({
        id: `snap_${dockIntent.id}`,
        intent_id: dockIntent.id,
        calle_call_id: dockTaskResult.calleCallId,
        status: dockTaskResult.status,
        request_dump: { phone: incident.dock_phone, task: dockIntent.payload },
        response_dump: dockTaskResult.rawResponse,
        created_at: clock.isoNow(),
      });

      incident.dock_calle_call_id = dockTaskResult.calleCallId;
      await store.updateIncident(incident);
    }

    if (dockTaskResult.status === "completed" && dockTaskResult.structuredResult) {
      const res = dockTaskResult.structuredResult as Record<string, any>;
      const obs: Observation = {
        id: `obs_dock_${incident.id}`,
        incident_id: incident.id,
        calle_call_id: dockTaskResult.calleCallId,
        speaker_role: "dock",
        confirmed_time: res.confirmed_time,
        door: res.door,
        fee_amount: res.fee_amount ?? 0,
        fee_currency: res.fee_currency || "USD",
        conditions: res.conditions,
        confirmation_basis: res.confirmation_basis || "Dock confirmed appointment slot",
        evidence_text: Array.isArray(res.evidence_text) ? res.evidence_text : [res.summary || "Appointment confirmed"],
        raw_transcript_snippet: dockTaskResult.summary || undefined,
        created_at: clock.isoNow(),
      };
      await store.saveObservation(obs);
    }
  }

  // Check if dock call is pending in asynchronous mode
  if (incident.status === "dock_task_pending" && incident.dock_calle_call_id) {
    const existingDockObs = (await store.getObservations(incident.id)).find((o) => o.speaker_role === "dock");
    if (!existingDockObs) {
      const taskCheck = await gateway.getCallTask(incident.dock_calle_call_id);
      if (taskCheck.status === "completed" && taskCheck.structuredResult) {
        const res = taskCheck.structuredResult as Record<string, any>;
        const obs: Observation = {
          id: `obs_dock_${incident.id}`,
          incident_id: incident.id,
          calle_call_id: taskCheck.calleCallId,
          speaker_role: "dock",
          confirmed_time: res.confirmed_time,
          door: res.door,
          fee_amount: res.fee_amount ?? 0,
          fee_currency: res.fee_currency || "USD",
          conditions: res.conditions,
          confirmation_basis: res.confirmation_basis || "Dock confirmed appointment slot",
          evidence_text: Array.isArray(res.evidence_text) ? res.evidence_text : [res.summary || "Appointment confirmed"],
          raw_transcript_snippet: taskCheck.summary || undefined,
          created_at: clock.isoNow(),
        };
        await store.saveObservation(obs);
      }
    }
  }

  // STAGE 3: Process Dock Observation, Finalize Receipt & Causal Proof
  const updatedObs = await store.getObservations(incident.id);
  const dockObs = updatedObs.find((o) => o.speaker_role === "dock");

  if (dockObs && (incident.status === "dock_task_pending" || incident.status === "driver_result_verified")) {
    const driverObsRec = updatedObs.find((o) => o.speaker_role === "driver")!;
    const overlapResult = computeIntervalIntersection(
      authority.earliest_time,
      authority.latest_time,
      driverObsRec.verified_interval_start!,
      driverObsRec.verified_interval_end!,
      authority.timezone,
      incident.dock_name,
      driverObsRec.selection_permitted
    );

    const dockCheck = validateDockEvidence(dockObs, authority, overlapResult.overlap!);

    if (!dockCheck.valid) {
      incident.status = "dispatcher_needed";
      incident.resolution_reason = dockCheck.explanation;
      await store.recordAuditEvent({
        incident_id: incident.id,
        authority_version: incident.authority_version,
        state_revision: incident.state_revision,
        event_type: "DOCK_CONFIRMATION_REFUSED",
        details: { reason: dockCheck.explanation },
      });
      return await store.updateIncident(incident);
    }

    // 1. Initial Receipt Object
    const receipt: Receipt = {
      id: `rcpt_${incident.id}_v${incident.authority_version}`,
      incident_id: incident.id,
      version: incident.authority_version,
      load_ref: incident.load_ref,
      confirmed_time: dockObs.confirmed_time!,
      timezone: authority.timezone,
      dock_name: incident.dock_name,
      door: dockObs.door,
      fee_amount: dockObs.fee_amount ?? 0,
      fee_currency: dockObs.fee_currency || "USD",
      confirmation_basis: dockObs.confirmation_basis || "Dock coordinator confirmed revised appointment",
      created_at: clock.isoNow(),
    };

    // 2. Generate and store Causal Appointment Proof
    const causalProof = generateCausalProof(
      incident,
      authority,
      driverObsRec,
      dockObs,
      overlapResult.overlap!,
      receipt,
      null
    );
    await store.saveCausalProof(causalProof);

    receipt.causal_proof_id = causalProof.id;
    receipt.causal_proof_short_id = causalProof.short_id;

    await store.finalizeReceipt(receipt);

    // 3. Create Handoff Token (scoped to this receipt version)
    const { rawToken, tokenHash } = tokenGenerator.generateToken();
    const handoffToken: HandoffToken = {
      id: `tok_${incident.id}_${Date.now()}`,
      incident_id: incident.id,
      receipt_id: receipt.id,
      receipt_version: receipt.version,
      token_hash: tokenHash,
      raw_token_display: rawToken, // Returned for distribution
      expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      created_at: clock.isoNow(),
    };
    await store.createHandoffToken(handoffToken);

    incident.status = "plan_confirmed";
    incident.confirmed_receipt_id = receipt.id;
    incident.handoff_token_id = handoffToken.id;
    incident.causal_proof_id = causalProof.id;
    incident.causal_proof_short_id = causalProof.short_id;

    await store.recordAuditEvent({
      incident_id: incident.id,
      authority_version: incident.authority_version,
      state_revision: incident.state_revision,
      event_type: "PLAN_CONFIRMED",
      details: {
        receipt_id: receipt.id,
        proof_id: causalProof.id,
        proof_short_id: causalProof.short_id,
      },
    });

    return await store.updateIncident(incident);
  }

  return incident;
}

export async function stopIncident(incidentId: string, store: Store): Promise<Incident> {
  const incident = await store.getIncident(incidentId);
  if (!incident) throw new Error(`Incident ${incidentId} not found`);

  incident.status = "stopped";
  incident.resolution_reason = "Manual stop commanded by dispatcher.";
  await store.recordAuditEvent({
    incident_id: incident.id,
    authority_version: incident.authority_version,
    state_revision: incident.state_revision,
    event_type: "INCIDENT_STOPPED",
    details: { reason: incident.resolution_reason },
  });

  return await store.updateIncident(incident);
}
