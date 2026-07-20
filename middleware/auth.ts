export default defineNuxtRouteMiddleware(async () => {
  // Check session on server side
  const { data } = await useFetch('/api/auth/session')
  if (!data.value?.authenticated) {
    return navigateTo('/login')
  }
})
