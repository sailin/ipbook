import mongoose from 'mongoose'

const hostReportSchema = new mongoose.Schema({
  hostname: { type: String, required: true, lowercase: true, trim: true, index: true },
  ip: { type: String, required: true },
  firstSeen: { type: Date, required: true },
  lastSeen: { type: Date, required: true },
  timeSpanDays: { type: Number, default: 0 }
})

hostReportSchema.index({ hostname: 1, lastSeen: -1 })

export const HostReport = mongoose.models.HostReport || mongoose.model('HostReport', hostReportSchema)
