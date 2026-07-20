import { Host } from '~/server/models'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const body = await readBody(event)
  const { hostname } = body || {}

  if (!hostname || typeof hostname !== 'string' || hostname.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Hostname required' })
  }

  const normalized = hostname.trim().toLowerCase()

  const existing = await Host.findOne({ hostname: normalized })
  if (existing) {
    return { success: true, hostname: normalized, created: false, message: 'Already whitelisted' }
  }

  await Host.create({ hostname: normalized })
  return { success: true, hostname: normalized, created: true }
})
