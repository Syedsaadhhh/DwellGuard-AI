import { Store } from "../ports/store";
import { CalleGateway } from "../ports/calle-gateway";
import { Clock } from "../ports/clock";
import { TokenGenerator } from "../ports/tokens";
import { advanceIncident } from "./advance-incident";

export interface RecoveryWorkerResult {
  checkedCount: number;
  recoveredCount: number;
  errors: Array<{ incidentId: string; error: string }>;
}

export async function runRecoveryWorker(
  store: Store,
  gateway: CalleGateway,
  clock: Clock,
  tokenGenerator: TokenGenerator,
  workerId = `worker_${Date.now()}`
): Promise<RecoveryWorkerResult> {
  const incidents = await store.listIncidents();
  let checkedCount = 0;
  let recoveredCount = 0;
  const errors: Array<{ incidentId: string; error: string }> = [];

  for (const incident of incidents) {
    if (
      incident.status === "driver_task_pending" ||
      incident.status === "dock_task_pending" ||
      incident.status === "driver_result_verified"
    ) {
      checkedCount++;
      try {
        await advanceIncident(incident.id, store, gateway, clock, tokenGenerator, { workerId });
        recoveredCount++;
      } catch (err: any) {
        errors.push({ incidentId: incident.id, error: err.message || String(err) });
      }
    }
  }

  return { checkedCount, recoveredCount, errors };
}
