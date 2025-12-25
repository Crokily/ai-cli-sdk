import { isAbsolute } from "node:path";
import type { IAgentAdapter, InteractionContext, LaunchConfig } from "../interfaces/agent.js";

const MOCK_SCRIPT = [
  "const task = process.argv[1] ?? '';",
  "console.log(`MockAdapter start: ${task}`);",
  "process.stdout.write('\\u001b[32mProcessing...\\u001b[0m\\n');",
  "process.stdout.write('Confirm? (y/n): ');",
  "process.stdin.setEncoding('utf8');",
  "process.stdin.once('data', (chunk) => {",
  "  const answer = String(chunk).trim();",
  "  process.stdout.write(`Received: ${answer}\\n`);",
  "  process.stdout.write('MOCK_TASK_COMPLETE\\n');",
  "});",
  "process.stdin.resume();",
].join("\n");

export class MockAdapter implements IAgentAdapter {
  readonly name = "mock";

  buildLaunchConfig(task: string): LaunchConfig {
    const command = process.execPath;
    if (!isAbsolute(command)) {
      throw new Error("MockAdapter requires an absolute Node.js executable path.");
    }

    return {
      command,
      args: ["-e", MOCK_SCRIPT, task],
    };
  }

  isTaskComplete(cleanOutput: string): boolean {
    return cleanOutput.includes("MOCK_TASK_COMPLETE");
  }

  handleInteraction(context: InteractionContext): string | null {
    if (/Confirm\?\s*\(y\/n\):\s*$/.test(context.lastLine)) {
      return "y";
    }

    return null;
  }
}
