# AI-CLI-SDK

**Universal AI CLI Orchestrator for Node.js**

AI-CLI-SDK is a unified wrapper library designed to orchestrate various AI-powered CLI tools (like Gemini CLI, Claude Code, etc.) through a standardized interface.

Think of it as a **"Universal Remote Control"** for AI CLIs. It handles the messy details of PTY (pseudo-terminal) management, ANSI color preservation, and process lifecycle, letting you focus on **"Input Task -> Get Result"**.

## 🚀 Key Features

*   **Unified Interface**: One code to rule them all. Switch between Gemini, Claude, or Mock agents without changing your logic.
*   **Environment Isolation**: Runs CLIs inside a `node-pty` sandbox, simulating a real terminal to preserve colored output and rich formatting.
*   **Smart Interactions**: Automatically handles TTY prompts (like confirmation dialogs) to prevent your automation from hanging.
*   **Type-Safe**: Written in strict TypeScript with comprehensive type definitions.

---

## ⚡ Quick Start

### 1. Installation
```bash
npm install ai-cli-sdk
# or
pnpm add ai-cli-sdk
```
*Note: Requires Node.js >= 18 and native build tools for `node-pty`.*

### 2. Basic Usage (The 3-Step Flow)

```typescript
import { AgentFactory, AgentRunner } from 'ai-cli-sdk';

async function main() {
  // 1. Create an Adapter (e.g., 'gemini' or 'mock')
  // The factory handles the specific CLI configuration for you.
  const factory = new AgentFactory();
  const adapter = factory.create('gemini'); 

  // 2. Initialize the Runner
  // The runner manages the process lifecycle and event streaming.
  const runner = new AgentRunner(adapter);

  // 3. Execute a Task
  // Pass your prompt and optional environment configuration.
  console.log("🚀 Starting task...");
  const result = await runner.execute("Write a Hello World function in TypeScript", {
    envAllowlist: ["GEMINI_API_KEY"] // Safely pass API keys
  });

  // Done!
  console.log("\n✨ Result:\n");
  console.log(result.cleanOutput);
}

main().catch(console.error);
```

---

## 📚 Core Concepts

### 1. AgentRunner ("The Engine")
The heart of the SDK. It manages the PTY process, cleans ANSI streams, and emits events. It doesn't care *which* AI is running, only that it follows the standard interface.

### 2. AgentFactory ("The Assembler")
A centralized registry to create pre-configured adapters.
*   `factory.create('gemini')`: Returns a stateless adapter for Gemini CLI.
*   `factory.create('mock')`: Returns a mock adapter for testing.

### 3. Adapters ("The Translators")
Each CLI tool has a specific adapter (e.g., `GeminiAdapter`) that translates your generic task into the specific command-line arguments (e.g., `gemini --prompt "..."`) required by that tool.

---

## 💡 Advanced Usage

### Event Streaming (Real-time UI)
Build custom dashboards or UIs by listening to events instead of waiting for the final result.

```typescript
runner.on('output', (data) => {
  process.stdout.write(data); // Stream colored output in real-time
});

runner.on('interaction', ({ prompt, response }) => {
  console.log(`🤖 AI Auto-replied to: "${prompt}" with "${response}"`);
});

await runner.execute("Analyze this project structure");
```

### Automation & Scripting
Use it to build automated workflows, like CI/CD code review bots.

```typescript
// Example: Automated Code Review
const diff = await getGitDiff(); // Your custom function
await runner.execute(`Review the following git diff for bugs:\n${diff}`, {
  cwd: process.cwd(),
  envAllowlist: ["API_KEY"]
});
```

---

## 🛠️ Development & Testing

This project uses `pnpm` and `vitest`.

```bash
# Install dependencies
pnpm install

# Run tests
npx vitest
```

**Troubleshooting `node-pty` on macOS:**
If you encounter `posix_spawnp failed`, ensure your terminal app has "Developer Tools" permissions in System Settings -> Privacy & Security.

## 📄 License

ISC