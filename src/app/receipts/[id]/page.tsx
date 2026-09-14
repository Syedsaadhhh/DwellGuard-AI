import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { getStore } from "@/server/context";
import { formatLocalTime } from "@/domain/workflow/interval";
import {
  OPERATOR_COOKIE_NAME,
  verifySessionToken,
} from "@/server/auth/session";

export const revalidate = 0;

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  let authenticated = false;
  try {
    authenticated = verifySessionToken(cookies().get(OPERATOR_COOKIE_NAME)?.value);
  } catch {
    authenticated = false;
  }
  if (!authenticated) redirect("/demo");

  const store = getStore();
  const receipt = await store.getReceipt(params.id);

  if (!receipt) {
    notFound();
  }

  const incident = await store.getIncident(receipt.incident_id);
  const observations = await store.getObservations(receipt.incident_id);

  const confirmedTimeFmt = formatLocalTime(receipt.confirmed_time, receipt.timezone);
  const dateFmt = new Date(receipt.confirmed_time).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: receipt.timezone,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between text-xs border-b border-edge pb-3 print:hidden">
        <Link href={`/incidents/${receipt.incident_id}`} className="hover:text-ink-primary text-ink-muted">
          &larr; Back to Workspace
        </Link>
        <span className="font-mono text-ink-muted">Receipt ID: {receipt.id}</span>
      </div>

      {/* Printable Receipt Card */}
      <div className="bg-canvas-paper border border-edge rounded-lg p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        <div className="flex items-center justify-between border-b-2 border-edge pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink-primary">
              Official Appointment Pass
            </h1>
            <p className="text-xs text-ink-secondary mt-0.5">
              Verified by DwellGuard Sequential Dock Coordination
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs uppercase font-bold text-state-confirmed-text bg-state-confirmed-bg px-2.5 py-1 rounded border border-state-confirmed-border inline-block">
              Confirmed Plan
            </span>
            <span className="block text-[11px] text-ink-muted mt-1 tabular-nums font-mono">
              Version {receipt.version}
            </span>
          </div>
        </div>

        {/* Hero Time & Facility */}
        <div className="bg-canvas-subtle/40 rounded-lg p-6 border border-edge/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs uppercase font-bold text-ink-muted block">Confirmed Slot</span>
            <span className="text-4xl font-extrabold text-ink-primary tabular-nums">
              {confirmedTimeFmt}
            </span>
            <span className="ml-2 text-sm font-semibold text-ink-secondary">
              {receipt.timezone}
            </span>
            <p className="text-xs text-ink-secondary mt-1 font-medium">{dateFmt}</p>
          </div>

          <div className="sm:text-right">
            <span className="text-xs uppercase font-bold text-ink-muted block">Receiving Facility</span>
            <span className="text-lg font-bold text-ink-primary">{receipt.dock_name}</span>
            {receipt.door && (
              <span className="block text-sm font-bold text-action-primary mt-0.5">
                {receipt.door}
              </span>
            )}
          </div>
        </div>

        {/* Shipment Specifications Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs border-y border-edge py-4">
          <div>
            <span className="text-ink-muted uppercase font-medium">Load Reference</span>
            <p className="text-sm font-bold text-ink-primary tabular-nums">{receipt.load_ref}</p>
          </div>

          <div>
            <span className="text-ink-muted uppercase font-medium">Carrier</span>
            <p className="text-sm font-semibold text-ink-primary">{incident?.carrier || "Apex Freight Express"}</p>
          </div>

          <div>
            <span className="text-ink-muted uppercase font-medium">Route Lane</span>
            <p className="text-ink-secondary font-medium">{incident?.origin} &rarr; {incident?.destination}</p>
          </div>

          <div>
            <span className="text-ink-muted uppercase font-medium">Accessorial / Gate Fee</span>
            <p className="text-sm font-bold text-state-confirmed-text">
              {receipt.fee_amount === 0 ? "No Additional Fee ($0.00 USD)" : `$${receipt.fee_amount} ${receipt.fee_currency}`}
            </p>
          </div>
        </div>

        {/* Evidence Basis Statement */}
        <div className="space-y-2 text-xs">
          <span className="text-ink-muted uppercase font-semibold block">Attributed Confirmation Basis</span>
          <p className="p-3 bg-canvas-main rounded border border-edge text-ink-secondary leading-relaxed font-medium">
            {receipt.confirmation_basis}
          </p>
        </div>

        {/* Observations Summary */}
        {observations.length > 0 && (
          <div className="space-y-2 text-xs">
            <span className="text-ink-muted uppercase font-semibold block">Attributed Evidence Calls</span>
            <div className="space-y-1.5 font-mono text-[11px] text-ink-secondary">
              {observations.map((o) => (
                <div key={o.id} className="p-2.5 rounded bg-canvas-subtle/30 border border-edge/60">
                  <span className="font-semibold uppercase text-ink-primary">[{o.speaker_role}]</span> {o.evidence_text.join(" · ")}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Print / JSON Action Toolbar */}
        <div className="flex items-center justify-between pt-4 border-t border-edge print:hidden">
          <a
            href={`data:text/json;charset=utf-8,${encodeURIComponent(
              JSON.stringify(receipt, null, 2)
            )}`}
            download={`receipt-${receipt.id}.json`}
            className="text-xs px-3 py-1.5 rounded border border-edge bg-white hover:bg-canvas-subtle text-ink-primary font-semibold transition-colors"
          >
            Download JSON
          </a>

          <p className="text-xs text-ink-muted">
            Press Ctrl+P / Cmd+P to print this appointment pass.
          </p>
        </div>
      </div>
    </div>
  );
}
