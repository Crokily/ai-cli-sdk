import { isAbsolute } from "node:path";
import type { IAgentAdapter, LaunchConfig } from "../interfaces/agent.js";

const DEFAULT_COMMAND = "gemini";
const PROMPT_FLAG = "--prompt";
const ENV_KEYS = [
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "GOOGLE_APPLICATION_CREDENTIALS",
  "GOOGLE_CLOUD_PROJECT",
  "GOOGLE_CLOUD_PROJECT_ID",
  "GOOGLE_CLOUD_LOCATION",
];

const sanitizePrompt = (task: string): string => task.replace(/\0/g, "");

export class GeminiAdapter implements IAgentAdapter {
  readonly name = "gemini";
  private readonly command: string;

  constructor(command: string = DEFAULT_COMMAND) {
    if (!command.trim()) {
      throw new Error("GeminiAdapter command must be a non-empty string.");
    }
    this.command = command;
  }

  buildLaunchConfig(task: string): LaunchConfig {
    const args = [PROMPT_FLAG, sanitizePrompt(task)];
    const config: LaunchConfig = {
      command: this.command,
      args,
      envAllowlist: ENV_KEYS,
    };
    if (!isAbsolute(this.command)) {
      config.commandAllowlist = [this.command];
    }
    return config;
  }

  isTaskComplete(): boolean {
    return false;
  }
}
