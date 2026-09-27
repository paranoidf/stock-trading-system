import { createServer } from 'node:http';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const runtime = createApp();
const server = createServer(runtime.app);

server.listen(port, () => {
  console.log(`股票模拟交易系统运行于 http://localhost:${port}`);
});

function shutdown() {
  runtime.close();
  server.close(() => process.exit(0));
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
