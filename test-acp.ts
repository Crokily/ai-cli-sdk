import { spawn } from 'node:child_process';

async function testAcp() {
  console.log('--- 启动 Gemini ACP 模式 ---');

  // 1. 启动进程
  // 使用 --experimental-acp 开启协议模式
  const child = spawn('gemini', ['--experimental-acp'], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  // 2. 监听输出并尝试解析
  child.stdout.on('data', (data) => {
    const raw = data.toString();
    console.log('\n[收到原始响应]:');
    console.log(raw);
    
    try {
      const parsed = JSON.parse(raw);
      console.log('[解析成功]:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('[解析失败]: 输出可能不是纯 JSON 或包含多条消息');
    }
  });

  // 3. 构造标准 ACP 初始化请求 (严格对齐搜寻到的规范)
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: 1,
      clientCapabilities: {
        roots: { listChanged: true },
        sampling: {},
        fs: {
           readTextFile: true,
           writeTextFile: true
        }
      },
      clientInfo: {
        name: 'ai-cli-sdk-test',
        version: '1.0.0'
      }
    }
  };

  // 4. 发送请求 (ACP 规定每条消息以换行符分隔)
  const message = JSON.stringify(initRequest) + '\n';
  console.log('[发送请求]:', message.trim());
  child.stdin.write(message);

  // 5. 等待一段时间观察后续输出（如自动发送的消息）
  setTimeout(() => {
    console.log('\n--- 测试超时结束 ---');
    child.kill();
    process.exit(0);
  }, 5000);
}

testAcp().catch(console.error);
