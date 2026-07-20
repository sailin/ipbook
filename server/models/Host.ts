import mongoose from 'mongoose'

const hostSchema = new mongoose.Schema({
  hostname: { type: String, required: true, unique: true, lowercase: true, trim: true },
  createdAt: { type: Date, default: Date.now }
})

export const Host = mongoose.models.Host || mongoose.model('Host', hostSchema)
