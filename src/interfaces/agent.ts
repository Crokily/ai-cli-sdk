export interface LaunchConfig {
  command: string;
  args: string[];
  commandAllowlist?: string[];
  cwd?: string;
  env?: Record<string, string>;
  cols?: number;
  rows?: number;
}

export interface InteractionContext {
  rawOutput: string;
  cleanOutput: string;
  lastLine: string;
}

export interface IAgentAdapter {
  readonly name: string;
  buildLaunchConfig(task: string): LaunchConfig;
  isTaskComplete(cleanOutput: string, rawOutput: string): boolean;
  handleInteraction?(context: InteractionContext): string | null;
}
