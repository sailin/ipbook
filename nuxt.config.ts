// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  devServer: {
    host: '0.0.0.0'
  },
  runtimeConfig: {
    // Server-only env vars
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/ipbook',
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    // Public (exposed to client)
    public: {}
  }
})
