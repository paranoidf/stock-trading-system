import WebSocket from 'ws';

const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:3000';
const health = await fetch(`${baseUrl}/api/health`);
if (!health.ok || (await health.json()).status !== 'ok') throw new Error('容器健康端点验证失败');
const page = await fetch(`${baseUrl}/`);
if (!page.ok || !(await page.text()).includes('股票模拟交易系统')) throw new Error('容器页面入口验证失败');

const register = await fetch(`${baseUrl}/api/auth/register`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ username: `smoke_${Date.now()}`, password: 'password123' })
});
if (register.status !== 201) throw new Error(`容器注册验证失败：${register.status}`);
const cookie = register.headers.getSetCookie()[0]?.split(';')[0];
if (!cookie) throw new Error('容器注册响应缺少 Cookie');

const websocketUrl = baseUrl.replace(/^http/, 'ws');
const socket = new WebSocket(`${websocketUrl}/ws`, { headers: { Cookie: cookie } });
const event = await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('等待容器 WebSocket 行情事件超时')), 5000);
  socket.once('error', reject);
  socket.on('message', (data) => {
    const value = JSON.parse(data.toString());
    if (value.type === 'market.updated') {
      clearTimeout(timeout);
      resolve(value);
    }
  });
});
socket.close();
if (event.version !== 1 || !Array.isArray(event.data) || event.data.length < 3) throw new Error('容器 WebSocket 事件格式错误');
console.log(JSON.stringify({ health: 'ok', page: 200, register: 201, websocket: event.type }));
