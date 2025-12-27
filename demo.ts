import { AgentFactory, AgentRunner } from './src/index.js';

async function runNewsSearch() {
  const factory = new AgentFactory();
  
  // 明确使用 gemini 适配器
  const adapter = factory.create('gemini'); 
  const runner = new AgentRunner(adapter);

  const task = "参照目前的代码，我刚刚根据.dev/phase2-roadmap-discussion.md 和gemini cli的文档，完成了gemini adapter的开发，接下来该开发新的cli的adapter了，参照现有文档和新的cli codex cli的文档：https://developers.openai.com/codex/cli/ 写一个开发codex adapter的开发方案，并在同样的目录下新建一个 md文件存放方案";

  console.log(`--- 正在启动任务: ${task} ---`);

  // 实时显示 AI 的思考和搜索过程
  runner.on('output', (data: string) => {
    process.stdout.write(data);
  });

  // 如果 AI 需要确认执行搜索命令，Runner 会自动处理，这里可以打印记录
  runner.on('interaction', ({ prompt, response }: { prompt: string; response?: string }) => {
    console.log(`

[自动交互] 终端提示: "${prompt.trim()}" | SDK 自动回复: "${response ?? '(无回复)'}"
`);
  });

  try {
    const result = await runner.execute(task, {
      envAllowlist: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
      cwd: process.cwd(),
    });

    console.log("\n\n--- 任务最终完成 ---");
    console.log(`输出字符总数: ${result.cleanOutput.length}`);
    console.log(`状态: ${result.exitCode === 0 ? '成功' : '失败 (退出码 ' + result.exitCode + ')'}`);

  } catch (error) {
    console.error("\n运行报错:", error);
  }
}

runNewsSearch();
