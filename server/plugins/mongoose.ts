import mongoose from 'mongoose'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()

  try {
    await mongoose.connect(config.mongoUri)
    console.log('[ipbook] MongoDB connected:', config.mongoUri)
  } catch (err) {
    console.error('[ipbook] MongoDB connection failed:', err)
  }
})
