import { access, readFile } from 'node:fs/promises';

const requiredFiles = [
  'README.md', 'SPEC.md', 'CAPABILITY_MAP.md', 'PROMPTS.md', 'tasks/plan.md', 'tasks/todo.md',
  'docs/architecture-decisions.md', 'docs/verification.md'
];
await Promise.all(requiredFiles.map((file) => access(file)));

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const readme = await readFile('README.md', 'utf8');
const requiredScripts = [
  'dev', 'lint', 'typecheck', 'test:unit', 'test:integration', 'test:coverage',
  'test:e2e', 'build', 'start', 'test:production', 'test:container-smoke', 'docs:check'
];
for (const script of requiredScripts) {
  if (!packageJson.scripts?.[script]) throw new Error(`package.json 缺少脚本：${script}`);
  if (!readme.includes(`npm run ${script}`) && !['start', 'test'].includes(script)) {
    throw new Error(`README.md 未记录命令：npm run ${script}`);
  }
}
for (const phrase of ['1,000,000.00', '1,000 股', '禁止裸卖空', '行情模拟器只更新行情', '进程重启后']) {
  if (!readme.includes(phrase)) throw new Error(`README.md 缺少关键说明：${phrase}`);
}
console.log(`文档检查通过：${requiredFiles.length} 个必需文件、${requiredScripts.length} 个命令入口。`);
