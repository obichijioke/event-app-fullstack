# Sample: Svelte Store

```typescript
// stores/auth.ts
import { writable, derived } from 'svelte/store';
import { authService } from '../services/auth.service';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

const createAuthStore = () => {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    accessToken: localStorage.getItem('accessToken'),
    loading: false,
    error: null,
  });

  return {
    subscribe,
    login: async (credentials: LoginRequest) => {
      update((state) => ({ ...state, loading: true, error: null }));
      try {
        const response = await authService.login(credentials);
        set({
          user: response.user,
          accessToken: response.accessToken,
          loading: false,
          error: null,
        });
      } catch (error) {
        update((state) => ({
          ...state,
          loading: false,
          error: (error as Error).message,
        }));
      }
    },
    logout: async () => {
      await authService.logout();
      set({ user: null, accessToken: null, loading: false, error: null });
    },
  };
};

export const auth = createAuthStore();
export const isAuthenticated = derived(auth, ($auth) => !!$auth.accessToken);

// Component usage
<script lang="ts">
  import { auth } from './stores/auth';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';

  async function handleLogin() {
    await auth.login({ email, password });
    if ($auth.user) {
      goto('/dashboard');
    }
  }
</script>

<form on:submit|preventDefault={handleLogin}>
  <input bind:value={email} type="email" placeholder="Email" />
  <input bind:value={password} type="password" placeholder="Password" />
  <button type="submit" disabled={$auth.loading}>
    {$auth.loading ? 'Logging in...' : 'Login'}
  </button>
  {#if $auth.error}
    <p class="error">{$auth.error}</p>
  {/if}
</form>
```

