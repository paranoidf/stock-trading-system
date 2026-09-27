<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { apiRequest, ApiError, fetchSnapshot } from './services/api.js';
import { sessionStore } from './stores/session.js';
import AuthPanel from './components/AuthPanel.vue';
import MarketBoard from './components/MarketBoard.vue';
import TradeTicket from './components/TradeTicket.vue';
import OrderList from './components/OrderList.vue';
import PortfolioPanel from './components/PortfolioPanel.vue';
import TradeHistory from './components/TradeHistory.vue';
import { tradingStore } from './stores/trading.js';
import { createReconnectController, type ConnectionStatus } from './services/reconnect.js';

const loading = ref(true);
const message = ref('');
const connectionStatus = ref<ConnectionStatus>('stopped');
const connectionLabel = computed(() => ({
  connecting: '正在连接', connected: '已连接', reconnecting: '连接中断，正在重连', stopped: '已停止'
})[connectionStatus.value]);
let realtime: ReturnType<typeof createReconnectController> | undefined;

function stopRealtime() {
  realtime?.stop();
  realtime = undefined;
}

function connectRealtime() {
  if (realtime) return;
  realtime = createReconnectController({
    socketFactory: () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return new WebSocket(`${protocol}//${window.location.host}/ws`);
    },
    loadSnapshot: fetchSnapshot,
    checkSession: () => apiRequest('/api/session'),
    applySnapshot: sessionStore.applySnapshot,
    applyEvent: (event) => {
      if (event.type === 'market.updated') sessionStore.updateMarket(event.data);
      else void tradingStore.refresh();
    },
    onUnauthorized: () => {
      sessionStore.clear();
      realtime = undefined;
    },
    onStatus: (status) => { connectionStatus.value = status; }
  });
  realtime.start();
}

async function loadSnapshot() {
  try { sessionStore.applySnapshot(await fetchSnapshot()); }
  catch (error) {
    if (!(error instanceof ApiError && error.status === 401)) message.value = error instanceof Error ? error.message : '加载失败';
  }
}

async function reloadAfterAuthentication() {
  await loadSnapshot();
  connectRealtime();
}

async function logout() {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    stopRealtime();
    sessionStore.clear();
    message.value = '';
  } catch (error) {
    message.value = error instanceof Error ? error.message : '退出失败';
  }
}

onMounted(async () => {
  try {
    await loadSnapshot();
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401)) message.value = error instanceof Error ? error.message : '加载失败';
  } finally {
    loading.value = false;
    if (sessionStore.state.user) connectRealtime();
  }
});

onBeforeUnmount(stopRealtime);
</script>

<template>
  <main>
    <h1>股票模拟交易系统</h1>
    <p v-if="loading">正在加载…</p>
    <p v-else-if="message" role="alert">{{ message }}</p>
    <AuthPanel v-else-if="!sessionStore.state.user" @authenticated="reloadAfterAuthentication" />
    <template v-else>
      <div class="user-bar">
        <p>欢迎，{{ sessionStore.state.user.username }}</p>
        <button type="button" data-action="logout" @click="logout">退出</button>
      </div>
      <p class="connection-status" aria-live="polite">实时连接：{{ connectionLabel }}</p>
      <MarketBoard :quotes="sessionStore.state.market" />
      <div class="workspace-grid">
        <TradeTicket :symbols="sessionStore.state.market.map((quote) => quote.symbol)" :on-submit="tradingStore.placeOrder" />
        <OrderList :orders="sessionStore.state.orders" />
      </div>
      <PortfolioPanel v-if="sessionStore.state.portfolio" :portfolio="sessionStore.state.portfolio" />
      <TradeHistory :trades="sessionStore.state.trades" />
    </template>
  </main>
</template>
