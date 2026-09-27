import { expect, test, type Page } from '@playwright/test';

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('401 (Unauthorized)')) errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`); });
  return errors;
}

async function register(page: Page, username: string) {
  await page.goto('/');
  await page.getByLabel('用户名').fill(username);
  await page.getByLabel('密码').fill('password123');
  await page.getByRole('button', { name: '注册' }).click();
  await expect(page.getByText('实时连接：已连接')).toBeVisible();
}

test('恢复：断线期间成交后重连快照和刷新会话完整恢复', async ({ browser }) => {
  const sellerContext = await browser.newContext();
  const buyerContext = await browser.newContext();
  const seller = await sellerContext.newPage();
  const buyer = await buyerContext.newPage();
  const sellerErrors = watchErrors(seller);
  const buyerErrors = watchErrors(buyer);
  const suffix = Date.now().toString(36);
  await register(seller, `recover_s_${suffix}`);
  await register(buyer, `recover_b_${suffix}`);

  await seller.getByLabel('方向').selectOption('sell');
  await seller.getByLabel('限价', { exact: true }).fill('120.00');
  await seller.getByLabel('数量').fill('5');
  await seller.getByRole('button', { name: '提交委托' }).click();
  await expect(seller.getByRole('row').filter({ hasText: '卖出' })).toContainText('open');
  await sellerContext.setOffline(true);

  await buyer.getByLabel('方向').selectOption('buy');
  await buyer.getByLabel('限价', { exact: true }).fill('121.00');
  await buyer.getByLabel('数量').fill('5');
  await buyer.getByRole('button', { name: '提交委托' }).click();
  const buyerOrders = buyer.locator('section').filter({ has: buyer.getByRole('heading', { name: '我的委托' }) });
  await expect(buyerOrders.getByRole('row').filter({ hasText: '买入' })).toContainText('filled');

  await sellerContext.setOffline(false);
  await expect(seller.getByText('实时连接：已连接')).toBeVisible({ timeout: 15_000 });
  const sellerOrders = seller.locator('section').filter({ has: seller.getByRole('heading', { name: '我的委托' }) });
  await expect(sellerOrders.getByRole('row').filter({ hasText: '卖出' })).toContainText('filled');
  await expect(seller.locator('section').filter({ hasText: '最近成交' }).getByRole('row').filter({ hasText: 'AAPL' })).toContainText('120.00');
  await seller.reload();
  await expect(seller.getByText(/欢迎，recover_s_/)).toBeVisible();
  await expect(seller.locator('section').filter({ has: seller.getByRole('heading', { name: '我的委托' }) }).getByRole('row').filter({ hasText: '卖出' })).toContainText('filled');
  await seller.screenshot({ path: 'output/playwright/reconnect-final.png', fullPage: true });
  expect(sellerErrors).toEqual([]);
  expect(buyerErrors).toEqual([]);
  await sellerContext.close();
  await buyerContext.close();
});
