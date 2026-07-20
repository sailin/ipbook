import { Host, HostReport, UnknownHost } from '~/server/models'
import type { H3Event } from 'h3'

function extractClientIP(event: H3Event): string {
  // 1. x-forwarded-for (first IP in chain is the original client)
  const xff = getHeader(event, 'x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0].trim()
    if (first) return first
  }

  // 2. x-real-ip (common in nginx reverse proxy setups)
  const xri = getHeader(event, 'x-real-ip')
  if (xri) return xri

  // 3. Direct socket remote address
  const req = event.node.req
  const sockAddr = req.socket?.remoteAddress || req.connection?.remoteAddress
  if (sockAddr && sockAddr !== '::1' && sockAddr !== '127.0.0.1') return sockAddr

  // 4. Built-in h3 getRequestIP as final fallback
  const builtin = getRequestIP(event)
  if (builtin) return builtin

  return 'unknown'
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawName = query.name

  if (!rawName || typeof rawName !== 'string' || rawName.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid "name" query parameter' })
  }

  const hostname = rawName.trim().toLowerCase()
  const ip = extractClientIP(event)
  const now = new Date()

  // Check whitelist
  const isWhitelisted = !!(await Host.findOne({ hostname }))

  if (isWhitelisted) {
    // Find the latest report for this host
    const latest = await HostReport.findOne({ hostname }).sort({ lastSeen: -1 })

    if (latest && latest.ip === ip) {
      // Same IP — update lastSeen and timeSpanDays
      latest.lastSeen = now
      latest.timeSpanDays = Math.round(((now.getTime() - latest.firstSeen.getTime()) / 86_400_000) * 100) / 100
      await latest.save()
    } else {
      // New IP or first report — create new entry
      await HostReport.create({
        hostname,
        ip,
        firstSeen: now,
        lastSeen: now,
        timeSpanDays: 0
      })
    }
  } else {
    // Not whitelisted — upsert last-seen and increment count
    await UnknownHost.findOneAndUpdate(
      { hostname },
      { lastIp: ip, lastSeen: now, $inc: { count: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  }

  return {
    status: 'ok',
    hostname,
    ip,
    whitelisted: isWhitelisted,
    timestamp: now.toISOString()
  }
})
