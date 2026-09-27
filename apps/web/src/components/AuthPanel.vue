<script setup lang="ts">
import { ref } from 'vue';
import { apiRequest } from '../services/api.js';

const emit = defineEmits<{ authenticated: [payload: unknown] }>();
const username = ref('');
const password = ref('');
const errorMessage = ref('');
const submitting = ref(false);

async function submit(action: 'register' | 'login') {
  if (submitting.value) return;
  submitting.value = true;
  errorMessage.value = '';
  try {
    const payload = await apiRequest(`/api/auth/${action}`, {
      method: 'POST', body: JSON.stringify({ username: username.value, password: password.value })
    });
    emit('authenticated', payload);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '认证失败';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <form class="auth-card" aria-labelledby="auth-title" @submit.prevent="submit('login')">
    <h2 id="auth-title">开始模拟交易</h2>
    <label>用户名<input v-model="username" name="username" autocomplete="username"></label>
    <label>密码<input v-model="password" name="password" type="password" autocomplete="current-password"></label>
    <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>
    <div class="actions">
      <button type="submit" data-action="login" :disabled="submitting">登录</button>
      <button type="button" data-action="register" :disabled="submitting" @click="submit('register')">注册</button>
    </div>
  </form>
</template>
