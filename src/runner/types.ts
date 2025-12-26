export interface InteractionEvent {
  prompt: string;
  response?: string;
}

export interface RunResult {
  exitCode: number | null;
  signal: number | null;
  rawOutput: string;
  cleanOutput: string;
}

export interface ExecuteOptions {
  cwd?: string;
  env?: Record<string, string>;
  envAllowlist?: string[];
  commandAllowlist?: string[];
  cols?: number;
  rows?: number;
}

export interface AgentRunnerEvents {
  output: (data: string) => void;
  interaction: (event: InteractionEvent) => void;
  completed: (result: RunResult) => void;
  error: (error: Error) => void;
}
