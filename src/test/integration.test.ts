import { describe, it, expect } from "vitest";
import { AgentFactory } from "../factory/AgentFactory.js";
import { AgentRunner } from "../runner/AgentRunner.js";

describe("Integration Test: Real PTY Flow", () => {
  it("should drive a real terminal process and handle interactions", async () => {
    const factory = new AgentFactory();
    const adapter = factory.create("mock");
    
    // 使用默认构造函数，即使用真实的 node-pty
    const runner = new AgentRunner(adapter);

    let outputData = "";
    runner.on("output", (data) => {
      outputData += data;
    });

    const interactions: any[] = [];
    runner.on("interaction", (event) => {
      interactions.push(event);
    });

    // 执行任务
    const result = await runner.execute("Integration Task");

    // 验证结果
    expect(result.rawOutput).toContain("MockAdapter start: Integration Task");
    expect(result.cleanOutput).toContain("Processing...");
    expect(result.cleanOutput).toContain("MOCK_TASK_COMPLETE");
    
    // 验证交互是否真正发生
    expect(interactions.length).toBeGreaterThan(0);
    expect(interactions[0].response).toBe("y");
  }, 15000); // 给 PTY 进程留足启动时间
});
