<script setup lang="ts">
import type { TradeDto } from '@stock-trading/shared';
defineProps<{ trades: readonly TradeDto[] }>();
</script>

<template>
  <section class="panel"><h2>最近成交</h2><p v-if="trades.length === 0">暂无成交</p>
    <div v-else class="table-wrap"><table><thead><tr><th>股票</th><th>方向</th><th>价格</th><th>数量</th><th>时间</th></tr></thead>
      <tbody><tr v-for="trade in trades" :key="trade.id"><td>{{ trade.symbol }}</td><td>{{ trade.side === 'buy' ? '买入' : '卖出' }}</td><td>{{ trade.price }}</td><td>{{ trade.quantity }}</td><td>{{ new Date(trade.executedAt).toLocaleTimeString() }}</td></tr></tbody>
    </table></div>
  </section>
</template>
