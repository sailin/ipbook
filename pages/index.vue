<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Nav -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-bold text-gray-800">📡 IP Book</h1>
        </div>
        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="text-sm text-gray-600 hover:text-gray-900">Dashboard</NuxtLink>
          <NuxtLink v-if="auth.authState.value.authenticated" to="/admin" class="text-sm text-gray-600 hover:text-gray-900">Admin</NuxtLink>
          <button
            v-if="auth.authState.value.authenticated"
            @click="doLogout"
            class="text-sm text-red-600 hover:text-red-800"
          >
            Logout ({{ auth.authState.value.username }})
          </button>
          <NuxtLink v-else to="/login" class="text-sm text-blue-600 hover:text-blue-800">Login</NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <!-- Host List -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Whitelisted Hosts</h2>
          <button
            @click="refresh"
            class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>

        <div v-if="loading" class="text-gray-500">Loading...</div>

        <div v-else-if="hosts.length === 0" class="text-gray-500">
          No hosts whitelisted yet. <NuxtLink to="/admin" class="text-blue-600 underline">Add some in Admin.</NuxtLink>
        </div>

        <table v-else class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-gray-600">
              <th class="py-2 pr-4">Hostname</th>
              <th class="py-2 pr-4">Current IP</th>
              <th class="py-2 pr-4">Last Seen</th>
              <th class="py-2">History</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="host in hosts"
              :key="host.hostname"
              @click="selectHost(host.hostname)"
              class="border-b hover:bg-gray-50 cursor-pointer"
              :class="{ 'bg-blue-50': selectedHost === host.hostname }"
            >
              <td class="py-2 pr-4 font-medium">{{ host.hostname }}</td>
              <td class="py-2 pr-4 font-mono">{{ host.currentIp || '-' }}</td>
              <td class="py-2 pr-4 text-gray-500">{{ formatDate(host.lastSeen) }}</td>
              <td class="py-2">{{ host.historyCount }} entries</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Timeline -->
      <div v-if="selectedHost" class="bg-white rounded-lg shadow p-6 mt-6">
        <h2 class="text-lg font-semibold mb-4">IP History: {{ selectedHost }}</h2>

        <div v-if="historyLoading" class="text-gray-500">Loading history...</div>

        <div v-else-if="history.length === 0" class="text-gray-500">
          No history recorded yet for this host.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(entry, idx) in history"
            :key="idx"
            class="flex items-start gap-4 border-l-2 border-blue-300 pl-4 pb-3"
            :class="{ 'border-green-400': idx === 0 }"
          >
            <div class="flex-1">
              <div class="font-mono text-lg font-semibold text-blue-700">{{ entry.ip }}</div>
              <div class="text-sm text-gray-500 mt-1">
                First seen: {{ formatDate(entry.firstSeen) }}
                <span v-if="entry.firstSeen !== entry.lastSeen">
                  · Last seen: {{ formatDate(entry.lastSeen) }}
                </span>
              </div>
              <div class="text-sm mt-0.5">
                <span class="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                  {{ entry.timeSpanDays.toFixed(1) }} days
                </span>
                <span v-if="idx === 0" class="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                  Current
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Unknown Hosts -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Other Reported Hosts</h2>
          <button @click="loadUnknown" class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            Refresh
          </button>
        </div>

        <div v-if="unknownLoading" class="text-gray-500">Loading...</div>

        <div v-else-if="unknownHosts.length === 0" class="text-sm text-gray-400">
          No other hosts have reported yet.
        </div>

        <table v-else class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-gray-600">
              <th class="py-2 pr-4">Hostname</th>
              <th class="py-2 pr-4">Last IP</th>
              <th class="py-2 pr-4">Last Seen</th>
              <th class="py-2">Reports</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in unknownHosts" :key="u.hostname" class="border-b">
              <td class="py-2 pr-4 font-medium">{{ u.hostname }}</td>
              <td class="py-2 pr-4 font-mono">{{ u.lastIp }}</td>
              <td class="py-2 pr-4 text-gray-500">{{ formatDate(u.lastSeen) }}</td>
              <td class="py-2">{{ u.count }}</td>
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
const hosts = ref<any[]>([])
const loading = ref(true)
const selectedHost = ref<string | null>(null)
const history = ref<any[]>([])
const historyLoading = ref(false)
const unknownHosts = ref<any[]>([])
const unknownLoading = ref(false)

async function refresh() {
  loading.value = true
  try {
    const data = await $fetch('/api/hosts')
    hosts.value = data
  } catch (err) {
    console.error('Failed to load hosts:', err)
  } finally {
    loading.value = false
  }
}

async function loadUnknown() {
  unknownLoading.value = true
  try {
    unknownHosts.value = await $fetch('/api/unknown')
  } catch (err) {
    console.error('Failed to load unknown hosts:', err)
  } finally {
    unknownLoading.value = false
  }
}

async function selectHost(hostname: string) {
  selectedHost.value = hostname
  historyLoading.value = true
  try {
    const data = await $fetch(`/api/hosts/${hostname}/history`)
    history.value = data
  } catch (err) {
    console.error('Failed to load history:', err)
    history.value = []
  } finally {
    historyLoading.value = false
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString()
}

async function doLogout() {
  await auth.logout()
  router.push('/login')
}

onMounted(() => {
  refresh()
  loadUnknown()
})
</script>
