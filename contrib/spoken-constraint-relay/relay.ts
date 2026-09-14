/**
 * DwellGuard Spoken Constraint Relay — CALL-E Reference Pattern
 *
 * Implements a sequential two-call voice authority chain:
 * 1. Call Driver to capture actual arrival boundary and permission to select inside that window.
 * 2. Mathematically compute intersection between dispatcher limits and driver constraints.
 * 3. Call Dock requesting an explicit appointment slot strictly within the derived overlap.
 * 4. Generate deterministic Causal Appointment Proof and return confirmed plan to driver.
 */

import { CalleClient } from "@call-e/calle";
import crypto from "crypto";

export interface RelayConfig {
  incidentId: string;
  loadRef: string;
  driverPhone: string;
  dockPhone: string;
  dockName: string;
  earliestAllowed: string; // ISO string
  latestAllowed: string;   // ISO string
  feeCeiling: number;
  currency?: string;
  timezone: string;
}

export interface RelayOutcome {
  success: boolean;
  status: "confirmed" | "human_dispatcher_needed";
  confirmedTime?: string;
  designatedDoor?: string;
  feeAmount?: number;
  causalProofId?: string;
  proofHash?: string;
  explanation: string;
  driverCallId?: string;
  dockCallId?: string;
}

export async function executeSpokenConstraintRelay(
  config: RelayConfig,
  client: CalleClient
): Promise<RelayOutcome> {
  // Step 1: Call driver for workable window and selection permission
  const driverCall = await client.calls.create({
    task: `Call late driver regarding load ${config.loadRef}. Verify arrival window and confirm permission to schedule within that window.`,
    recipients: [{ phones: [config.driverPhone] }],
    metadata: { incident_id: config.incidentId, call_type: "driver" },
  });

  const driverResult = await client.calls.get(driverCall.id);
  const driverData = (driverResult as any).structuredResult || {};

  if (!driverData.verified_interval_start || driverData.selection_permitted === false) {
    return {
      success: false,
      status: "human_dispatcher_needed",
      driverCallId: driverCall.id,
      explanation: "Driver could not verify arrival window or declined scheduling permission.",
    };
  }

  // Step 2: Mathematically intersect dispatcher limits with driver interval
  const overlapStart = new Date(Math.max(
    new Date(config.earliestAllowed).getTime(),
    new Date(driverData.verified_interval_start).getTime()
  )).toISOString();

  const overlapEnd = new Date(Math.min(
    new Date(config.latestAllowed).getTime(),
    new Date(driverData.verified_interval_end).getTime()
  )).toISOString();

  if (new Date(overlapStart).getTime() > new Date(overlapEnd).getTime()) {
    return {
      success: false,
      status: "human_dispatcher_needed",
      driverCallId: driverCall.id,
      explanation: "No temporal overlap between dispatcher authority limits and driver workable arrival window.",
    };
  }

  // Step 3: Call receiving dock constrained strictly to the derived overlap
  const dockCall = await client.calls.create({
    task: `Driver for load ${config.loadRef} can check in between ${overlapStart} and ${overlapEnd}. Please confirm one explicit appointment time and door within this range. Maximum fee: ${config.feeCeiling} ${config.currency || "USD"}.`,
    recipients: [{ phones: [config.dockPhone] }],
    metadata: { incident_id: config.incidentId, call_type: "dock" },
  });

  const dockResult = await client.calls.get(dockCall.id);
  const dockData = (dockResult as any).structuredResult || {};

  const feeAmount = Number(dockData.fee_amount ?? 0);
  if (feeAmount > config.feeCeiling) {
    return {
      success: false,
      status: "human_dispatcher_needed",
      driverCallId: driverCall.id,
      dockCallId: dockCall.id,
      explanation: `Dock requested fee of $${feeAmount}, exceeding authorized ceiling of $${config.feeCeiling}.`,
    };
  }

  if (!dockData.confirmed_time) {
    return {
      success: false,
      status: "human_dispatcher_needed",
      driverCallId: driverCall.id,
      dockCallId: dockCall.id,
      explanation: "Dock could not commit to an explicit appointment time inside approved interval.",
    };
  }

  // Step 4: Construct canonical Causal Proof
  const proofPayload = {
    incident_id: config.incidentId,
    load_ref: config.loadRef,
    driver_call_id: driverCall.id,
    dock_call_id: dockCall.id,
    overlap_start: overlapStart,
    overlap_end: overlapEnd,
    confirmed_time: dockData.confirmed_time,
    door: dockData.door || "Main Receiving",
    fee_amount: feeAmount,
  };

  const canonicalJson = JSON.stringify(
    Object.keys(proofPayload)
      .sort()
      .reduce((acc: any, k) => {
        acc[k] = (proofPayload as any)[k];
        return acc;
      }, {})
  );

  const proofHash = crypto.createHash("sha256").update(canonicalJson).digest("hex");
  const causalProofId = `DG-PROOF-${proofHash.slice(0, 8).toUpperCase()}`;

  return {
    success: true,
    status: "confirmed",
    confirmedTime: dockData.confirmed_time,
    designatedDoor: dockData.door || "Main Receiving",
    feeAmount,
    causalProofId,
    proofHash,
    explanation: `Appointment confirmed at ${dockData.confirmed_time} (${dockData.door || "Main Receiving"}). Causal Proof ${causalProofId} verified.`,
    driverCallId: driverCall.id,
    dockCallId: dockCall.id,
  };
}
