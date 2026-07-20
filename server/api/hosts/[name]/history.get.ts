import { HostReport } from '~/server/models'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Hostname required' })

  const hostname = name.toLowerCase()

  const reports = await HostReport.find({ hostname })
    .sort({ firstSeen: -1 })
    .select('ip firstSeen lastSeen timeSpanDays')
    .lean()

  return reports
})
