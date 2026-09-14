import { Store } from "@/domain/ports/store";
import { MemoryStore } from "@/infrastructure/store/memory-store";
import { SupabaseStore } from "@/infrastructure/store/supabase-store";
import { CalleGateway } from "@/domain/ports/calle-gateway";
import { LiveCalleGateway, OFFICIAL_CALLE_BASE_URL } from "@/infrastructure/calle/live-gateway";
import { FixtureCalleGateway } from "@/infrastructure/calle/fixture-gateway";
import { Clock, SystemClock } from "@/domain/ports/clock";
import { TokenGenerator, CryptoTokenGenerator } from "@/domain/ports/tokens";

let globalMemoryStore: MemoryStore | null = null;
let globalClock: Clock = new SystemClock();
let globalTokenGenerator: TokenGenerator = new CryptoTokenGenerator();

export function getStore(): Store {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new SupabaseStore();
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "BLOCKED_LIVE: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production."
    );
  }
  if (!globalMemoryStore) {
    globalMemoryStore = new MemoryStore(true);
  }
  return globalMemoryStore;
}

/**
 * Fails closed in live mode:
 * Throws BLOCKED_LIVE error if CALLE_API_KEY is missing. Never falls back to fixture gateway.
 */
export function getCalleGateway(): CalleGateway {
  const apiKey = process.env.CALLE_API_KEY;
  if (!apiKey) {
    throw new Error("BLOCKED_LIVE: CALLE_API_KEY is not configured in the environment. Live calls cannot be placed.");
  }
  const baseUrl = process.env.CALLE_BASE_URL || OFFICIAL_CALLE_BASE_URL;
  return new LiveCalleGateway(apiKey, baseUrl);
}

export function getClock(): Clock {
  return globalClock;
}

export function getTokenGenerator(): TokenGenerator {
  return globalTokenGenerator;
}

// Public demo isolated memory store and fixture gateway
let demoStore: MemoryStore | null = null;
let demoGateway: FixtureCalleGateway | null = null;

export function getDemoContext() {
  if (!demoStore) {
    demoStore = new MemoryStore(true);
  }
  if (!demoGateway) {
    demoGateway = new FixtureCalleGateway("positive");
  }
  return {
    store: demoStore,
    gateway: demoGateway,
    clock: globalClock,
    tokenGenerator: globalTokenGenerator,
    resetDemo: (scenario: "positive" | "fee_refusal" = "positive") => {
      demoStore = new MemoryStore(true);
      demoGateway = new FixtureCalleGateway(scenario);
      return { store: demoStore, gateway: demoGateway };
    },
  };
}
