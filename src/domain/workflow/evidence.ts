import {
  Observation,
  AuthorityVersion,
  TimeInterval,
  TruthfulOutcome,
} from "../types";

export interface ValidationResult {
  valid: boolean;
  outcome: TruthfulOutcome;
  reason?: string;
  explanation: string;
}

/**
 * Validates driver observation:
 * - Verified interval exists
 * - Start <= End
 * - Driver selection permission is explicitly true
 */
export function validateDriverEvidence(obs: Observation): {
  permitted: boolean;
  validInterval: boolean;
  reason?: string;
} {
  if (!obs.verified_interval_start || !obs.verified_interval_end) {
    return {
      permitted: false,
      validInterval: false,
      reason: "Missing verified arrival interval from driver.",
    };
  }

  const start = new Date(obs.verified_interval_start).getTime();
  const end = new Date(obs.verified_interval_end).getTime();

  if (isNaN(start) || isNaN(end) || start > end) {
    return {
      permitted: false,
      validInterval: false,
      reason: "Driver workable arrival interval has invalid timestamps.",
    };
  }

  if (obs.selection_permitted !== true) {
    return {
      permitted: false,
      validInterval: true,
      reason: "Driver did not grant permission for automated slot selection.",
    };
  }

  return {
    permitted: true,
    validInterval: true,
  };
}

/**
 * Validates receiving dock confirmation against the authorized boundaries:
 * 1. Confirmed time must fall within the computed driver/authority overlap window.
 * 2. Fee amount must not exceed authority fee ceiling.
 * 3. Fee currency must match authority currency.
 * 4. Conditional offers, unverified fees, or vague answers require human dispatcher.
 */
export function validateDockEvidence(
  obs: Observation,
  authority: AuthorityVersion,
  overlap: TimeInterval
): ValidationResult {
  if (!obs.confirmed_time) {
    return {
      valid: false,
      outcome: "DISPATCHER_NEEDED",
      reason: "MISSING_CONFIRMED_TIME",
      explanation: "Receiving dock did not commit to an explicit appointment time.",
    };
  }

  const confirmedMs = new Date(obs.confirmed_time).getTime();
  const overlapStartMs = new Date(overlap.start).getTime();
  const overlapEndMs = new Date(overlap.end).getTime();

  if (isNaN(confirmedMs)) {
    return {
      valid: false,
      outcome: "DISPATCHER_NEEDED",
      reason: "INVALID_CONFIRMED_TIME",
      explanation: "Dock provided an unparseable appointment time.",
    };
  }

  // 1. Window bounds check
  if (confirmedMs < overlapStartMs || confirmedMs > overlapEndMs) {
    return {
      valid: false,
      outcome: "DISPATCHER_NEEDED",
      reason: "OUTSIDE_PERMITTED_INTERVAL",
      explanation: `Dock proposed an appointment outside the authorized window.`,
    };
  }

  // 2. Fee ceiling check
  const feeAmount = obs.fee_amount ?? 0;
  const feeCurrency = obs.fee_currency || "USD";

  if (feeCurrency !== authority.currency) {
    return {
      valid: false,
      outcome: "DISPATCHER_NEEDED",
      reason: "CURRENCY_MISMATCH",
      explanation: `Dock quoted fee in currency ${feeCurrency}, but authority requires ${authority.currency}.`,
    };
  }

  if (feeAmount > authority.fee_ceiling) {
    return {
      valid: false,
      outcome: "DISPATCHER_NEEDED",
      reason: "FEE_EXCEEDS_CEILING",
      explanation: `Dock quoted fee of ${authority.currency} $${feeAmount}, exceeding approved ceiling of $${authority.fee_ceiling}.`,
    };
  }

  // 3. Conditional or restrictive answers
  if (obs.conditions && obs.conditions.toLowerCase().includes("subject to") && !obs.confirmation_basis) {
    return {
      valid: false,
      outcome: "DISPATCHER_NEEDED",
      reason: "CONDITIONAL_OFFER",
      explanation: "Dock offer has unresolved conditions. Dispatcher review required.",
    };
  }

  return {
    valid: true,
    outcome: "PLAN_CONFIRMED",
    explanation: `Dock explicitly confirmed appointment time supported by verified recipient evidence.`,
  };
}
