import { ref, onMounted } from 'vue'

interface AuthState {
  authenticated: boolean
  username: string | null
}

const authState = ref<AuthState>({ authenticated: false, username: null })
const loading = ref(true)

export function useAuth() {
  async function checkSession() {
    try {
      const res = await $fetch<AuthState>('/api/auth/session')
      authState.value = res
    } catch {
      authState.value = { authenticated: false, username: null }
    } finally {
      loading.value = false
    }
  }

  async function login(username: string, password: string) {
    const res = await $fetch<{ success: boolean; username: string }>('/api/auth/login', {
      method: 'POST',
      body: { username, password }
    })
    authState.value = { authenticated: true, username: res.username }
    return res
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    authState.value = { authenticated: false, username: null }
  }

  // Auto-check on mount
  if (loading.value) {
    checkSession()
  }

  return {
    authState,
    loading,
    checkSession,
    login,
    logout
  }
}
