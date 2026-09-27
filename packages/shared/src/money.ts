const MONEY_PATTERN = /^(0|[1-9]\d*)\.\d{2}$/;

export function parseMoney(value: string): number {
  if (!MONEY_PATTERN.test(value)) {
    throw new Error('金额格式无效');
  }
  const [units, cents] = value.split('.');
  const result = Number(units) * 100 + Number(cents);
  if (!Number.isSafeInteger(result)) {
    throw new Error('金额超出安全范围');
  }
  return result;
}

export function formatMoney(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error('金额必须是非负安全整数');
  }
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}
