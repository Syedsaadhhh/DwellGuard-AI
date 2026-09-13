"use client";

import React from "react";
import { formatLocalTime } from "@/domain/workflow/interval";
import { Incident, AuthorityVersion, Observation, Receipt } from "@/domain/types";

interface PlanRailProps {
  incident: Incident;
  authority?: AuthorityVersion | null;
  driverObservation?: Observation | null;
  dockObservation?: Observation | null;
  receipt?: Receipt | null;
}

export function PlanRail({
  incident,
  authority,
  driverObservation,
  dockObservation,
  receipt,
}: PlanRailProps) {
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

  return (
    <div className="bg-canvas-paper border border-edge rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-edge pb-3">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-ink-primary text-sm uppercase tracking-wide">
            Plan Rail
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-canvas-subtle text-ink-secondary border border-edge">
            Shared Time Axis · {authority?.timezone || "America/New_York"}
          </span>
        </div>

        <div className="text-xs text-ink-muted tabular-nums">
          Load <strong className="text-ink-primary">{incident.load_ref}</strong>
        </div>
      </div>

      {/* Visual Axis Rail */}
      <div className="relative pt-6 pb-8 px-4 bg-canvas-main rounded-md border border-edge/60">
        {/* Baseline Axis Line */}
        <div className="absolute top-1/2 left-6 right-6 h-1 bg-edge rounded-full transform -translate-y-1/2" />

        <div className="relative flex justify-between items-center text-xs">
          {/* 1. Original Appointment */}
          <div className="flex flex-col items-center text-center">
            <div className="w-3.5 h-3.5 rounded-full bg-ink-muted border-2 border-canvas-paper z-10" />
            <span className="mt-2 text-[11px] text-ink-muted uppercase font-medium">Original</span>
            <span className="font-semibold text-ink-secondary tabular-nums line-through decoration-state-failure-text">
              {origApptFmt}
            </span>
          </div>

          {/* 2. Updated ETA */}
          <div className="flex flex-col items-center text-center">
            <div className="w-3.5 h-3.5 rounded-full bg-state-attention-text border-2 border-canvas-paper z-10" />
            <span className="mt-2 text-[11px] text-state-attention-text uppercase font-semibold">New ETA</span>
            <span className="font-semibold text-ink-primary tabular-nums">
              {etaFmt}
            </span>
          </div>

          {/* 3. Authority Window */}
          {authority && (
            <div className="flex flex-col items-center text-center">
              <div className="w-3 h-3 rounded-full bg-action-primary border-2 border-canvas-paper z-10" />
              <span className="mt-2 text-[11px] text-ink-secondary uppercase font-medium">Authorized</span>
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
            <span className="mt-2 text-[11px] text-ink-secondary uppercase font-medium">Driver Range</span>
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
            <span className="mt-2 text-[11px] text-state-confirmed-text uppercase font-bold">Confirmed</span>
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
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary block">
            What Changed
          </span>
          <p className="text-sm text-ink-primary font-medium mt-0.5 leading-snug">
            {whatChangedText}
          </p>
        </div>
      </div>

      {/* Dock Request Preview if Driver Result is in and dock is pending */}
      {hasDriverResult && !hasConfirmation && incident.status !== "dispatcher_needed" && (
        <div className="bg-blue-50/50 border border-blue-200/80 rounded-md p-3 text-xs text-ink-primary">
          <span className="font-semibold text-action-primary uppercase tracking-wide block mb-1">
            Dock Call Dispatch Preview
          </span>
          <p className="text-ink-secondary font-mono text-[11px]">
            &quot;Driver can check in {drvStartFmt}–{drvEndFmt} and authorized selection inside that range. Asking {incident.dock_name} for one explicit time within {drvStartFmt}–{drvEndFmt}.&quot;
          </p>
        </div>
      )}
    </div>
  );
}
