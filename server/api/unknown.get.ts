import { UnknownHost } from '~/server/models'

export default defineEventHandler(async () => {
  const hosts = await UnknownHost.find()
    .sort({ lastSeen: -1 })
    .select('hostname lastIp lastSeen count')
    .lean()

  // Default count to 1 for records created before the field existed
  return hosts.map(h => ({
    ...h,
    count: h.count ?? 1
  }))
})
