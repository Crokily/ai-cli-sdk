import { describe, it, expect } from "vitest";
import { AgentRunner } from "../../runner/AgentRunner.js";
import { GeminiAdapter } from "../../adapters/GeminiAdapter.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_CLI_PATH = path.join(__dirname, "../mocks/mock-gemini.js");

describe("GeminiAdapter Integration (Headless)", () => {
  it("should pass prompt and env vars correctly via DI", async () => {
    // 1. Setup Adapter with Mock Command
    // We inject "node" as the command, and the script as the first arg?
    // No, GeminiAdapter treats `command` as the binary. 
    // To mimic "gemini --prompt", we need the command to be an executable.
    // For this test, we use "node" as the command, but GeminiAdapter builds args as ["--prompt", task]
    // So if we pass "node src/test/mocks/mock-gemini.js" as the command string?
    // GeminiAdapter constructor takes `command`.
    
    // We can wrap it: command = "node", but logic inserts --prompt immediately.
    // Wait, GeminiAdapter logic: args = ["--prompt", task].
    // If command is "node", full cmd is: node --prompt task.
    // But our mock script needs to be run like: node mock-gemini.js --prompt task.
    
    // So we can't easily use the standard GeminiAdapter to run a JS script unless we make the script executable
    // and pass its absolute path as the `command`.
    
    const adapter = new GeminiAdapter(MOCK_CLI_PATH);

    const runner = new AgentRunner(adapter);
    
    // 2. Setup Env
    // We simulate the "System Environment" by passing it via options.env 
    // OR assuming process.env has it. 
    // The test runner (vitest) process.env needs the key for the allowlist to pick it up.
    process.env.GEMINI_API_KEY = "test-api-key-12345";

    let output = "";
    runner.on("output", (data) => output += data);

    // 3. Execute
    const result = await runner.execute("Write Hello World", {
        // We ensure our mock script is allowed (it's absolute so it should be auto-allowed by our logic,
        // but let's see. Adapter logic: if !isAbsolute -> allowlist.
        // Here MOCK_CLI_PATH is absolute, so it should be fine.)
    });

    // 4. Verification
    expect(result.exitCode).toBe(0);
    expect(output).toContain('Gemini Mock: Processing task "Write Hello World"');
    expect(output).toContain('with Key "test..."');

    // Cleanup
    delete process.env.GEMINI_API_KEY;
  });
});
