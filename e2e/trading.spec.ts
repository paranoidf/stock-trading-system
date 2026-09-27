import { expect, test } from '@playwright/test';

async function register(page: import('@playwright/test').Page, username: string) {
  await page.goto('/');
  await page.getByLabel('用户名').fill(username);
  await page.getByLabel('密码').fill('password123');
  await page.getByRole('button', { name: '注册' }).click();
  await expect(page.getByText(`欢迎，${username}`)).toBeVisible();
  await expect(page.getByText('实时连接：已连接')).toBeVisible();
}

test('双用户撮合：种子持仓卖出并由另一用户交叉买入', async ({ browser }) => {
  const sellerContext = await browser.newContext();
  const buyerContext = await browser.newContext();
  const seller = await sellerContext.newPage();
  const buyer = await buyerContext.newPage();
  const suffix = Date.now().toString(36);
  await register(seller, `seller_${suffix}`);
  await register(buyer, `buyer_${suffix}`);

  for (const page of [seller, buyer]) {
    const account = page.locator('section').filter({ has: page.getByRole('heading', { name: '账户概览' }) });
    await expect(account.getByText('1000000.00', { exact: true }).first()).toBeVisible();
    await expect(account.getByRole('row').filter({ hasText: 'AAPL' })).toContainText('1000');
  }

  await seller.getByLabel('方向').selectOption('sell');
  await seller.getByLabel('限价', { exact: true }).fill('100.00');
  await seller.getByLabel('数量').fill('10');
  await seller.getByRole('button', { name: '提交委托' }).click();
  await expect(seller.getByRole('row').filter({ hasText: 'AAPL' }).filter({ hasText: '卖出' })).toContainText('open');

  await buyer.getByLabel('方向').selectOption('buy');
  await buyer.getByLabel('限价', { exact: true }).fill('101.00');
  await buyer.getByLabel('数量').fill('10');
  await buyer.getByRole('button', { name: '提交委托' }).click();

  for (const page of [seller, buyer]) {
    await expect(page.getByRole('row').filter({ hasText: 'AAPL' }).filter({ hasText: /买入|卖出/ }).first()).toContainText('filled');
    const trades = page.locator('section').filter({ has: page.getByRole('heading', { name: '最近成交' }) });
    await expect(trades.getByRole('row').filter({ hasText: 'AAPL' })).toContainText('100.00');
    await expect(trades.getByRole('row').filter({ hasText: 'AAPL' })).toContainText('10');
  }
  const sellerAccount = seller.locator('section').filter({ has: seller.getByRole('heading', { name: '账户概览' }) });
  const buyerAccount = buyer.locator('section').filter({ has: buyer.getByRole('heading', { name: '账户概览' }) });
  await expect(sellerAccount.getByText('1001000.00', { exact: true })).toBeVisible();
  await expect(buyerAccount.getByText('999000.00', { exact: true })).toBeVisible();
  await expect(sellerAccount.getByRole('row').filter({ hasText: 'AAPL' })).toContainText('990');
  await expect(buyerAccount.getByRole('row').filter({ hasText: 'AAPL' })).toContainText('1010');

  await seller.screenshot({ path: 'output/playwright/seller-final.png', fullPage: true });
  await buyer.screenshot({ path: 'output/playwright/buyer-final.png', fullPage: true });
  await sellerContext.close();
  await buyerContext.close();
});
