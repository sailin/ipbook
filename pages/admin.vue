<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-bold text-gray-800">📡 IP Book</h1>
          <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Admin</span>
        </div>
        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="text-sm text-gray-600 hover:text-gray-900">Dashboard</NuxtLink>
          <button @click="doLogout" class="text-sm text-red-600 hover:text-red-800">Logout</button>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <!-- Whitelist Management -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4">Add Host to Whitelist</h2>
        <form @submit.prevent="addHost" class="flex gap-3">
          <input
            v-model="newHostname"
            type="text"
            required
            placeholder="e.g. my-vm-01"
            class="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            :disabled="adding"
            class="px-4 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {{ adding ? 'Adding...' : 'Add' }}
          </button>
        </form>
        <div v-if="addMsg" class="mt-2 text-sm" :class="addMsgType">{{ addMsg }}</div>

        <!-- Whitelisted hosts -->
        <div class="mt-6">
          <h3 class="text-sm font-semibold text-gray-600 mb-2">Whitelisted Hosts</h3>
          <div v-if="whitelisted.length === 0" class="text-sm text-gray-400">None yet.</div>
          <table v-else class="w-full text-sm">
            <thead>
              <tr class="border-b text-left text-gray-600">
                <th class="py-2 pr-4">Hostname</th>
                <th class="py-2">Added</th>
                <th class="py-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="h in whitelisted" :key="h.hostname" class="border-b">
                <td class="py-2 pr-4 font-medium font-mono">{{ h.hostname }}</td>
                <td class="py-2 text-gray-500">{{ formatDate(h.createdAt) }}</td>
                <td class="py-2 text-right">
                  <button
                    @click="removeHost(h.hostname)"
                    class="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Unknown Hosts -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Unknown Hosts (not whitelisted)</h2>
          <button
            @click="loadUnknown"
            class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Refresh
          </button>
        </div>

        <div v-if="unknownLoading" class="text-sm text-gray-500">Loading...</div>

        <div v-else-if="unknownHosts.length === 0" class="text-sm text-gray-400">
          No unknown hosts recorded.
        </div>

        <table v-else class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-gray-600">
              <th class="py-2 pr-4">Hostname</th>
              <th class="py-2 pr-4">Last IP</th>
              <th class="py-2 pr-4">Last Seen</th>
              <th class="py-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in unknownHosts" :key="u.hostname" class="border-b">
              <td class="py-2 pr-4 font-medium">{{ u.hostname }}</td>
              <td class="py-2 pr-4 font-mono text-sm">{{ u.lastIp }}</td>
              <td class="py-2 pr-4 text-gray-500">{{ formatDate(u.lastSeen) }}</td>
              <td class="py-2 text-right">
                <button
                  @click="whitelistUnknown(u.hostname)"
                  class="text-xs text-blue-600 hover:text-blue-800"
                >
                  Whitelist
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({ middleware: 'auth' })

const auth = useAuth()
const router = useRouter()

const newHostname = ref('')
const adding = ref(false)
const addMsg = ref('')
const addMsgType = ref('text-green-600')

const whitelisted = ref<any[]>([])
const unknownHosts = ref<any[]>([])
const unknownLoading = ref(false)

async function loadWhitelisted() {
  try {
    const data = await $fetch('/api/hosts')
    whitelisted.value = data
  } catch (err) {
    console.error('Failed to load whitelisted:', err)
  }
}

async function loadUnknown() {
  unknownLoading.value = true
  try {
    unknownHosts.value = await $fetch('/api/unknown')
  } catch (err) {
    console.error('Failed to load unknown:', err)
  } finally {
    unknownLoading.value = false
  }
}

async function addHost() {
  adding.value = true
  addMsg.value = ''
  try {
    const res = await $fetch<{ success: boolean; created: boolean; hostname: string }>('/api/hosts', {
      method: 'POST',
      body: { hostname: newHostname.value }
    })
    if (res.created) {
      addMsg.value = `"${res.hostname}" added to whitelist.`
      addMsgType.value = 'text-green-600'
    } else {
      addMsg.value = `"${res.hostname}" is already whitelisted.`
      addMsgType.value = 'text-yellow-600'
    }
    newHostname.value = ''
    await loadWhitelisted()
    await loadUnknown()
  } catch (err: any) {
    addMsg.value = err?.statusMessage || 'Failed to add host'
    addMsgType.value = 'text-red-600'
  } finally {
    adding.value = false
  }
}

async function removeHost(hostname: string) {
  try {
    await $fetch(`/api/hosts/${hostname}`, { method: 'DELETE' })
    await loadWhitelisted()
  } catch (err) {
    console.error('Failed to remove host:', err)
  }
}

async function whitelistUnknown(hostname: string) {
  try {
    await $fetch('/api/hosts', { method: 'POST', body: { hostname } })
    await Promise.all([loadWhitelisted(), loadUnknown()])
  } catch (err) {
    console.error('Failed to whitelist:', err)
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

async function doLogout() {
  await auth.logout()
  router.push('/login')
}

onMounted(() => {
  loadWhitelisted()
  loadUnknown()
})
</script>
