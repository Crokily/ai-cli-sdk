import type { IAgentAdapter } from "../interfaces/agent.js";
import { MockAdapter } from "../adapters/MockAdapter.js";

export type AdapterFactory = () => IAgentAdapter;

const normalizeKey = (name: string): string => name.trim().toLowerCase();

export class AgentFactory {
  private registry = new Map<string, AdapterFactory>();

  constructor() {
    this.register("mock", () => new MockAdapter());
  }

  register(name: string, factory: AdapterFactory): void {
    const key = normalizeKey(name);
    if (!key) {
      throw new Error("Adapter name must be a non-empty string.");
    }
    this.registry.set(key, factory);
  }

  has(name: string): boolean {
    return this.registry.has(normalizeKey(name));
  }

  list(): string[] {
    return Array.from(this.registry.keys()).sort();
  }

  create(name: string): IAgentAdapter {
    const key = normalizeKey(name);
    const factory = this.registry.get(key);
    if (!factory) {
      const available = this.list().join(", ") || "none";
      throw new Error(`Unknown adapter: ${name}. Available: ${available}.`);
    }
    return factory();
  }
}
