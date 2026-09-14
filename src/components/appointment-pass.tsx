"use client";

import React from "react";
import Link from "next/link";
import { Receipt, Incident, HandoffToken } from "@/domain/types";
import { formatLocalTime } from "@/domain/workflow/interval";

interface AppointmentPassProps {
  receipt: Receipt;
  incident: Incident;
  handoffToken?: HandoffToken | null;
}

export function AppointmentPass({ receipt, incident, handoffToken }: AppointmentPassProps) {
  const confirmedTimeFmt = formatLocalTime(receipt.confirmed_time, receipt.timezone);
  const dateFmt = new Date(receipt.confirmed_time).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: receipt.timezone,
  });

  const isAcknowledged = incident.status === "driver_received" || !!handoffToken?.acknowledged_at;
  const tokenDisplay = handoffToken?.raw_token_display || handoffToken?.token_hash;

  return (
    <div className="bg-canvas-paper border border-edge rounded-lg p-6 shadow-sm relative overflow-hidden space-y-5">
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between border-b border-edge pb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs uppercase font-bold tracking-wider text-ink-secondary">
            Confirmed Appointment Pass
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-state-confirmed-bg text-state-confirmed-text font-semibold border border-state-confirmed-border">
            Verified Agreement
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {receipt.causal_proof_short_id && (
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-[#1B365D] border border-blue-200 font-bold">
              {receipt.causal_proof_short_id}
            </span>
          )}
          <span className="text-xs text-ink-muted tabular-nums">
            Receipt #{receipt.id.slice(-8)} · v{receipt.version}
          </span>
        </div>
      </div>

      {/* Main Appointment Time Hero */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pt-1">
        <div>
          <span className="text-4xl font-extrabold text-ink-primary tabular-nums tracking-tight">
            {confirmedTimeFmt}
          </span>
          <span className="ml-2 text-sm font-semibold text-ink-secondary">
            {receipt.timezone}
          </span>
          <p className="text-xs text-ink-muted mt-1">{dateFmt}</p>
        </div>

        <div className="mt-3 sm:mt-0 text-left sm:text-right">
          <span className="text-xs uppercase text-ink-muted font-medium block">Designated Dock</span>
          <span className="text-base font-bold text-ink-primary">{receipt.dock_name}</span>
          {receipt.door && (
            <span className="block text-xs font-semibold text-action-primary">
              {receipt.door}
            </span>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-edge/80">
        <div>
          <span className="text-ink-muted uppercase font-medium">Load Reference</span>
          <p className="font-semibold text-ink-primary tabular-nums">{receipt.load_ref}</p>
        </div>

        <div>
          <span className="text-ink-muted uppercase font-medium">Accessorial / Gate Fee</span>
          <p className="font-semibold text-state-confirmed-text">
            {receipt.fee_amount === 0 ? "No additional fee ($0.00)" : `$${receipt.fee_amount} ${receipt.fee_currency}`}
          </p>
        </div>

        <div className="col-span-2">
          <span className="text-ink-muted uppercase font-medium">Confirmation Basis</span>
          <p className="text-ink-secondary mt-0.5">{receipt.confirmation_basis}</p>
        </div>
      </div>

      {/* Handoff Status & Two-Device Relay Banner */}
      <div
        className={`p-3.5 rounded-md border flex items-center justify-between transition-colors duration-state ${
          isAcknowledged
            ? "bg-state-confirmed-bg border-state-confirmed-border text-state-confirmed-text"
            : "bg-state-attention-bg border-state-attention-border text-state-attention-text"
        }`}
      >
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isAcknowledged ? "bg-state-confirmed-text" : "bg-state-attention-text animate-pulse"
            }`}
          />
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block">
              {isAcknowledged ? "Driver Received" : "Sending plan to driver"}
            </span>
            <span className="text-[11px] font-medium opacity-90">
              {isAcknowledged
                ? `Driver acknowledged plan receipt at ${formatLocalTime(
                    handoffToken?.acknowledged_at || new Date().toISOString()
                  )}`
                : "Driver's handoff view is live and awaiting driver tap."}
            </span>
          </div>
        </div>

        {tokenDisplay && (
          <Link
            href={`/handoff/${tokenDisplay}`}
            target="_blank"
            className="text-xs px-3 py-1.5 rounded font-semibold bg-white/90 text-ink-primary hover:bg-white shadow-sm border border-edge/50 flex-shrink-0 ml-3"
          >
            Open Driver View &rarr;
          </Link>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 text-xs text-ink-muted">
        <Link href={`/receipts/${receipt.id}`} className="hover:text-action-primary underline">
          Print Full Receipt
        </Link>
        <span className="tabular-nums">Two-call budget: Complete</span>
      </div>
    </div>
  );
}
