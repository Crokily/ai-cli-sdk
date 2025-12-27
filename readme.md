# AI-CLI-SDK

**Universal AI CLI Orchestrator for Node.js**

[English] | [中文]

---

## English

AI-CLI-SDK is a unified wrapper library designed to orchestrate various AI-powered CLI tools (like Gemini CLI, Claude Code, etc.) through a standardized interface.

Think of it as a **"Universal Remote Control"** for AI CLIs. It handles the details of PTY (pseudo-terminal) management, ANSI color preservation, and process lifecycle, letting you focus on **"Input Task -> Get Result"**.

### Key Features

*   **Unified Interface**: One code to rule them all. Switch between Gemini, Claude, or Mock agents without changing your logic.
*   **Environment Isolation**: Runs CLIs inside a `node-pty` sandbox, simulating a real terminal to preserve colored output and rich formatting.
*   **Smart Interactions**: Automatically handles TTY prompts (like confirmation dialogs) to prevent your automation from hanging.
*   **Type-Safe**: Written in strict TypeScript with comprehensive type definitions.

### Quick Start

#### 1. Installation
```bash
npm install ai-cli-sdk
# or
pnpm add ai-cli-sdk
```
*Note: Requires Node.js >= 18 and native build tools for `node-pty`.*

#### 2. Basic Usage (The 3-Step Flow)

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
  console.log("Starting task...");
  const result = await runner.execute("Write a Hello World function in TypeScript", {
    envAllowlist: ["GEMINI_API_KEY"] // Safely pass API keys
  });

  // Done!
  console.log("\nResult:\n");
  console.log(result.cleanOutput);
}

main().catch(console.error);
```

### Core Concepts

#### 1. AgentRunner ("The Engine")
The heart of the SDK. It manages the PTY process, cleans ANSI streams, and emits events. It doesn't care *which* AI is running, only that it follows the standard interface.

#### 2. AgentFactory ("The Assembler")
A centralized registry to create pre-configured adapters.
*   `factory.create('gemini')`: Returns a stateless adapter for Gemini CLI.
*   `factory.create('mock')`: Returns a mock adapter for testing.

#### 3. Adapters ("The Translators")
Each CLI tool has a specific adapter (e.g., `GeminiAdapter`) that translates your generic task into the specific command-line arguments (e.g., `gemini --prompt "..."`) required by that tool.

### Advanced Usage

#### Event Streaming (Real-time UI)
Build custom dashboards or UIs by listening to events instead of waiting for the final result.

```typescript
runner.on('output', (data) => {
  process.stdout.write(data); // Stream colored output in real-time
});

runner.on('interaction', ({ prompt, response }) => {
  console.log(`AI Auto-replied to: "${prompt}" with "${response}"`);
});

await runner.execute("Analyze this project structure");
```

#### Automation & Scripting
Use it to build automated workflows, like CI/CD code review bots.

```typescript
// Example: Automated Code Review
const diff = await getGitDiff(); // Your custom function
await runner.execute(`Review the following git diff for bugs:\n${diff}`, {
  cwd: process.cwd(),
  envAllowlist: ["API_KEY"]
});
```

### Development & Testing

This project uses `pnpm` and `vitest`.

```bash
# Install dependencies
pnpm install

# Run tests
npx vitest
```

**Troubleshooting `node-pty` on macOS:**
If you encounter `posix_spawnp failed`, ensure your terminal app has "Developer Tools" permissions in System Settings -> Privacy & Security.

### License

ISC

---

## 中文 (Chinese)

AI-CLI-SDK 是一个用于标准化调用各类 AI 辅助编程 CLI 工具（如 Gemini CLI, Claude Code 等）的统一包装器库。

您可以把它想象成 AI CLI 的 **“万能遥控器”**。它为您处理了 PTY（伪终端）管理、ANSI 颜色保留和进程生命周期等底层细节，让您只需关注 **“输入任务 -> 获取结果”**。

### 核心特性

*   **统一接口**: 一套代码通用。无需修改逻辑即可在 Gemini, Claude 或 Mock 代理之间切换。
*   **环境隔离**: 在 `node-pty` 沙盒中运行 CLI，模拟真实终端以保留彩色输出和丰富格式。
*   **智能交互**: 自动处理 TTY 提示（如确认对话框），防止自动化任务卡死。
*   **类型安全**: 全量 TypeScript 编写，提供完整的类型定义。

### 快速开始

#### 1. 安装
```bash
npm install ai-cli-sdk
# 或
pnpm add ai-cli-sdk
```
*注意: 需要 Node.js >= 18 以及用于编译 `node-pty` 的原生构建工具。*

#### 2. 基础用法 (标准3步走)

```typescript
import { AgentFactory, AgentRunner } from 'ai-cli-sdk';

async function main() {
  // 1. 创建适配器 (例如: 'gemini' 或 'mock')
  // 工厂为您处理具体的 CLI 配置。
  const factory = new AgentFactory();
  const adapter = factory.create('gemini'); 

  // 2. 初始化运行器
  // 运行器管理进程生命周期和事件流。
  const runner = new AgentRunner(adapter);

  // 3. 执行任务
  // 传入您的提示词和可选的环境配置。
  console.log("开始执行任务...");
  const result = await runner.execute("用 TypeScript 写一个 Hello World 函数", {
    envAllowlist: ["GEMINI_API_KEY"] // 安全地传递 API Key
  });

  // 完成!
  console.log("\n结果:\n");
  console.log(result.cleanOutput);
}

main().catch(console.error);
```

### 核心概念

#### 1. AgentRunner ("引擎")
SDK 的心脏。它管理 PTY 进程，清洗 ANSI 流并分发事件。它不关心具体运行的是哪个 AI，只关心它是否遵循了标准接口。

#### 2. AgentFactory ("组装厂")
用于创建预配置适配器的中心注册表。
*   `factory.create('gemini')`: 返回 Gemini CLI 的无状态适配器。
*   `factory.create('mock')`: 返回用于测试的模拟适配器。

#### 3. Adapters ("翻译官")
每个 CLI 工具都有一个特定的适配器（如 `GeminiAdapter`），它将您的通用任务翻译成该工具所需的特定命令行参数（如 `gemini --prompt "..."`）。

### 进阶用法

#### 事件流 (实时 UI)
通过监听事件而不是等待最终结果，构建自定义仪表板或 UI。

```typescript
runner.on('output', (data) => {
  process.stdout.write(data); // 实时流式传输彩色输出
});

runner.on('interaction', ({ prompt, response }) => {
  console.log(`AI 自动回复了: "${prompt}" 内容: "${response}"`);
});

await runner.execute("分析当前项目结构");
```

#### 自动化与脚本
利用它构建自动化工作流，例如 CI/CD 代码审查机器人。

```typescript
// 示例: 自动化代码审查
const diff = await getGitDiff(); // 您的自定义函数
await runner.execute(`审查以下 git diff 中的 bug:\n${diff}`, {
  cwd: process.cwd(),
  envAllowlist: ["API_KEY"]
});
```

### 开发与测试

本项目使用 `pnpm` 和 `vitest`。

```bash
# 安装依赖
pnpm install

# 运行测试
npx vitest
```

**macOS 上 `node-pty` 故障排除:**
如果遇到 `posix_spawnp failed` 错误，请确保您的终端应用在 系统设置 -> 隐私与安全性 中拥有 “开发者工具” 权限。

### 许可证

ISC
