"use client";

import React from "react";
import { formatLocalTime } from "@/domain/workflow/interval";
import { Incident, AuthorityVersion, Observation, Receipt, CausalProof, CausalProofChainLink } from "@/domain/types";

interface PlanRailProps {
  incident: Incident;
  authority?: AuthorityVersion | null;
  driverObservation?: Observation | null;
  dockObservation?: Observation | null;
  receipt?: Receipt | null;
  causalProof?: CausalProof | null;
}

export function PlanRail({
  incident,
  authority,
  driverObservation,
  dockObservation,
  receipt,
  causalProof,
}: PlanRailProps) {
  const [expandedStep, setExpandedStep] = React.useState<string | null>(null);

  const origApptFmt = formatLocalTime(incident.original_appointment, authority?.timezone);
  const etaFmt = formatLocalTime(incident.updated_eta, authority?.timezone);

  const authStartFmt = authority
    ? formatLocalTime(authority.earliest_time, authority.timezone)
    : null;
  const authEndFmt = authority
    ? formatLocalTime(authority.latest_time, authority.timezone)
    : null;

  const drvStartFmt = driverObservation?.verified_interval_start
    ? formatLocalTime(driverObservation.verified_interval_start, authority?.timezone)
    : null;
  const drvEndFmt = driverObservation?.verified_interval_end
    ? formatLocalTime(driverObservation.verified_interval_end, authority?.timezone)
    : null;

  const confirmedTimeFmt = receipt?.confirmed_time
    ? formatLocalTime(receipt.confirmed_time, authority?.timezone)
    : dockObservation?.confirmed_time
    ? formatLocalTime(dockObservation.confirmed_time, authority?.timezone)
    : null;

  const hasDriverResult = !!driverObservation?.verified_interval_start;
  const hasConfirmation = !!confirmedTimeFmt;

  // Derive "What changed" sentence
  let whatChangedText = "";
  if (hasConfirmation) {
    whatChangedText = `Dock confirmed revised appointment at ${confirmedTimeFmt} (${receipt?.dock_name || incident.dock_name}${receipt?.door ? `, ${receipt.door}` : ""}) with no additional fee. Plan dispatched to driver.`;
  } else if (hasDriverResult) {
    whatChangedText = `Driver can check in ${drvStartFmt}–${drvEndFmt} and authorized selection inside that range. Asking ${incident.dock_name} for one explicit time within ${drvStartFmt}–${drvEndFmt}.`;
  } else if (authority) {
    whatChangedText = `Dispatcher authorized arrival recovery between ${authStartFmt} and ${authEndFmt}. Calling driver to verify workable check-in window.`;
  } else {
    whatChangedText = `Initial arrival delay reported. Updated ETA is ${etaFmt} vs original ${origApptFmt} slot. Awaiting dispatcher authority limits.`;
  }

  // Compute or reuse 6-link proof chain
  let chain: CausalProofChainLink[] = [];
  if (causalProof?.chain) {
    chain = causalProof.chain;
  } else {
    const authValid = !!authority;
    const isDriverValid = !!driverObservation?.verified_interval_start && driverObservation?.selection_permitted === true;
    const isDriverRefused = driverObservation && (!driverObservation.verified_interval_start || driverObservation.selection_permitted === false);
    const hasOverlap = isDriverValid && !!authority;
    const isDockValid = !!dockObservation?.confirmed_time && (dockObservation.fee_amount ?? 0) <= (authority?.fee_ceiling ?? 150);
    const isDockBroken = dockObservation && (!dockObservation.confirmed_time || (dockObservation.fee_amount ?? 0) > (authority?.fee_ceiling ?? 150));
    const isReceiptValid = !!receipt;
    const isDriverReceived = incident.status === "driver_received";

    chain = [
      {
        step: "authority",
        title: "1. Frozen Authority",
        fact: authority
          ? `Allowed check-in ${authStartFmt}–${authEndFmt} · Fee ceiling $${authority.fee_ceiling} ${authority.currency}`
          : "Awaiting dispatcher arrival recovery authorization",
        source: authority ? `Dispatcher Authority v${authority.version}` : "Dispatcher Input",
        status: authValid ? "valid" : "pending",
      },
      {
        step: "driver",
        title: "2. Driver Window & Permission",
        fact: isDriverValid
          ? `Workable ${drvStartFmt}–${drvEndFmt} · Slot selection authorized`
          : isDriverRefused
          ? "Driver arrival window missing or slot selection refused"
          : "Awaiting driver spoken confirmation and permission",
        source: driverObservation ? `Driver Voice Task (${driverObservation.calle_call_id || "completed"})` : "Pending CALL-E Call 1",
        status: isDriverValid ? "valid" : isDriverRefused ? "broken" : "pending",
      },
      {
        step: "overlap",
        title: "3. Derived Overlap",
        fact: hasOverlap
          ? `Strict mathematical overlap: ${drvStartFmt}–${drvEndFmt}`
          : "Awaiting valid driver arrival limits",
        source: "DwellGuard Constraint Engine",
        status: hasOverlap ? "valid" : "pending",
      },
      {
        step: "dock",
        title: "4. Dock Commitment",
        fact: isDockValid
          ? `Confirmed slot ${confirmedTimeFmt}${dockObservation?.door ? ` (${dockObservation.door})` : ""} · Fee: $${dockObservation?.fee_amount ?? 0}`
          : isDockBroken
          ? "Dock quoted slot outside overlap or fee exceeded ceiling"
          : "Awaiting receiving dock explicit slot commitment",
        source: dockObservation ? `Dock Voice Task (${dockObservation.calle_call_id || "completed"})` : "Pending CALL-E Call 2",
        status: isDockValid ? "valid" : isDockBroken ? "broken" : "pending",
      },
      {
        step: "receipt",
        title: "5. Versioned Receipt Pass",
        fact: isReceiptValid
          ? `Official Appointment Pass v${receipt.version} generated`
          : "Pending validated dock agreement",
        source: receipt ? `Receipt #${receipt.id.slice(-8)}` : "DwellGuard Pass Generator",
        status: isReceiptValid ? "valid" : "pending",
      },
      {
        step: "driver_received",
        title: "6. Driver Acknowledgment",
        fact: isDriverReceived
          ? "Driver acknowledged plan receipt via mobile handoff"
          : "Awaiting driver mobile tap on handoff view",
        source: isDriverReceived ? "Driver Browser Tap" : "Pending Handoff Link",
        status: isDriverReceived ? "valid" : "pending",
      },
    ];
  }

  return (
    <div className="bg-canvas-paper border border-edge rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-edge pb-3">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-ink-primary text-sm uppercase tracking-wide">
            Plan Rail
          </span>
          <span className="text-sm px-2 py-0.5 rounded-full bg-canvas-subtle text-ink-secondary border border-edge">
            Shared Time Axis · {authority?.timezone || "America/New_York"}
          </span>
        </div>

        <div className="text-sm text-ink-muted tabular-nums">
          Load <strong className="text-ink-primary">{incident.load_ref}</strong>
        </div>
      </div>

      {/* Visual Axis Rail */}
      <div className="relative pt-6 pb-8 px-4 bg-canvas-main rounded-md border border-edge/60">
        {/* Baseline Axis Line */}
        <div className="absolute top-1/2 left-6 right-6 h-1 bg-edge rounded-full transform -translate-y-1/2" />

        <div className="relative flex justify-between items-center text-sm">
          {/* 1. Original Appointment */}
          <div className="flex flex-col items-center text-center">
            <div className="w-3.5 h-3.5 rounded-full bg-ink-muted border-2 border-canvas-paper z-10" />
            <span className="mt-2 text-[13px] text-ink-muted uppercase font-medium">Original</span>
            <span className="font-semibold text-ink-secondary tabular-nums line-through decoration-state-failure-text">
              {origApptFmt}
            </span>
          </div>

          {/* 2. Updated ETA */}
          <div className="flex flex-col items-center text-center">
            <div className="w-3.5 h-3.5 rounded-full bg-state-attention-text border-2 border-canvas-paper z-10" />
            <span className="mt-2 text-[13px] text-state-attention-text uppercase font-semibold">New ETA</span>
            <span className="font-semibold text-ink-primary tabular-nums">
              {etaFmt}
            </span>
          </div>

          {/* 3. Authority Window */}
          {authority && (
            <div className="flex flex-col items-center text-center">
              <div className="w-3 h-3 rounded-full bg-action-primary border-2 border-canvas-paper z-10" />
              <span className="mt-2 text-[13px] text-ink-secondary uppercase font-medium">Authorized</span>
              <span className="font-medium text-ink-secondary tabular-nums">
                {authStartFmt} – {authEndFmt}
              </span>
            </div>
          )}

          {/* 4. Driver Workable Window */}
          <div
            className={`flex flex-col items-center text-center transition-opacity duration-state ${
              hasDriverResult ? "opacity-100" : "opacity-40"
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 border-canvas-paper z-10 ${
                hasDriverResult ? "bg-action-primary ring-2 ring-[#3E657D]/30" : "bg-edge"
              }`}
            />
            <span className="mt-2 text-[13px] text-ink-secondary uppercase font-medium">Driver Range</span>
            <span className="font-semibold text-ink-primary tabular-nums">
              {hasDriverResult ? `${drvStartFmt} – ${drvEndFmt}` : "Waiting for driver"}
            </span>
          </div>

          {/* 5. Confirmed Appointment */}
          <div
            className={`flex flex-col items-center text-center transition-opacity duration-state ${
              hasConfirmation ? "opacity-100 scale-105" : "opacity-35"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full border-2 border-canvas-paper z-10 ${
                hasConfirmation ? "bg-state-confirmed-text ring-4 ring-state-confirmed-bg" : "bg-edge"
              }`}
            />
            <span className="mt-2 text-[13px] text-state-confirmed-text uppercase font-bold">Confirmed</span>
            <span className="font-bold text-state-confirmed-text tabular-nums text-sm">
              {hasConfirmation ? confirmedTimeFmt : "Pending dock"}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic "What changed" sentence */}
      <div className="bg-canvas-subtle/50 rounded-md p-3 border border-edge/80 flex items-start space-x-2.5">
        <div className="w-2 h-2 rounded-full bg-action-primary mt-1.5 flex-shrink-0" />
        <div>
          <span className="text-sm font-semibold uppercase tracking-wider text-ink-secondary block">
            What Changed
          </span>
          <p className="text-sm text-ink-primary font-medium mt-0.5 leading-snug">
            {whatChangedText}
          </p>
        </div>
      </div>

      {/* Dock Request Preview if Driver Result is in and dock is pending */}
      {hasDriverResult && !hasConfirmation && incident.status !== "dispatcher_needed" && (
        <div className="bg-blue-50/50 border border-blue-200/80 rounded-md p-3 text-sm text-ink-primary">
          <span className="font-semibold text-action-primary uppercase tracking-wide block mb-1">
            Dock Call Dispatch Preview
          </span>
          <p className="text-ink-secondary font-mono text-[13px]">
            &quot;Driver can check in {drvStartFmt}–{drvEndFmt} and authorized selection inside that range. Asking {incident.dock_name} for one explicit time within {drvStartFmt}–{drvEndFmt}.&quot;
          </p>
        </div>
      )}

      {/* Causal Appointment Proof: Why this plan is valid */}
      <div className="border-t border-edge/80 pt-4 mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold uppercase tracking-wider text-ink-primary">
              Why this plan is valid
            </span>
            <span className="text-sm px-2 py-0.5 rounded bg-canvas-subtle text-ink-muted border border-edge uppercase tracking-wider font-semibold">
              Causal Audit Chain
            </span>
          </div>
          {causalProof && (
            <div className="flex items-center space-x-2 text-sm">
              <span className="font-mono text-[13px] px-2 py-0.5 rounded bg-blue-50 text-[#1B365D] border border-blue-200 font-bold">
                {causalProof.short_id}
              </span>
              <span className="text-[13px] text-ink-muted font-mono hidden md:inline" title={causalProof.proof_hash}>
                SHA-256: {causalProof.proof_hash.slice(0, 10)}…
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          {chain.map((link) => {
            const isExpanded = expandedStep === link.step;
            return (
              <div
                key={link.step}
                onClick={() => setExpandedStep(isExpanded ? null : link.step)}
                className={`p-2.5 rounded-md border transition-all cursor-pointer ${
                  link.status === "valid"
                    ? "bg-emerald-50/40 border-emerald-200/80 hover:bg-emerald-50/70"
                    : link.status === "broken"
                    ? "bg-amber-50/50 border-amber-200 hover:bg-amber-50/80"
                    : "bg-canvas-subtle/40 border-edge/60 hover:bg-canvas-subtle/80 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink-primary text-[13px]">
                    {link.title}
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-sm font-bold ${
                      link.status === "valid"
                        ? "bg-emerald-600 text-white"
                        : link.status === "broken"
                        ? "bg-amber-600 text-white"
                        : "bg-edge text-ink-muted"
                    }`}
                  >
                    {link.status === "valid" ? "✓" : link.status === "broken" ? "!" : "○"}
                  </span>
                </div>
                <p className="text-[13px] text-ink-secondary mt-1 font-medium leading-snug">
                  {link.fact}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-sm text-ink-muted">
                  <span className="truncate">{link.source}</span>
                  <span className="text-action-primary hover:underline ml-1">
                    {isExpanded ? "Hide" : "Inspect"}
                  </span>
                </div>
                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-edge/60 text-sm space-y-1 bg-white/60 p-2 rounded">
                    <div>
                      <strong className="text-ink-muted">Status:</strong>{" "}
                      <span className="capitalize font-medium">{link.status}</span>
                    </div>
                    <div>
                      <strong className="text-ink-muted">Step Key:</strong>{" "}
                      <code className="font-mono text-[9px]">{link.step}</code>
                    </div>
                    <div>
                      <strong className="text-ink-muted">Attribution:</strong> {link.source}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
