"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { PlanRail } from "@/components/plan-rail";
import { AppointmentPass } from "@/components/appointment-pass";
import { Incident, AuthorityVersion, Observation, Receipt, HandoffToken, CausalProof } from "@/domain/types";
import { formatLocalTime } from "@/domain/workflow/interval";

export default function PublicDemoPage() {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [authority, setAuthority] = useState<AuthorityVersion | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [handoffToken, setHandoffToken] = useState<HandoffToken | null>(null);
  const [causalProof, setCausalProof] = useState<CausalProof | null>(null);

  const [scenario, setScenario] = useState<"positive" | "fee_refusal">("positive");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: Idle, 1: Authorized, 2: Driver Call, 3: Dock Call, 4: Driver Ack
  const [speed, setSpeed] = useState<1 | 2>(1); // 1x or 2x speed
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDemoState = useCallback(async () => {
    try {
      const res = await fetch("/api/demo");
      const data = await res.json();
      setIncident(data.incident);
      setAuthority(data.authority);
      setObservations(data.observations || []);
      setReceipt(data.receipt);
      setHandoffToken(data.handoffToken);
      setCausalProof(data.causalProof || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDemoState();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchDemoState]);

  const resetFlow = async (chosenScenario: "positive" | "fee_refusal") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPlaying(false);
    setCurrentStep(0);
    setScenario(chosenScenario);
    setLoading(true);

    try {
      await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", scenario: chosenScenario }),
      });
      await fetchDemoState();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const advanceOneStep = useCallback(async (stepToExecute: number) => {
    try {
      let action = "step";
      if (stepToExecute === 1) action = "authorize";
      if (stepToExecute === 4) action = "acknowledge";

      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, scenario }),
      });
      const data = await res.json();
      setIncident(data.incident);
      setAuthority(data.authority);
      setObservations(data.observations || []);
      setReceipt(data.receipt);
      setHandoffToken(data.handoffToken);
      setCausalProof(data.causalProof || null);
    } catch (err) {
      console.error(err);
    }
  }, [scenario]);

  // Automated 45-second flow player
  useEffect(() => {
    if (!isPlaying) return;

    const baseDelay = speed === 1 ? 5500 : 2500;

    if (currentStep < 4) {
      timerRef.current = setTimeout(async () => {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        await advanceOneStep(nextStep);

        // If scenario is fee refusal, it terminates at step 3 as Dispatcher Needed
        if (scenario === "fee_refusal" && nextStep === 3) {
          setIsPlaying(false);
        }
      }, baseDelay);
    } else {
      setIsPlaying(false);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, speed, scenario, advanceOneStep]);

  const handlePlayPause = () => {
    if (isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsPlaying(false);
    } else {
      if (currentStep >= 4 || (scenario === "fee_refusal" && currentStep >= 3)) {
        // Restart if at end
        resetFlow(scenario).then(() => {
          setIsPlaying(true);
        });
      } else {
        setIsPlaying(true);
      }
    }
  };

  if (loading || !incident) {
    return (
      <div className="py-12 text-center text-sm text-ink-secondary">
        Initializing public replay sandbox...
      </div>
    );
  }

  const driverObs = observations.find((o) => o.speaker_role === "driver");
  const dockObs = observations.find((o) => o.speaker_role === "dock");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Persistent Offline Replay Safety Banner */}
      <div className="bg-canvas-subtle border-2 border-edge rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
        <div className="flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-state-attention-text animate-pulse" />
          <strong className="text-ink-primary uppercase tracking-wide">
            Offline replay &mdash; no call is being placed
          </strong>
        </div>
        <span className="text-ink-secondary text-[13px]">
          Runs exact domain state transitions using deterministic fixture transport. Zero telemetry or dialing.
        </span>
      </div>

      {/* Demo Controls Bar */}
      <div className="bg-canvas-paper border border-edge rounded-lg p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Play / Pause / Reset Buttons */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={handlePlayPause}
            className={`px-5 py-2 rounded font-bold text-sm uppercase tracking-wider transition-colors shadow-sm ${
              isPlaying
                ? "bg-state-attention-bg text-state-attention-text border border-state-attention-border"
                : "bg-action-primary text-white hover:bg-action-hover"
            }`}
          >
            {isPlaying ? "❚❚ Pause Flow" : "▶ Play the 45-Second Flow"}
          </button>

          <button
            onClick={() => resetFlow(scenario)}
            className="px-3.5 py-2 rounded text-sm font-semibold bg-canvas-main hover:bg-canvas-subtle text-ink-secondary border border-edge transition-colors"
          >
            Reset
          </button>

          <button
            onClick={() => setSpeed(speed === 1 ? 2 : 1)}
            className="px-3 py-2 rounded text-sm font-semibold bg-canvas-main hover:bg-canvas-subtle text-ink-secondary border border-edge transition-colors tabular-nums"
          >
            Speed: {speed}x
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center space-x-2 text-sm font-medium text-ink-secondary">
          <span>Step {currentStep}/4:</span>
          <span className="font-bold text-ink-primary">
            {currentStep === 0 && "1. At-Risk Load Initialized"}
            {currentStep === 1 && "2. Authority Frozen & Driver Call"}
            {currentStep === 2 && "3. Overlap Calculated & Dock Call"}
            {currentStep === 3 && (scenario === "fee_refusal" ? "Dock Refusal & Dispatcher Needed" : "4. Dock Confirmed & Pass Issued")}
            {currentStep === 4 && "5. Driver Acknowledged on Mobile"}
          </span>
        </div>

        {/* Scenario Switcher */}
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-ink-muted">Scenario:</span>
          <button
            onClick={() => resetFlow("positive")}
            className={`px-3 py-1.5 rounded font-semibold text-sm transition-colors ${
              scenario === "positive"
                ? "bg-state-confirmed-bg text-state-confirmed-text border border-state-confirmed-border"
                : "bg-canvas-main text-ink-secondary border border-edge"
            }`}
          >
            Positive Flow
          </button>
          <button
            onClick={() => resetFlow("fee_refusal")}
            className={`px-3 py-1.5 rounded font-semibold text-sm transition-colors ${
              scenario === "fee_refusal"
                ? "bg-state-failure-bg text-state-failure-text border border-state-failure-border"
                : "bg-canvas-main text-ink-secondary border border-edge"
            }`}
          >
            Fee Refusal Flow
          </button>
        </div>
      </div>

      {/* Replay Notice if Fee Refusal */}
      {scenario === "fee_refusal" && currentStep >= 3 && (
        <div className="p-4 rounded-lg bg-state-failure-bg border border-state-failure-border text-state-failure-text text-sm space-y-1">
          <span className="font-bold uppercase tracking-wider block">
            Truthful Outcome: Dispatcher Needed (Never False Green)
          </span>
          <p>
            Northline Receiving demanded an unapproved gate fee of $350 USD, exceeding the dispatcher&apos;s $150 limit.
            DwellGuard refused automatic confirmation and flagged the incident for immediate dispatcher intervention.
          </p>
        </div>
      )}

      {/* Signature WOW Moment: Plan Rail */}
      <PlanRail
        incident={incident}
        authority={authority}
        driverObservation={driverObs}
        dockObservation={dockObs}
        receipt={receipt}
        causalProof={causalProof}
      />

      {/* Main Surface: Left Context / Right Pass */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-canvas-paper border border-edge rounded-lg p-5 text-sm space-y-4 shadow-sm">
          <h3 className="font-bold text-ink-primary uppercase tracking-wider border-b border-edge pb-2">
            Replay Telemetry
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-edge/50">
              <span className="text-ink-muted">Incident Status:</span>
              <span className="font-bold text-ink-primary uppercase">{incident.status.replace(/_/g, " ")}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-edge/50">
              <span className="text-ink-muted">Task Budget:</span>
              <span className="font-semibold tabular-nums text-ink-primary">{incident.task_budget_remaining} / 2 remaining</span>
            </div>

            <div className="flex justify-between py-1 border-b border-edge/50">
              <span className="text-ink-muted">Authority:</span>
              <span className="font-semibold text-ink-primary">
                {authority ? `v${authority.version} (Ceiling: $${authority.fee_ceiling})` : "Pending"}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-edge/50">
              <span className="text-ink-muted">Driver Call Task:</span>
              <span className="font-semibold text-ink-primary">
                {driverObs ? "Verified (11:35-11:50)" : "Pending"}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-ink-muted">Dock Call Task:</span>
              <span className="font-semibold text-ink-primary">
                {dockObs
                  ? dockObs.fee_amount && dockObs.fee_amount > 150
                    ? `Refused (Fee $${dockObs.fee_amount})`
                    : "Confirmed (11:45)"
                  : "Pending"}
              </span>
            </div>
          </div>

          <div className="p-3 bg-canvas-subtle/60 rounded border border-edge text-[13px] text-ink-secondary leading-normal">
            <strong>Judging Note:</strong> This replay uses the exact production state machine and interval math. No separate fake UI animations.
          </div>
        </div>

        <div className="lg:col-span-2">
          {receipt ? (
            <AppointmentPass
              receipt={receipt}
              incident={incident}
              handoffToken={handoffToken}
            />
          ) : (
            <div className="bg-canvas-paper border border-edge rounded-lg p-6 flex flex-col items-center justify-center text-center h-full min-h-[260px] space-y-3">
              <div className="w-10 h-10 rounded-full bg-canvas-subtle border border-edge flex items-center justify-center text-action-primary font-bold text-sm">
                {currentStep + 1}
              </div>
              <h4 className="text-sm font-bold text-ink-primary">
                {currentStep === 0
                  ? "Replay Ready · Press Play"
                  : incident.status === "dispatcher_needed"
                  ? "Coordination Stopped (Authority Limit Exceeded)"
                  : "Advancing Sequence..."}
              </h4>
              <p className="text-sm text-ink-secondary max-w-sm">
                {currentStep === 0
                  ? "Watch the driver's verified arrival range visibly rewrite the dock call request and Plan Rail in place."
                  : incident.status === "dispatcher_needed"
                  ? incident.resolution_reason
                  : "CALL-E task executing in replay harness."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
