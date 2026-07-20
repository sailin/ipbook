import { Host, HostReport } from '~/server/models'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const name = getRouterParam(event, 'name')
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Hostname required' })

  const hostname = name.toLowerCase()

  // Remove from whitelist
  await Host.deleteOne({ hostname })

  // Optionally keep or delete history — let's keep it so re-adding preserves history
  // await HostReport.deleteMany({ hostname })

  return { success: true, hostname }
})
