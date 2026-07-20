import mongoose from 'mongoose'

const unknownHostSchema = new mongoose.Schema({
  hostname: { type: String, required: true, unique: true, lowercase: true, trim: true },
  lastIp: { type: String, required: true },
  lastSeen: { type: Date, required: true },
  count: { type: Number, default: 1 }
})

export const UnknownHost = mongoose.models.UnknownHost || mongoose.model('UnknownHost', unknownHostSchema)
