// 真实界面截图驱动脚本（Chrome DevTools Protocol）
// 用法: node capture_shot.js <url> <out.png> [--chat|<question>|--empty]
// 示例:
//   node capture_shot.js http://127.0.0.1:8001/ docs/assets/chat.png "糖尿病患者日常饮食应该注意什么？"
//   node capture_shot.js http://127.0.0.1:8001/health docs/assets/health.png --raw
// --chat  发送推荐问题并等待流式回答完成后截图（用于 /chat 首页）
// --raw   导航后直接等待健康状态就绪再截图（用于 /health JSON 页）
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Chrome 可执行文件路径：可用环境变量 CHROME_PATH 覆盖
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;                 // 调试端口
const PROFILE = path.join(__dirname, '.shot_profile');

const [url, out] = [process.argv[2], process.argv[3]];
const isHealth = url.includes('/health');
const mode = isHealth ? 'raw' : (process.argv[4] === '--empty' ? 'empty' : 'chat');
const question = process.argv[4] && !process.argv[4].startsWith('--') ? process.argv[4] : '糖尿病患者日常饮食应该注意什么？';

function getJson(p) {
  return new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port: PORT, path: p }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } });
    }).on('error', rej);
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 启动 headless Chrome
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`,
  '--window-size=1500,1000', 'about:blank'
], { stdio: 'ignore' });

async function main() {
  // 等待调试端口就绪
  let target = null;
  for (let i = 0; i < 40; i++) {
    try {
      const list = await getJson('/json');
      target = list.find(t => t.type === 'page');
      if (target) break;
    } catch (_) {}
    await sleep(250);
  }
  if (!target) throw new Error('Chrome 调试端点不可用');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let seq = 0; const pending = new Map();
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  const cmd = (method, params = {}) => new Promise(res => {
    const id = ++seq; pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });

  // 等待页面就绪并导航
  await cmd('Page.enable'); await cmd('Runtime.enable');
  await cmd('Page.navigate', { url });
  await sleep(1800);

  // 等待健康状态加载完成（statusText 变为 服务在线 或 无法连接）
  async function evalJs(expr) {
    const r = await cmd('Runtime.evaluate', { expression: expr, returnByValue: true });
    return r.result && r.result.result && r.result.result.value;
  }
  let health = false;
  for (let i = 0; i < 60 && !health; i++) {
    await sleep(500);
    if (mode === 'raw') {
      // /health 为纯 JSON 页面：等待 body 文本出现即视为已加载
      const t = await evalJs("(document.body&&document.body.innerText&&document.body.innerText.length)||0");
      if (t > 0) health = true;
    } else {
      const st = await evalJs("(document.getElementById('statusText')||{}).textContent");
      if (st === '服务在线' || st === '无法连接服务') health = true;
    }
  }
  if (!health) throw new Error('健康状态未就绪');

  if (mode === 'chat') {
    // 填写问题并发起流式回答
    const q = question.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    await evalJs(`(document.getElementById('question').value='${q}')`);
    await evalJs(`document.getElementById('sendBtn').click()`);
    // 等待回答完成（发送按钮恢复可用 / 闪烁光标消失）
    for (let i = 0; i < 200; i++) {
      await sleep(500);
      const caret = await evalJs("!!document.querySelector('.msg.doctor .caret')");
      const disabled = await evalJs("document.getElementById('sendBtn').disabled");
      if (!caret && !disabled) break;
    }
    await sleep(600);
  } else if (mode === 'raw') {
    await sleep(800); // 等待 JSON 渲染完成
  }

  // 截图（ImageCapture 格式捕获完整视口）
  const shot = await cmd('Page.captureScreenshot', { format: 'png' });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  console.log('OK ' + out + ' mode=' + mode);
  ws.close();
}

main()
  .then(() => { chrome.kill(); process.exit(0); })
  .catch(e => { console.error('ERR', e.message); chrome.kill(); process.exit(1); });