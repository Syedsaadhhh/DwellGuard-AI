import crypto from "crypto";
import {
  Incident,
  AuthorityVersion,
  Observation,
  Receipt,
  TimeInterval,
  CausalProof,
  CausalProofPayload,
  CausalProofChainLink,
} from "../types";
import { formatLocalTime } from "../workflow/interval";

/**
 * Creates a deterministic, alphabetically sorted canonical JSON string.
 * Ensures zero phone numbers, names, raw transcripts, API keys, or provider response dumps are included.
 */
export function buildCanonicalProofPayload(
  incident: Incident,
  authority: AuthorityVersion,
  driverObs: Observation,
  dockObs: Observation,
  overlap: TimeInterval,
  receipt: Receipt,
  _acknowledgedAt?: string | null
): CausalProofPayload {
  // Explicitly pick only the strictly permitted causal facts
  return {
    incident_id: incident.id,
    authority_version: authority.version,
    driver_call_id: driverObs.calle_call_id,
    dock_call_id: dockObs.calle_call_id,
    driver_interval_start: driverObs.verified_interval_start || "",
    driver_interval_end: driverObs.verified_interval_end || "",
    driver_selection_permitted: driverObs.selection_permitted === true,
    overlap_start: overlap.start,
    overlap_end: overlap.end,
    dock_confirmed_time: dockObs.confirmed_time || "",
    dock_door: dockObs.door || undefined,
    dock_fee_amount: Number(dockObs.fee_amount ?? 0),
    dock_fee_currency: dockObs.fee_currency || "USD",
    dock_conditions: dockObs.conditions || undefined,
    receipt_id: receipt.id,
    receipt_version: receipt.version,
  };
}

/**
 * Serializes an object to a deterministic canonical JSON string with sorted keys.
 */
export function canonicalStringify(payload: Record<string, any>): string {
  const sortedKeys = Object.keys(payload).sort();
  const sortedObj: Record<string, any> = {};
  for (const key of sortedKeys) {
    if (payload[key] !== undefined) {
      sortedObj[key] = payload[key];
    }
  }
  return JSON.stringify(sortedObj);
}

/**
 * Computes SHA-256 hash and generates the human-readable display ID.
 * Example: "DG-PROOF-7A91C2E4"
 */
export function computeProofHashAndId(canonicalJson: string): { proofHash: string; shortId: string } {
  const proofHash = crypto.createHash("sha256").update(canonicalJson).digest("hex");
  const shortId = `DG-PROOF-${proofHash.slice(0, 8).toUpperCase()}`;
  return { proofHash, shortId };
}

/**
 * Generates the 6-link "Why this plan is valid" causal chain.
 */
export function buildProofChain(
  authority: AuthorityVersion,
  driverObs: Observation,
  dockObs: Observation,
  overlap: TimeInterval,
  receipt: Receipt,
  acknowledgedAt?: string | null
): { chain: CausalProofChainLink[]; isValid: boolean } {
  const tz = authority.timezone;

  const authStartFmt = formatLocalTime(authority.earliest_time, tz);
  const authEndFmt = formatLocalTime(authority.latest_time, tz);
  const drvStartFmt = driverObs.verified_interval_start ? formatLocalTime(driverObs.verified_interval_start, tz) : "";
  const drvEndFmt = driverObs.verified_interval_end ? formatLocalTime(driverObs.verified_interval_end, tz) : "";
  const ovStartFmt = formatLocalTime(overlap.start, tz);
  const ovEndFmt = formatLocalTime(overlap.end, tz);
  const confirmedTimeFmt = dockObs.confirmed_time ? formatLocalTime(dockObs.confirmed_time, tz) : "";

  const link1: CausalProofChainLink = {
    step: "authority",
    title: "1. Frozen Authority",
    fact: `Allowed check-in ${authStartFmt}–${authEndFmt} · Fee ceiling $${authority.fee_ceiling} ${authority.currency}`,
    source: `Dispatcher Authority v${authority.version}`,
    status: "valid",
  };

  const isDriverValid = !!driverObs.verified_interval_start && driverObs.selection_permitted === true;
  const link2: CausalProofChainLink = {
    step: "driver",
    title: "2. Driver Window & Permission",
    fact: isDriverValid
      ? `Workable ${drvStartFmt}–${drvEndFmt} · Slot selection authorized`
      : "Driver arrival window missing or slot selection refused",
    source: `Driver Voice Task (${driverObs.calle_call_id})`,
    status: isDriverValid ? "valid" : "broken",
  };

  const isOverlapValid = new Date(overlap.start).getTime() <= new Date(overlap.end).getTime();
  const link3: CausalProofChainLink = {
    step: "overlap",
    title: "3. Derived Overlap",
    fact: isOverlapValid ? `Strict mathematical overlap: ${ovStartFmt}–${ovEndFmt}` : "Empty temporal intersection",
    source: "DwellGuard Constraint Engine",
    status: isOverlapValid ? "valid" : "broken",
  };

  const feeOk = (dockObs.fee_amount ?? 0) <= authority.fee_ceiling;
  const timeOk =
    !!dockObs.confirmed_time &&
    new Date(dockObs.confirmed_time).getTime() >= new Date(overlap.start).getTime() &&
    new Date(dockObs.confirmed_time).getTime() <= new Date(overlap.end).getTime();
  const isDockValid = feeOk && timeOk;

  const link4: CausalProofChainLink = {
    step: "dock",
    title: "4. Dock Commitment",
    fact: isDockValid
      ? `Confirmed slot ${confirmedTimeFmt}${dockObs.door ? ` (${dockObs.door})` : ""} · Fee: $${dockObs.fee_amount ?? 0}`
      : !timeOk
      ? "Dock proposed slot outside driver/authority overlap"
      : `Dock quoted fee $${dockObs.fee_amount} exceeding ceiling of $${authority.fee_ceiling}`,
    source: `Dock Voice Task (${dockObs.calle_call_id})`,
    status: isDockValid ? "valid" : "broken",
  };

  const link5: CausalProofChainLink = {
    step: "receipt",
    title: "5. Versioned Receipt Pass",
    fact: `Official Appointment Pass v${receipt.version} generated`,
    source: `Receipt #${receipt.id.slice(-8)}`,
    status: isDockValid && isDriverValid && isOverlapValid ? "valid" : "broken",
  };

  const isAck = !!acknowledgedAt;
  const link6: CausalProofChainLink = {
    step: "driver_received",
    title: "6. Driver Acknowledgment",
    fact: isAck
      ? `Acknowledged by driver at ${formatLocalTime(acknowledgedAt, tz)}`
      : "Awaiting driver mobile tap on handoff page",
    source: isAck ? "Driver Browser Tap" : "Pending Handoff Link",
    status: isAck ? "valid" : "pending",
  };

  const chain = [link1, link2, link3, link4, link5, link6];
  const isValid = chain.slice(0, 5).every((l) => l.status === "valid");

  return { chain, isValid };
}

/**
 * Builds the complete Causal Appointment Proof.
 * Throws if the required chain has broken links (prevents false green proof generation).
 */
export function generateCausalProof(
  incident: Incident,
  authority: AuthorityVersion,
  driverObs: Observation,
  dockObs: Observation,
  overlap: TimeInterval,
  receipt: Receipt,
  acknowledgedAt?: string | null
): CausalProof {
  const { chain, isValid } = buildProofChain(authority, driverObs, dockObs, overlap, receipt, acknowledgedAt);

  if (!isValid) {
    throw new Error("Cannot finalize Causal Appointment Proof: one or more causal links are broken.");
  }

  const payload = buildCanonicalProofPayload(
    incident,
    authority,
    driverObs,
    dockObs,
    overlap,
    receipt,
    acknowledgedAt
  );

  const canonicalJson = canonicalStringify(payload);
  const { proofHash, shortId } = computeProofHashAndId(canonicalJson);

  return {
    id: `proof_${incident.id}_v${receipt.version}`,
    incident_id: incident.id,
    receipt_version: receipt.version,
    proof_hash: proofHash,
    short_id: shortId,
    canonical_payload: payload,
    chain,
    status: "valid",
    created_at: new Date().toISOString(),
  };
}
