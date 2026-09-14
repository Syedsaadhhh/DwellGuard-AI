import { Store } from "../ports/store";
import { CalleGateway } from "../ports/calle-gateway";
import { Clock } from "../ports/clock";
import { TokenGenerator } from "../ports/tokens";
import { Incident, Observation } from "../types";
import { advanceIncident, AdvanceOptions } from "./advance-incident";

/**
 * Reconciles an asynchronous in-flight CALL-E task by its CallTask ID.
 * Retrieves the latest authoritative state from the provider, records deduplicated snapshot/observation,
 * and resumes the state machine without ever re-dispatching or creating another call.
 */
export async function reconcileCallTask(
  calleCallId: string,
  store: Store,
  gateway: CalleGateway,
  clock: Clock,
  tokenGenerator: TokenGenerator,
  options: AdvanceOptions = {}
): Promise<Incident | null> {
  const intent = await store.getCallIntentByCalleCallId(calleCallId);
  if (!intent) {
    return null;
  }

  const incident = await store.getIncident(intent.incident_id);
  if (!incident) {
    return null;
  }

  // Authoritative retrieval ONLY — zero creates
  const taskResult = await gateway.getCallTask(calleCallId);

  intent.status = taskResult.status === "completed" ? "completed" : "dispatched";
  await store.saveCallIntent(intent);

  await store.saveCallSnapshot({
    id: `snap_${intent.id}_${taskResult.status}`,
    intent_id: intent.id,
    calle_call_id: calleCallId,
    status: taskResult.status,
    request_dump: { rechecked_at: clock.isoNow(), task_id: calleCallId },
    response_dump: taskResult.rawResponse,
    created_at: clock.isoNow(),
  });

  if (taskResult.status === "completed" && taskResult.structuredResult) {
    const res = taskResult.structuredResult as Record<string, any>;
    if (intent.call_type === "driver") {
      const obs: Observation = {
        id: `obs_drv_${incident.id}`,
        incident_id: incident.id,
        calle_call_id: taskResult.calleCallId,
        speaker_role: "driver",
        verified_interval_start: res.verified_interval_start,
        verified_interval_end: res.verified_interval_end,
        selection_permitted: res.selection_permitted ?? true,
        evidence_text: Array.isArray(res.evidence_text)
          ? res.evidence_text
          : [res.summary || "Driver arrival confirmed"],
        raw_transcript_snippet: taskResult.summary || undefined,
        created_at: clock.isoNow(),
      };
      await store.saveObservation(obs);
    } else if (intent.call_type === "dock") {
      const obs: Observation = {
        id: `obs_dock_${incident.id}`,
        incident_id: incident.id,
        calle_call_id: taskResult.calleCallId,
        speaker_role: "dock",
        confirmed_time: res.confirmed_time,
        door: res.door,
        fee_amount: res.fee_amount ?? 0,
        fee_currency: res.fee_currency || "USD",
        conditions: res.conditions,
        confirmation_basis: res.confirmation_basis || "Dock confirmed appointment slot",
        evidence_text: Array.isArray(res.evidence_text)
          ? res.evidence_text
          : [res.summary || "Appointment confirmed"],
        raw_transcript_snippet: taskResult.summary || undefined,
        created_at: clock.isoNow(),
      };
      await store.saveObservation(obs);
    }

    // Resume state machine
    return await advanceIncident(incident.id, store, gateway, clock, tokenGenerator, options);
  }

  return incident;
}
