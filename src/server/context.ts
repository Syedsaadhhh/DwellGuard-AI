import { Store } from "@/domain/ports/store";
import { MemoryStore } from "@/infrastructure/store/memory-store";
import { SupabaseStore } from "@/infrastructure/store/supabase-store";
import { CalleGateway } from "@/domain/ports/calle-gateway";
import { LiveCalleGateway } from "@/infrastructure/calle/live-gateway";
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
  if (!globalMemoryStore) {
    globalMemoryStore = new MemoryStore(true);
  }
  return globalMemoryStore;
}

export function getCalleGateway(): CalleGateway {
  if (process.env.CALLE_API_KEY) {
    return new LiveCalleGateway(process.env.CALLE_API_KEY, process.env.CALLE_BASE_URL);
  }
  // Default to Fixture gateway for local execution / testing when no credentials exist
  return new FixtureCalleGateway("positive");
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
