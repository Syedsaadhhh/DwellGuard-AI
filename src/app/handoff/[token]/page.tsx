"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Receipt } from "@/domain/types";
import { formatLocalTime } from "@/domain/workflow/interval";

export default function DriverHandoffPage() {
  const params = useParams();
  const token = params?.token as string;

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [causalProof, setCausalProof] = useState<any>(null);
  const [loadRef, setLoadRef] = useState<string>("");
  const [carrier, setCarrier] = useState<string>("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [acknowledgedAt, setAcknowledgedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHandoff() {
      try {
        const res = await fetch(`/api/handoff/${token}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Invalid or expired link");
          return;
        }

        const data = await res.json();
        setReceipt(data.receipt);
        setCausalProof(data.causalProof || null);
        setLoadRef(data.incident?.load_ref || data.receipt?.load_ref || "");
        setCarrier(data.incident?.carrier || "");
        if (data.tokenRecord?.acknowledged_at) {
          setAcknowledged(true);
          setAcknowledgedAt(data.tokenRecord.acknowledged_at);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load handoff details");
      } finally {
        setLoading(false);
      }
    }

    loadHandoff();
  }, [token]);

  const handleAcknowledge = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/handoff/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to submit acknowledgment");
      } else {
        const data = await res.json();
        setAcknowledged(true);
        setAcknowledgedAt(data.acknowledged_at || new Date().toISOString());
        if (data.causalProof) {
          setCausalProof(data.causalProof);
        }
      }
    } catch (err: any) {
      alert(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <p className="text-sm font-medium text-ink-secondary">Retrieving driver handoff pass...</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-canvas-paper border border-state-failure-border rounded-lg p-6 max-w-sm text-center space-y-2">
          <span className="text-state-failure-text font-bold text-sm block uppercase">Notice</span>
          <p className="text-xs text-ink-secondary">{error || "Handoff link has expired or is invalid."}</p>
        </div>
      </div>
    );
  }

  const confirmedTimeFmt = formatLocalTime(receipt.confirmed_time, receipt.timezone);
  const dateFmt = new Date(receipt.confirmed_time).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: receipt.timezone,
  });

  const proofId = receipt.causal_proof_short_id || causalProof?.short_id;

  return (
    <div className="max-w-md mx-auto py-4 px-2 space-y-5">
      {/* Mobile Header */}
      <div className="text-center space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-action-primary bg-action-primary/10 px-2.5 py-0.5 rounded-full inline-block">
          DwellGuard Driver Handoff
        </span>
        <h1 className="text-xl font-bold text-ink-primary">Revised Dock Appointment</h1>
        <p className="text-xs text-ink-secondary">
          Load <strong className="text-ink-primary">{loadRef}</strong> · {carrier}
        </p>
      </div>

      {/* Main Appointment Pass Surface */}
      <div className="bg-canvas-paper border border-edge rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-edge pb-3 text-xs">
          <span className="text-[11px] font-semibold text-ink-muted uppercase">
            Receipt v{receipt.version}
          </span>
          {proofId && (
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-[#1B365D] border border-blue-200 font-bold">
              {proofId}
            </span>
          )}
        </div>

        <div className="text-center pb-4 border-b border-edge">
          <span className="text-xs uppercase font-bold text-ink-muted tracking-wider block">
            Your Confirmed Check-In Slot
          </span>
          <div className="mt-2 flex items-baseline justify-center">
            <span className="text-5xl font-extrabold text-ink-primary tabular-nums tracking-tight">
              {confirmedTimeFmt}
            </span>
          </div>
          <p className="text-xs font-semibold text-ink-secondary mt-1">
            {dateFmt} &middot; {receipt.timezone}
          </p>
        </div>

        {/* Facility & Door Location */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-start border-b border-edge/60 pb-3">
            <div>
              <span className="text-xs uppercase font-medium text-ink-muted block">Receiving Facility</span>
              <span className="font-bold text-ink-primary">{receipt.dock_name}</span>
            </div>
            {receipt.door && (
              <div className="text-right">
                <span className="text-xs uppercase font-medium text-ink-muted block">Designated Door</span>
                <span className="font-bold text-action-primary">{receipt.door}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-ink-muted font-medium">Gate Fee</span>
            <span className="font-semibold text-state-confirmed-text">
              {receipt.fee_amount === 0 ? "No Additional Fee ($0.00)" : `$${receipt.fee_amount} ${receipt.fee_currency}`}
            </span>
          </div>
        </div>

        {/* Causal Chain Confirmation Banner */}
        <div className="p-3 bg-canvas-subtle/60 rounded-xl border border-edge text-[11px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-ink-primary uppercase tracking-wider text-[10px]">
              Causal Appointment Proof
            </span>
            <span className="text-emerald-700 font-semibold flex items-center space-x-1">
              <span>&#10003;</span>
              <span>Deterministic Pass</span>
            </span>
          </div>
          <p className="text-ink-secondary text-[11px]">
            Agreed under Dispatcher Authority v{receipt.version} and driver arrival constraints. Verified with {receipt.dock_name}.
          </p>
        </div>

        {/* Big Touch-Friendly Action Button */}
        <div className="pt-2">
          {acknowledged ? (
            <div className="p-4 rounded-xl bg-state-confirmed-bg border border-state-confirmed-border text-center space-y-1">
              <div className="flex items-center justify-center space-x-2 text-state-confirmed-text font-bold text-sm">
                <span>&#10003;</span>
                <span>Plan Received &amp; Acknowledged</span>
              </div>
              <p className="text-[11px] text-ink-secondary">
                Recorded at {formatLocalTime(acknowledgedAt || new Date().toISOString(), receipt.timezone)}. Safe travels to the dock!
              </p>
            </div>
          ) : (
            <button
              onClick={handleAcknowledge}
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-action-primary hover:bg-action-hover active:scale-[0.99] text-white font-bold text-base shadow-md transition-all duration-control"
            >
              {submitting ? "Confirming..." : "I've received this plan"}
            </button>
          )}
        </div>

        <p className="text-[11px] text-ink-muted text-center leading-tight">
          Receipt #{receipt.id.slice(-8)} &middot; v{receipt.version} &middot; Scoped handoff link
        </p>
      </div>
    </div>
  );
}
