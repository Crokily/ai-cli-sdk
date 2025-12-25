import ansis from "ansis";
import { spawn, type IPty } from "node-pty";
import { TypedEventEmitter } from "../utils/TypedEventEmitter.js";
import type { IAgentAdapter, InteractionContext } from "../interfaces/agent.js";
import type { AgentRunnerEvents, ExecuteOptions, RunResult } from "./types.js";

const DEFAULT_ENV_ALLOWLIST = [
  "PATH",
  "HOME",
  "USER",
  "SHELL",
  "TMPDIR",
  "TMP",
  "TEMP",
  "TERM",
  "COLORTERM",
  "LANG",
  "LC_ALL",
  "LC_CTYPE",
];
const DEFAULT_COLS = 80;
const DEFAULT_ROWS = 30;

const getLastLine = (text: string): string => {
  const index = text.lastIndexOf("\n");
  return index === -1 ? text : text.slice(index + 1);
};

const applyEnv = (target: Record<string, string>, source?: Record<string, string>) => {
  if (!source) return;
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "string") target[key] = value;
  }
};

const buildEnv = (
  configEnv?: Record<string, string>,
  overrideEnv?: Record<string, string>,
  allowlist: string[] = DEFAULT_ENV_ALLOWLIST,
): Record<string, string> => {
  const env: Record<string, string> = {};
  for (const key of allowlist) {
    const value = process.env[key];
    if (typeof value === "string") env[key] = value;
  }
  applyEnv(env, configEnv);
  applyEnv(env, overrideEnv);
  return env;
};

const withNewline = (input: string): string => (input.endsWith("\n") ? input : `${input}\n`);

export class AgentRunner extends TypedEventEmitter<AgentRunnerEvents> {
  private ptyProcess: IPty | undefined;
  private rawOutput = "";
  private cleanOutput = "";
  private running = false;
  private lastAutoPrompt: string | null = null;

  constructor(private readonly adapter: IAgentAdapter) {
    super();
  }

  get isRunning(): boolean {
    return this.running;
  }

  async execute(task: string, options: ExecuteOptions = {}): Promise<RunResult> {
    if (this.running) throw new Error("AgentRunner is already executing a task.");
    this.running = true;
    this.rawOutput = "";
    this.cleanOutput = "";
    this.lastAutoPrompt = null;

    const config = this.adapter.buildLaunchConfig(task);
    const env = buildEnv(config.env, options.env, options.envAllowlist);
    const cwd = options.cwd ?? config.cwd ?? process.cwd();
    const cols = options.cols ?? config.cols ?? process.stdout.columns ?? DEFAULT_COLS;
    const rows = options.rows ?? config.rows ?? process.stdout.rows ?? DEFAULT_ROWS;

    try {
      this.ptyProcess = spawn(config.command, config.args, {
        cwd,
        env,
        cols,
        rows,
        name: "xterm-256color",
      });
    } catch (error) {
      this.running = false;
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit("error", err);
      throw err;
    }

    const ptyProcess = this.ptyProcess;
    if (!ptyProcess) {
      this.running = false;
      throw new Error("Failed to start PTY process.");
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      const finalize = (result: RunResult, shouldKill: boolean) => {
        if (settled) return;
        settled = true;
        const processToKill = this.ptyProcess;
        this.running = false;
        this.ptyProcess = undefined;
        this.emit("completed", result);
        resolve(result);
        if (shouldKill && processToKill) processToKill.kill();
      };
      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        this.running = false;
        this.ptyProcess = undefined;
        this.emit("error", error);
        reject(error);
      };

      ptyProcess.onData((data) => {
        if (settled) return;
        this.rawOutput += data;
        const cleanChunk = ansis.strip(data);
        this.cleanOutput += cleanChunk;
        this.emit("output", data);

        const lastLine = getLastLine(this.cleanOutput);
        const context: InteractionContext = {
          rawOutput: this.rawOutput,
          cleanOutput: this.cleanOutput,
          lastLine,
        };

        if (this.adapter.handleInteraction) {
          const response = this.adapter.handleInteraction(context);
          if (response && this.lastAutoPrompt !== lastLine) {
            this.lastAutoPrompt = lastLine;
            this.emit("interaction", { prompt: lastLine, response });
            this.write(response, true);
          }
        }

        if (this.adapter.isTaskComplete(this.cleanOutput, this.rawOutput)) {
          finalize(
            {
              exitCode: null,
              signal: null,
              rawOutput: this.rawOutput,
              cleanOutput: this.cleanOutput,
            },
            true,
          );
        }
      });

      ptyProcess.onExit(({ exitCode, signal }) => {
        if (settled) return;
        if (exitCode === 0) {
          finalize(
            {
              exitCode,
              signal: signal ?? null,
              rawOutput: this.rawOutput,
              cleanOutput: this.cleanOutput,
            },
            false,
          );
          return;
        }
        const error = new Error(
          `Agent process exited with code ${exitCode}${signal ? ` (signal ${signal})` : ""}.`,
        );
        fail(error);
      });
    });
  }

  write(input: string, appendNewline = false): void {
    if (!this.ptyProcess) throw new Error("No active PTY process to write to.");
    const payload = appendNewline ? withNewline(input) : input;
    this.ptyProcess.write(payload);
  }

  kill(signal: string = "SIGTERM"): void {
    if (!this.ptyProcess) return;
    this.ptyProcess.kill(signal);
    this.ptyProcess = undefined;
    this.running = false;
  }
}
