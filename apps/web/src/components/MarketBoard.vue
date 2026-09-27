<script setup lang="ts">
import type { StockQuoteDto } from '@stock-trading/shared';

defineProps<{ quotes: readonly StockQuoteDto[] }>();
</script>

<template>
  <section class="panel" aria-labelledby="market-title">
    <h2 id="market-title">实时行情</h2>
    <div class="quote-grid">
      <article v-for="quote in quotes" :key="quote.symbol" class="quote-card">
        <div><strong>{{ quote.symbol }}</strong><span>{{ quote.name }}</span></div>
        <p class="price">{{ quote.price }}</p>
        <p :class="Number(quote.changePercent) >= 0 ? 'up' : 'down'">
          {{ quote.changePercent }}%
        </p>
      </article>
    </div>
  </section>
</template>
