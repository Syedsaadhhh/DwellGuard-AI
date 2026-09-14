"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PlanRail } from "@/components/plan-rail";
import { AppointmentPass } from "@/components/appointment-pass";
import { Incident, AuthorityVersion, Observation, Receipt, HandoffToken, AuditEvent, CausalProof } from "@/domain/types";
import { formatLocalTime } from "@/domain/workflow/interval";

export default function IncidentWorkspacePage() {
  const params = useParams();
  const id = params?.id as string;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [authority, setAuthority] = useState<AuthorityVersion | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [handoffToken, setHandoffToken] = useState<HandoffToken | null>(null);
  const [causalProof, setCausalProof] = useState<CausalProof | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  // Form states for authority authorization
  const [earliestTime, setEarliestTime] = useState("2026-09-14T11:00");
  const [latestTime, setLatestTime] = useState("2026-09-14T13:00");
  const [timezone, setTimezone] = useState("America/New_York");
  const [feeCeiling, setFeeCeiling] = useState(150);
  const [allowSelection, setAllowSelection] = useState(true);

  const fetchIncidentData = useCallback(async () => {
    try {
      const res = await fetch(`/api/incidents/${id}`);
      if (!res.ok) throw new Error("Incident not found");
      const data = await res.json();
      setIncident(data.incident);
      setAuthority(data.authority);
      setObservations(data.observations || []);
      setReceipt(data.receipt);
      setHandoffToken(data.handoffToken);
      setCausalProof(data.causalProof || null);
      setAuditEvents(data.auditEvents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIncidentData();
  }, [fetchIncidentData]);

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const offset = timezone === "America/New_York" ? "-04:00" : "Z";
      const payload = {
        earliest_time: `${earliestTime}:00${offset}`,
        latest_time: `${latestTime}:00${offset}`,
        timezone,
        fee_ceiling: Number(feeCeiling),
        currency: "USD",
        budget: 2,
        allow_selection_inside_interval: allowSelection,
        expires_at: `${latestTime}:00${offset}`,
      };

      const res = await fetch(`/api/incidents/${id}/authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to authorize");
      } else {
        await fetchIncidentData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to authorize");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdvance = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/incidents/${id}/advance`, { method: "POST" });
      if (!res.ok) throw new Error("Advance failed");
      await fetchIncidentData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    if (!confirm("Stop automated coordination for this load?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/incidents/${id}/stop`, { method: "POST" });
      if (!res.ok) throw new Error("Stop failed");
      await fetchIncidentData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-ink-secondary">
        Loading workspace context...
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="py-12 text-center text-sm text-state-failure-text">
        Incident not found. <Link href="/" className="underline ml-2">Back to Shipments</Link>
      </div>
    );
  }

  const driverObs = observations.find((o) => o.speaker_role === "driver");
  const dockObs = observations.find((o) => o.speaker_role === "dock");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-edge pb-4 gap-3">
        <div className="flex items-center space-x-3">
          <Link href="/" className="text-sm text-ink-muted hover:text-ink-primary">
            &larr; Shipments Desk
          </Link>
          <span className="text-edge">/</span>
          <h1 className="text-xl font-bold text-ink-primary tabular-nums">
            {incident.load_ref} · {incident.carrier}
          </h1>
          <span
            className={`text-sm px-2.5 py-0.5 rounded font-bold uppercase tracking-wider ${
              incident.status === "driver_received" || incident.status === "plan_confirmed"
                ? "bg-state-confirmed-bg text-state-confirmed-text border border-state-confirmed-border"
                : incident.status === "dispatcher_needed" || incident.status === "stopped"
                ? "bg-state-failure-bg text-state-failure-text border border-state-failure-border"
                : "bg-state-attention-bg text-state-attention-text border border-state-attention-border"
            }`}
          >
            {incident.status.replace(/_/g, " ")}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-sm">
          <span className="text-ink-muted tabular-nums">
            Budget: <strong>{incident.task_budget_remaining} / 2 calls left</strong>
          </span>
          {incident.status !== "stopped" && incident.status !== "driver_received" && (
            <button
              onClick={handleStop}
              disabled={actionLoading}
              className="px-3 py-1 rounded text-state-failure-text border border-state-failure-border bg-white hover:bg-state-failure-bg font-semibold transition-colors"
            >
              Stop Intent
            </button>
          )}
        </div>
      </div>

      {/* Ten-Second Cold Viewer Context Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-canvas-paper border border-edge rounded-lg p-4 text-sm">
        <div>
          <span className="text-ink-muted uppercase font-medium block">What went wrong?</span>
          <p className="font-semibold text-ink-primary mt-0.5">
            50-min ETA delay reported ({formatLocalTime(incident.original_appointment)} &rarr; {formatLocalTime(incident.updated_eta)})
          </p>
        </div>

        <div>
          <span className="text-ink-muted uppercase font-medium block">What changed?</span>
          <p className="font-semibold text-ink-primary mt-0.5">
            {driverObs
              ? `Driver arrival workable window: ${formatLocalTime(driverObs.verified_interval_start!)}–${formatLocalTime(driverObs.verified_interval_end!)}`
              : "Awaiting driver verbal verification"}
          </p>
        </div>

        <div>
          <span className="text-ink-muted uppercase font-medium block">What is happening now?</span>
          <p className="font-semibold text-action-primary mt-0.5">
            {receipt
              ? "Appointment confirmed · Dispatched to driver"
              : incident.status === "dock_task_pending"
              ? "Coordinating explicit slot with receiving dock"
              : incident.status === "driver_task_pending"
              ? "CALL-E checking in with driver"
              : "Ready for dispatcher authorization"}
          </p>
        </div>

        <div>
          <span className="text-ink-muted uppercase font-medium block">Needs human dispatcher?</span>
          <p
            className={`font-bold mt-0.5 ${
              incident.status === "dispatcher_needed"
                ? "text-state-failure-text"
                : "text-state-confirmed-text"
            }`}
          >
            {incident.status === "dispatcher_needed"
              ? `YES: ${incident.resolution_reason || "Escalation required"}`
              : "No · Operating within safe limits"}
          </p>
        </div>
      </div>

      {/* Signature Visual Wow: Plan Rail */}
      <PlanRail
        incident={incident}
        authority={authority}
        driverObservation={driverObs}
        dockObservation={dockObs}
        receipt={receipt}
        causalProof={causalProof}
      />

      {/* Main Action & Result Surface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Dispatcher Authority & Actions */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-canvas-paper border border-edge rounded-lg p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-primary border-b border-edge pb-2">
              Dispatcher Authority
            </h2>

            {authority ? (
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-canvas-subtle/50 rounded border border-edge">
                  <span className="text-ink-muted uppercase font-medium block">Frozen Authority v{authority.version}</span>
                  <p className="font-semibold text-ink-primary mt-0.5">
                    {formatLocalTime(authority.earliest_time, authority.timezone)} – {formatLocalTime(authority.latest_time, authority.timezone)}
                  </p>
                  <p className="text-ink-secondary mt-1">
                    Max gate fee: ${authority.fee_ceiling} {authority.currency}
                  </p>
                  <p className="text-ink-secondary">
                    Driver slot delegation: {authority.allow_selection_inside_interval ? "Allowed" : "Not Allowed"}
                  </p>
                </div>

                {incident.status !== "plan_confirmed" &&
                  incident.status !== "driver_received" &&
                  incident.status !== "dispatcher_needed" && (
                    <button
                      onClick={handleAdvance}
                      disabled={actionLoading}
                      className="w-full py-2.5 px-4 rounded bg-action-primary text-white font-semibold text-sm hover:bg-action-hover transition-colors shadow-sm disabled:opacity-50"
                    >
                      {actionLoading ? "Calling / Progressing..." : "Advance Next Step &rarr;"}
                    </button>
                  )}
              </div>
            ) : (
              <form onSubmit={handleAuthorize} className="space-y-3 text-sm">
                <p className="text-ink-secondary text-[13px]">
                  Set safe boundaries once. DwellGuard will call the driver and dock inside these exact constraints.
                </p>

                <div>
                  <label className="block text-ink-secondary font-medium mb-1">Earliest Acceptable Arrival</label>
                  <input
                    type="datetime-local"
                    value={earliestTime}
                    onChange={(e) => setEarliestTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-edge bg-white text-ink-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-ink-secondary font-medium mb-1">Latest Acceptable Arrival</label>
                  <input
                    type="datetime-local"
                    value={latestTime}
                    onChange={(e) => setLatestTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-edge bg-white text-ink-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-ink-secondary font-medium mb-1">Fee Ceiling (USD)</label>
                  <input
                    type="number"
                    value={feeCeiling}
                    onChange={(e) => setFeeCeiling(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded border border-edge bg-white text-ink-primary"
                    min="0"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="allowSelection"
                    checked={allowSelection}
                    onChange={(e) => setAllowSelection(e.target.checked)}
                    className="rounded border-edge text-action-primary"
                  />
                  <label htmlFor="allowSelection" className="text-ink-primary font-medium text-[13px]">
                    Allow choosing dock slot inside driver&apos;s verified window
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 px-4 rounded bg-action-primary text-white font-semibold text-sm hover:bg-action-hover transition-colors shadow-sm disabled:opacity-50 mt-2"
                >
                  {actionLoading ? "Authorizing..." : "Freeze Authority & Launch CALL-E &rarr;"}
                </button>
              </form>
            )}
          </div>

          {/* Contact Details Card */}
          <div className="bg-canvas-paper border border-edge rounded-lg p-4 text-sm space-y-2.5">
            <h3 className="font-bold text-ink-primary uppercase tracking-wide border-b border-edge pb-1.5">
              Verified Contacts
            </h3>
            <div>
              <span className="text-ink-muted block font-medium">Driver</span>
              <span className="text-ink-primary font-semibold">{incident.driver_contact_name}</span>
              <span className="text-ink-secondary ml-2 font-mono">{incident.driver_phone}</span>
            </div>
            <div>
              <span className="text-ink-muted block font-medium">Receiving Facility</span>
              <span className="text-ink-primary font-semibold">{incident.dock_name} ({incident.dock_contact_name})</span>
              <span className="text-ink-secondary ml-2 font-mono">{incident.dock_phone}</span>
            </div>
          </div>
        </div>

        {/* Right: Appointment Pass (when confirmed) or Live Progress */}
        <div className="lg:col-span-2">
          {receipt ? (
            <AppointmentPass
              receipt={receipt}
              incident={incident}
              handoffToken={handoffToken}
            />
          ) : (
            <div className="bg-canvas-paper border border-edge rounded-lg p-6 flex flex-col items-center justify-center text-center h-full min-h-[280px] space-y-3">
              <div className="w-12 h-12 rounded-full bg-canvas-subtle border border-edge flex items-center justify-center text-action-primary font-bold text-lg">
                &rarr;
              </div>
              <div>
                <h3 className="text-base font-bold text-ink-primary">
                  {incident.status === "draft"
                    ? "Awaiting Dispatcher Authority"
                    : incident.status === "dispatcher_needed"
                    ? "Manual Dispatcher Intervention Needed"
                    : "Coordination In Progress"}
                </h3>
                <p className="text-sm text-ink-secondary max-w-md mt-1">
                  {incident.status === "draft"
                    ? "Define acceptable time and fee boundaries on the left to initiate automated driver and dock voice calls."
                    : incident.status === "dispatcher_needed"
                    ? incident.resolution_reason
                    : "DwellGuard is actively executing the sequential authority chain."}
                </p>
              </div>

              {incident.status === "draft" && (
                <div className="text-sm text-ink-muted pt-2 font-mono">
                  Origin: {incident.origin} &middot; Destination: {incident.destination}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expandable Evidence Disclosure */}
      <div className="bg-canvas-paper border border-edge rounded-lg p-4 text-sm">
        <button
          onClick={() => setShowEvidence(!showEvidence)}
          className="flex items-center justify-between w-full font-semibold text-ink-primary hover:text-action-primary"
        >
          <span>Inspection &amp; Evidence Log ({observations.length} observations, {auditEvents.length} audit records)</span>
          <span>{showEvidence ? "▲ Hide" : "▼ Show"}</span>
        </button>

        {showEvidence && (
          <div className="mt-4 space-y-4 border-t border-edge pt-3">
            {observations.length > 0 && (
              <div>
                <h4 className="font-bold text-ink-primary uppercase mb-2">Verified Recipient Evidence</h4>
                <div className="space-y-2">
                  {observations.map((obs) => (
                    <div key={obs.id} className="p-3 bg-canvas-subtle/50 rounded border border-edge">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="capitalize">{obs.speaker_role} Call Evidence</span>
                        <span className="font-mono text-ink-muted">{obs.calle_call_id}</span>
                      </div>
                      <ul className="list-disc list-inside mt-1.5 text-ink-secondary space-y-0.5">
                        {obs.evidence_text.map((e, idx) => (
                          <li key={idx}>{e}</li>
                        ))}
                      </ul>
                      {obs.raw_transcript_snippet && (
                        <p className="mt-2 text-[13px] text-ink-muted italic border-l-2 border-action-primary pl-2">
                          &quot;{obs.raw_transcript_snippet}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-bold text-ink-primary uppercase mb-2">State Audit Events</h4>
              <div className="space-y-1 font-mono text-[13px] text-ink-secondary">
                {auditEvents.map((ev) => (
                  <div key={ev.id} className="py-1 border-b border-edge/40 flex items-center justify-between">
                    <span>[{ev.created_at.slice(11, 19)}] {ev.event_type}</span>
                    <span className="text-ink-muted">{JSON.stringify(ev.details)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
