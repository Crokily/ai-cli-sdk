# AI-CLI-SDK

**Universal AI CLI Orchestrator for Node.js**

AI-CLI-SDK 是一个用于标准化调用各类 AI 辅助编程 CLI 工具（如 Claude Code, Gemini CLI, OpenAI Codex CLI 等）的统一包装器库。它通过 PTY（伪终端）模拟真实交互环境，解决了 CLI 工具对 TTY 的强依赖问题，并提供了统一的编程接口。

## 🚀 核心特性 (Features)

*   **统一接口 (Unified Interface)**: 无论底层是哪个 AI 工具，上层调用代码保持一致。
*   **环境隔离 (Environment Isolation)**: 基于 `node-pty` 模拟真实终端，完美支持彩色输出和交互式 CLI。
*   **智能交互 (Smart Interaction)**: 内置自动应答机制，可自动处理 "Confirm? (y/n)" 等常见交互场景。
*   **类型安全 (Type Safe)**: 全量 TypeScript 编写，提供完整的类型定义。
*   **可扩展架构 (Extensible)**: 基于适配器模式，轻松扩展新的 AI CLI 支持。

## 📦 安装 (Installation)

暂无安装需求，直接引入即可。

## ⚡ 快速开始 (Quick Start)

```typescript
import { AgentFactory, AgentRunner } from 'ai-cli-sdk';

async function main() {
  // 1. 创建工厂
  const factory = new AgentFactory();

  // 2. 创建适配器 (目前支持: 'mock', 'gemini')
  const adapter = factory.create('mock');

  // 3. 初始化运行器
  const runner = new AgentRunner(adapter);

  // 4. 监听事件
  runner.on('output', (data) => {
    process.stdout.write(data); // 实时打印彩色输出
  });

  runner.on('interaction', ({ prompt, response }) => {
    console.log(`\n🤖 Auto-replied to: "${prompt.trim()}" with "${response}"`);
  });

  runner.on('completed', (result) => {
    console.log('\n✨ Task Completed!');
    process.exit(0);
  });

  // 5. 执行任务
  await runner.execute('Refactor login function');
}

main().catch(console.error);
```

## 🛠️ 开发与测试 (Development)

本项目使用 `vitest` 进行测试。由于依赖原生模块 `node-pty`，请确保您的开发环境具备编译工具链。

### 前置要求
*   Node.js >= 18
*   Python (for node-gyp)
*   Xcode Command Line Tools (macOS) / build-essential (Linux)

### 运行测试
```bash
# 运行单元测试与集成测试
npm test
```

## ❓ 常见问题 (Troubleshooting)

### Error: posix_spawnp failed.

如果在 macOS 上运行测试时遇到此错误，通常是因为 `node-pty` 的辅助二进制文件缺少执行权限，或者是终端应用未获得“开发者工具”权限。

**解决方案 1 (权限修复):**
检查并赋予 spawn-helper 执行权限：
```bash
chmod +x node_modules/node-pty/prebuilds/darwin-arm64/spawn-helper
```

**解决方案 2 (系统设置):**
前往 **系统设置** -> **隐私与安全性** -> **开发者工具**，添加您的终端应用（如 iTerm2 或 VSCode）。

## 📄 License

ISC
