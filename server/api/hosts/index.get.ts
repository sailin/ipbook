import { Host, HostReport } from '~/server/models'

export default defineEventHandler(async () => {
  const hosts = await Host.find().sort({ createdAt: 1 }).lean()

  // Enrich each whitelisted host with its latest IP and history count
  const enriched = await Promise.all(
    hosts.map(async (h) => {
      const latest = await HostReport.findOne({ hostname: h.hostname })
        .sort({ lastSeen: -1 })
        .select('ip lastSeen')
        .lean()

      const historyCount = await HostReport.countDocuments({ hostname: h.hostname })

      return {
        hostname: h.hostname,
        createdAt: h.createdAt,
        currentIp: latest?.ip ?? null,
        lastSeen: latest?.lastSeen ?? null,
        historyCount
      }
    })
  )

  return enriched
})
