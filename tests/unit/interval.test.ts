import { describe, it, expect } from "vitest";
import { computeIntervalIntersection, formatLocalTime } from "@/domain/workflow/interval";

describe("Interval Math & Intersection", () => {
  it("computes valid overlap and formats explanation string", () => {
    // Dispatcher authorized 11:00 to 13:00 EDT
    const authStart = "2026-09-14T11:00:00-04:00";
    const authEnd = "2026-09-14T13:00:00-04:00";

    // Driver states workable check-in 11:35 to 11:50 EDT
    const drvStart = "2026-09-14T11:35:00-04:00";
    const drvEnd = "2026-09-14T11:50:00-04:00";

    const result = computeIntervalIntersection(
      authStart,
      authEnd,
      drvStart,
      drvEnd,
      "America/New_York",
      "Northline Receiving",
      true
    );

    expect(result.hasOverlap).toBe(true);
    expect(result.overlap).toBeDefined();
    expect(new Date(result.overlap!.start).getTime()).toBe(new Date(drvStart).getTime());
    expect(new Date(result.overlap!.end).getTime()).toBe(new Date(drvEnd).getTime());
    expect(result.explanation).toContain("Driver can check in");
    expect(result.explanation).toContain("authorized selection inside that range");
    expect(result.explanation).toContain("Northline Receiving");
  });

  it("detects empty intersection when driver arrives after authorized limit", () => {
    const authStart = "2026-09-14T11:00:00-04:00";
    const authEnd = "2026-09-14T12:00:00-04:00";

    const drvStart = "2026-09-14T14:30:00-04:00";
    const drvEnd = "2026-09-14T15:00:00-04:00";

    const result = computeIntervalIntersection(
      authStart,
      authEnd,
      drvStart,
      drvEnd,
      "America/New_York",
      "Northline Receiving",
      true
    );

    expect(result.hasOverlap).toBe(false);
    expect(result.reason).toBe("EMPTY_INTERSECTION");
    expect(result.explanation).toContain("Dispatcher intervention required");
  });

  it("handles midnight rollover accurately", () => {
    const authStart = "2026-09-14T23:30:00-04:00";
    const authEnd = "2026-09-15T01:30:00-04:00"; // Rollover to next day

    const drvStart = "2026-09-15T00:15:00-04:00";
    const drvEnd = "2026-09-15T01:00:00-04:00";

    const result = computeIntervalIntersection(
      authStart,
      authEnd,
      drvStart,
      drvEnd,
      "America/New_York"
    );

    expect(result.hasOverlap).toBe(true);
    expect(new Date(result.overlap!.start).getTime()).toBe(new Date(drvStart).getTime());
    expect(new Date(result.overlap!.end).getTime()).toBe(new Date(drvEnd).getTime());
  });

  it("formats local time cleanly", () => {
    const formatted = formatLocalTime("2026-09-14T11:35:00-04:00");
    expect(formatted).toMatch(/11:35/);
  });
});
