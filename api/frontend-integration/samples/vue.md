# Sample: Vue 3 Composition API

```typescript
// composables/useAuth.ts
import { ref, computed } from 'vue';
import { authService } from '@/services/auth.service';

const user = ref<User | null>(null);
const accessToken = ref<string | null>(null);

export const useAuth = () => {
  const isAuthenticated = computed(() => !!accessToken.value);

  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    user.value = response.user;
    accessToken.value = response.accessToken;
  };

  const logout = async () => {
    await authService.logout();
    user.value = null;
    accessToken.value = null;
  };

  const register = async (data: RegisterRequest) => {
    await authService.register(data);
  };

  return {
    user: computed(() => user.value),
    isAuthenticated,
    login,
    logout,
    register,
  };
};

// Component usage
<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useRouter } from 'vue-router';

const { login } = useAuth();
const router = useRouter();

const formData = ref({
  email: '',
  password: '',
});

const handleLogin = async () => {
  try {
    await login(formData.value);
    router.push('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
  }
};
</script>

<template>
  <form @submit.prevent="handleLogin">
    <input v-model="formData.email" type="email" placeholder="Email" />
    <input v-model="formData.password" type="password" placeholder="Password" />
    <button type="submit">Login</button>
  </form>
  </template>
```

