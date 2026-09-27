<script setup lang="ts">
import { ref } from 'vue';
import type { OrderSide } from '@stock-trading/shared';
import type { PlaceOrderRequest } from '../stores/trading.js';

const props = defineProps<{ symbols: readonly string[]; onSubmit: (order: PlaceOrderRequest) => Promise<void> }>();
const symbol = ref(props.symbols[0] ?? '');
const side = ref<OrderSide>('buy');
const price = ref('');
const quantity = ref(1);
const errorMessage = ref('');
const submitting = ref(false);

async function submit() {
  if (submitting.value) return;
  if (!/^\d+\.\d{2}$/.test(price.value) || !Number.isSafeInteger(quantity.value) || quantity.value <= 0) {
    errorMessage.value = '请输入两位小数价格和正整数数量';
    return;
  }
  submitting.value = true;
  errorMessage.value = '';
  try { await props.onSubmit({ symbol: symbol.value, side: side.value, price: price.value, quantity: quantity.value }); }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : '下单失败'; }
  finally { submitting.value = false; }
}
</script>

<template>
  <form class="panel trade-ticket" aria-labelledby="trade-ticket-title" @submit.prevent="submit">
    <h2 id="trade-ticket-title">限价委托</h2>
    <label>股票<select v-model="symbol" name="symbol"><option v-for="item in symbols" :key="item">{{ item }}</option></select></label>
    <label>方向<select v-model="side" name="side"><option value="buy">买入</option><option value="sell">卖出</option></select></label>
    <label>限价<input v-model="price" name="price" inputmode="decimal" placeholder="230.00"></label>
    <label>数量<input v-model.number="quantity" name="quantity" type="number" min="1" step="1"></label>
    <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>
    <button type="submit" :disabled="submitting">{{ submitting ? '提交中…' : '提交委托' }}</button>
  </form>
</template>
