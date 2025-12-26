import { isAbsolute } from "node:path";
import { AnsiStreamCleaner } from "../utils/AnsiStreamCleaner.js";
import { spawn, type IPty } from "node-pty";
import type { IAgentAdapter, InteractionContext } from "../interfaces/agent.js";
import {
  DEFAULT_COLS,
  DEFAULT_ROWS,
  buildEnv,
  countNewlines,
  getLastLine,
  withNewline,
} from "./runnerUtils.js";
import { TypedEventEmitter } from "../utils/TypedEventEmitter.js";
import type { AgentRunnerEvents, ExecuteOptions, RunResult } from "./types.js";

export type PtySpawner = typeof spawn;

type AutoPromptState = {
  prompt: string;
  lineCount: number;
};

export class AgentRunner extends TypedEventEmitter<AgentRunnerEvents> {
  private ptyProcess: IPty | undefined;
  private rawOutput = "";
  private cleanOutput = "";
  private cleanOutputLineCount = 0;
  private running = false;
  private lastAutoPrompt: AutoPromptState | null = null;
  private ansiCleaner = new AnsiStreamCleaner();

  constructor(
    private readonly adapter: IAgentAdapter,
    private readonly ptySpawn: PtySpawner = spawn,
  ) {
    super();
  }

  get isRunning(): boolean {
    return this.running;
  }

  async execute(task: string, options: ExecuteOptions = {}): Promise<RunResult> {
    if (this.running) throw new Error("AgentRunner is already executing a task.");

    this.rawOutput = "";
    this.cleanOutput = "";
    this.cleanOutputLineCount = 0;
    this.lastAutoPrompt = null;
    this.ansiCleaner.reset();

    const config = this.adapter.buildLaunchConfig(task);
    const commandAllowlist = new Set([
      ...(config.commandAllowlist ?? []),
      ...(options.commandAllowlist ?? []),
    ]);
    if (!isAbsolute(config.command) && !commandAllowlist.has(config.command)) {
      throw new Error(
        `Command path must be absolute or allowlisted. Received "${config.command}".`,
      );
    }

    this.running = true;

    const env = buildEnv(config.env, options.env, options.envAllowlist);
    const cwd = options.cwd ?? config.cwd ?? process.cwd();
    const cols = options.cols ?? config.cols ?? process.stdout.columns ?? DEFAULT_COLS;
    const rows = options.rows ?? config.rows ?? process.stdout.rows ?? DEFAULT_ROWS;

    try {
      this.ptyProcess = this.ptySpawn(config.command, config.args, {
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
        const cleanChunk = this.ansiCleaner.strip(data);
        this.cleanOutput += cleanChunk;
        this.cleanOutputLineCount += countNewlines(cleanChunk);
        this.emit("output", data);

        const lastLine = getLastLine(this.cleanOutput);
        const context: InteractionContext = {
          rawOutput: this.rawOutput,
          cleanOutput: this.cleanOutput,
          lastLine,
        };

        if (this.adapter.handleInteraction) {
          const response = this.adapter.handleInteraction(context);
          if (
            response &&
            (!this.lastAutoPrompt ||
              this.lastAutoPrompt.prompt !== lastLine ||
              this.lastAutoPrompt.lineCount !== this.cleanOutputLineCount)
          ) {
            this.lastAutoPrompt = { prompt: lastLine, lineCount: this.cleanOutputLineCount };
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
