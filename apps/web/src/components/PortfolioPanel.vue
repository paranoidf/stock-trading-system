<script setup lang="ts">
import type { PortfolioDto } from '@stock-trading/shared';
defineProps<{ portfolio: PortfolioDto }>();
</script>

<template>
  <section class="panel"><h2>账户概览</h2>
    <div class="metrics"><p>可用现金 <strong>{{ portfolio.availableCash }}</strong></p><p>冻结现金 <strong>{{ portfolio.reservedCash }}</strong></p><p>总资产 <strong>{{ portfolio.totalAssets }}</strong></p></div>
    <div class="table-wrap"><table><thead><tr><th>股票</th><th>总量</th><th>可用</th><th>冻结</th><th>平均成本</th><th>市值</th></tr></thead>
      <tbody><tr v-for="position in portfolio.positions" :key="position.symbol"><td>{{ position.symbol }}</td><td>{{ position.quantity }}</td><td>{{ position.availableQuantity }}</td><td>冻结 {{ position.reservedQuantity }}</td><td>{{ position.averageCost }}</td><td>{{ position.marketValue }}</td></tr></tbody>
    </table></div>
  </section>
</template>
