import Link from "next/link";
import { getStore } from "@/server/context";
import { formatLocalTime } from "@/domain/workflow/interval";

export const revalidate = 0;

export default async function HomePage() {
  const store = getStore();
  const incidents = await store.listIncidents();

  const atRiskLoad = incidents.find((i) => i.id === "inc_dg2048") || incidents[0];
  const supportingLoads = incidents.filter((i) => i.id !== atRiskLoad?.id);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-edge pb-4 gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink-primary">
            Keep the dock plan moving.
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Active dispatch coordination desk · Two CALL-E voice tasks maximum per incident.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/incidents/new"
            className="px-4 py-2 text-sm font-semibold rounded bg-action-primary text-white hover:bg-action-hover transition-colors shadow-sm"
          >
            + Register Incident
          </Link>
          <Link
            href="/demo"
            className="px-4 py-2 text-sm font-semibold rounded bg-canvas-paper border border-edge text-ink-primary hover:bg-canvas-subtle transition-colors"
          >
            Public Replay &rarr;
          </Link>
        </div>
      </div>

      {/* Prominent At-Risk Load Card */}
      {atRiskLoad && (
        <div className="bg-canvas-paper border-2 border-state-attention-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-edge pb-4">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 text-xs font-bold uppercase rounded bg-state-attention-bg text-state-attention-text border border-state-attention-border">
                At-Risk Arrival
              </span>
              <h2 className="text-xl font-bold text-ink-primary tabular-nums">
                Load {atRiskLoad.load_ref}
              </h2>
              <span className="text-sm text-ink-secondary">
                {atRiskLoad.carrier}
              </span>
            </div>

            <div className="text-xs text-ink-muted">
              Lane: <strong className="text-ink-primary">{atRiskLoad.origin} &rarr; {atRiskLoad.destination}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div>
              <span className="text-xs uppercase text-ink-muted font-medium block">Original Dock Slot</span>
              <span className="text-2xl font-bold text-ink-secondary line-through decoration-state-failure-text tabular-nums">
                {formatLocalTime(atRiskLoad.original_appointment)}
              </span>
              <p className="text-xs text-ink-muted mt-0.5">{atRiskLoad.dock_name}</p>
            </div>

            <div>
              <span className="text-xs uppercase text-state-attention-text font-bold block">Updated Driver ETA</span>
              <span className="text-3xl font-extrabold text-ink-primary tabular-nums">
                {formatLocalTime(atRiskLoad.updated_eta)}
              </span>
              <p className="text-xs text-state-attention-text font-medium mt-0.5">Late 50 min · Dock adjustment required</p>
            </div>

            <div className="flex flex-col justify-center space-y-2">
              <span className="text-xs uppercase text-ink-muted font-medium">Status</span>
              <div>
                <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded bg-canvas-subtle text-ink-primary border border-edge uppercase">
                  {atRiskLoad.status.replace(/_/g, " ")}
                </span>
              </div>
              <Link
                href={`/incidents/${atRiskLoad.id}`}
                className="w-full text-center px-5 py-2.5 rounded bg-action-primary text-white font-semibold text-sm hover:bg-action-hover transition-colors shadow-sm"
              >
                Open Coordination Desk &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Supporting Quiet Loads */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-secondary">
          Monitored Fleet Shipments
        </h3>

        <div className="bg-canvas-paper border border-edge rounded-lg overflow-hidden divide-y divide-edge">
          {supportingLoads.map((load) => (
            <div
              key={load.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm hover:bg-canvas-subtle/40 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="font-bold tabular-nums text-ink-primary">{load.load_ref}</span>
                <span className="text-xs text-ink-secondary">{load.carrier}</span>
                <span className="text-xs text-ink-muted">
                  {load.origin} &rarr; {load.destination}
                </span>
              </div>

              <div className="flex items-center space-x-6 text-xs">
                <div>
                  <span className="text-ink-muted">Dock: </span>
                  <span className="font-medium text-ink-primary">{load.dock_name}</span>
                </div>

                <div className="tabular-nums font-semibold text-ink-secondary">
                  {formatLocalTime(load.original_appointment)}
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase ${
                    load.status === "driver_received"
                      ? "bg-state-confirmed-bg text-state-confirmed-text"
                      : "bg-canvas-subtle text-ink-secondary"
                  }`}
                >
                  {load.status === "driver_received" ? "Plan Completed" : "On Schedule"}
                </span>

                <Link
                  href={`/incidents/${load.id}`}
                  className="text-action-primary font-medium hover:underline text-xs"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
