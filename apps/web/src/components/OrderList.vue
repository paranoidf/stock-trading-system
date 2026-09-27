<script setup lang="ts">
import type { OrderDto } from '@stock-trading/shared';
defineProps<{ orders: readonly OrderDto[] }>();
</script>

<template>
  <section class="panel"><h2>我的委托</h2>
    <p v-if="orders.length === 0">暂无委托</p>
    <div v-else class="table-wrap"><table><thead><tr><th>股票</th><th>方向</th><th>价格</th><th>原始/剩余</th><th>状态</th><th>时间</th></tr></thead>
      <tbody><tr v-for="order in orders" :key="order.id"><td>{{ order.symbol }}</td><td>{{ order.side === 'buy' ? '买入' : '卖出' }}</td><td>{{ order.price }}</td><td>{{ order.originalQuantity }}/{{ order.remainingQuantity }}</td><td>{{ order.status }}</td><td>{{ new Date(order.createdAt).toLocaleTimeString() }}</td></tr></tbody>
    </table></div>
  </section>
</template>
