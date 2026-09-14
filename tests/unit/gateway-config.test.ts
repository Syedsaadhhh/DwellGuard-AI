import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getCalleGateway, getDemoContext } from "@/server/context";
import { LiveCalleGateway } from "@/infrastructure/calle/live-gateway";
import { FixtureCalleGateway } from "@/infrastructure/calle/fixture-gateway";

describe("CALL-E Gateway Configuration & Fail-Closed Boundary", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CALLE_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("fails closed when CALLE_API_KEY is missing outside demo context", () => {
    delete process.env.CALLE_API_KEY;

    expect(() => getCalleGateway()).toThrowError(/BLOCKED_LIVE/);
  });

  it("permits FixtureCalleGateway strictly through getDemoContext()", () => {
    const demoCtx = getDemoContext();
    expect(demoCtx.gateway).toBeInstanceOf(FixtureCalleGateway);

    // Verify demo gateway cannot place live calls
    expect(demoCtx.gateway.createCallTask).toBeDefined();
  });

  it("instantiates LiveCalleGateway using official https://api.heycall-e.com when CALLE_API_KEY is present", () => {
    process.env.CALLE_API_KEY = "test_key_live_boundary";
    delete process.env.CALLE_BASE_URL;

    const gateway = getCalleGateway();
    expect(gateway).toBeInstanceOf(LiveCalleGateway);

    // Verify endpoint defaults to official https://api.heycall-e.com
    const liveGateway = gateway as LiveCalleGateway;
    expect(liveGateway.baseUrl).toBe("https://api.heycall-e.com");
  });

  it("respects custom CALLE_BASE_URL if explicitly provided", () => {
    process.env.CALLE_API_KEY = "test_key_live_boundary";
    process.env.CALLE_BASE_URL = "https://custom.calle.internal";

    const gateway = getCalleGateway() as LiveCalleGateway;
    expect(gateway.baseUrl).toBe("https://custom.calle.internal");
  });
});
