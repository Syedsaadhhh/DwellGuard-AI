import { TimeInterval, OverlapResult } from "../types";

/**
 * Format an ISO string to a human-readable local time in the specified IANA timezone (default "America/New_York")
 */
export function formatLocalTime(isoString: string, timeZone = "America/New_York"): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone,
    });
  } catch {
    return isoString;
  }
}

/**
 * Computes the temporal intersection between dispatcher-approved authority interval
 * and the driver-verified workable arrival interval.
 *
 * Full dates, timezone offsets, and rollover are respected.
 */
export function computeIntervalIntersection(
  authorityStartIso: string,
  authorityEndIso: string,
  driverStartIso: string,
  driverEndIso: string,
  timezone: string,
  dockName = "Receiving Dock",
  selectionPermitted = true
): OverlapResult {
  const authStart = new Date(authorityStartIso).getTime();
  const authEnd = new Date(authorityEndIso).getTime();
  const drvStart = new Date(driverStartIso).getTime();
  const drvEnd = new Date(driverEndIso).getTime();

  if (isNaN(authStart) || isNaN(authEnd) || isNaN(drvStart) || isNaN(drvEnd)) {
    return {
      hasOverlap: false,
      explanation: "Invalid timestamp provided for interval computation.",
      reason: "TIMESTAMP_PARSE_ERROR",
    };
  }

  if (authStart > authEnd) {
    return {
      hasOverlap: false,
      explanation: "Authority interval has invalid boundary (start is after end).",
      reason: "INVALID_AUTHORITY_WINDOW",
    };
  }

  if (drvStart > drvEnd) {
    return {
      hasOverlap: false,
      explanation: "Driver interval has invalid boundary (start is after end).",
      reason: "INVALID_DRIVER_WINDOW",
    };
  }

  const overlapStartMs = Math.max(authStart, drvStart);
  const overlapEndMs = Math.min(authEnd, drvEnd);

  if (overlapStartMs > overlapEndMs) {
    const drvStartFmt = formatLocalTime(driverStartIso, timezone);
    const drvEndFmt = formatLocalTime(driverEndIso, timezone);
    const authStartFmt = formatLocalTime(authorityStartIso, timezone);
    const authEndFmt = formatLocalTime(authorityEndIso, timezone);

    return {
      hasOverlap: false,
      reason: "EMPTY_INTERSECTION",
      explanation: `Driver window (${drvStartFmt}–${drvEndFmt}) does not overlap with authorized limits (${authStartFmt}–${authEndFmt}). Dispatcher intervention required.`,
    };
  }

  const overlapStartIso = new Date(overlapStartMs).toISOString();
  const overlapEndIso = new Date(overlapEndMs).toISOString();

  const drvStartFmt = formatLocalTime(driverStartIso, timezone);
  const drvEndFmt = formatLocalTime(driverEndIso, timezone);
  const ovStartFmt = formatLocalTime(overlapStartIso, timezone);
  const ovEndFmt = formatLocalTime(overlapEndIso, timezone);

  const permissionText = selectionPermitted
    ? "authorized selection inside that range"
    : "did NOT authorize selection inside that range";

  const explanation = `Driver can check in ${drvStartFmt}–${drvEndFmt} and ${permissionText}. Asking ${dockName} for one explicit time within ${ovStartFmt}–${ovEndFmt}.`;

  return {
    hasOverlap: true,
    overlap: {
      start: overlapStartIso,
      end: overlapEndIso,
      timezone,
    },
    explanation,
  };
}
