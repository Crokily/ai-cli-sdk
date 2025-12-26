import { describe, it, expect, vi } from "vitest";
import { AgentRunner } from "../runner/AgentRunner.js";
import type { IAgentAdapter } from "../interfaces/agent.js";

describe("AgentRunner command validation", () => {
  it("rejects non-absolute commands not in allowlist", async () => {
    const adapter: IAgentAdapter = {
      name: "test",
      buildLaunchConfig: () => ({ command: "node", args: [] }),
      isTaskComplete: () => false,
    };

    const mockPty = {
      onData: vi.fn(),
      onExit: vi.fn(),
      write: vi.fn(),
      kill: vi.fn(),
    };

    const ptySpawn = vi.fn().mockReturnValue(mockPty);
    const runner = new AgentRunner(adapter, ptySpawn as any);

    await expect(runner.execute("task")).rejects.toThrow(/absolute|allowlist/i);
    expect(ptySpawn).not.toHaveBeenCalled();
  });

  it("allows non-absolute commands that are allowlisted", async () => {
    const adapter: IAgentAdapter = {
      name: "test",
      buildLaunchConfig: () => ({ command: "node", args: [] }),
      isTaskComplete: () => false,
    };

    let exitHandler: ((event: { exitCode: number; signal?: number }) => void) | undefined;
    const mockPty = {
      onData: vi.fn(),
      onExit: vi.fn((handler) => {
        exitHandler = handler;
      }),
      write: vi.fn(),
      kill: vi.fn(),
    };

    const ptySpawn = vi.fn().mockReturnValue(mockPty);
    const runner = new AgentRunner(adapter, ptySpawn as any);

    const runPromise = runner.execute("task", { commandAllowlist: ["node"] });
    expect(ptySpawn).toHaveBeenCalled();
    exitHandler?.({ exitCode: 0, signal: 0 });

    await expect(runPromise).resolves.toMatchObject({ exitCode: 0 });
  });
});
