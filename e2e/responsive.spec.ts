import { expect, test } from '@playwright/test';

test('窄屏：390px 下认证与核心交易控件无页面级横向溢出', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('401 (Unauthorized)')) errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const suffix = Date.now().toString(36);
  await page.getByLabel('用户名').fill(`mobile_${suffix}`);
  await page.getByLabel('密码').fill('password123');
  await page.getByRole('button', { name: '注册' }).click();
  await expect(page.getByRole('button', { name: '提交委托' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '账户概览' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'output/playwright/mobile-390.png', fullPage: true });
  expect(errors).toEqual([]);
  await context.close();
});
