<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="bg-white rounded-lg shadow p-8 w-full max-w-sm">
      <h1 class="text-xl font-bold mb-6 text-center">📡 IP Book — Login</h1>

      <form @submit.prevent="doLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            v-model="username"
            type="text"
            required
            class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="admin"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="password"
          />
        </div>

        <div v-if="error" class="text-sm text-red-600">{{ error }}</div>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full bg-blue-500 text-white py-2 rounded text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
        >
          {{ submitting ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <p class="text-xs text-gray-400 mt-4 text-center">
        First login with any credentials creates the admin account.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const username = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)
const auth = useAuth()
const router = useRouter()

async function doLogin() {
  submitting.value = true
  error.value = ''
  try {
    await auth.login(username.value, password.value)
    router.push('/')
  } catch (err: any) {
    error.value = err?.statusMessage || err?.message || 'Login failed'
  } finally {
    submitting.value = false
  }
}
</script>
