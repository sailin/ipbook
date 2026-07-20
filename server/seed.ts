import mongoose from 'mongoose'
import { User } from './models/User'
import { hashPassword } from './utils/auth'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ipbook'

async function seed() {
  await mongoose.connect(MONGO_URI)
  console.log('Connected to MongoDB')

  const count = await User.countDocuments()
  if (count > 0) {
    console.log(`Already ${count} user(s) exist. Skipping seed.`)
    await mongoose.disconnect()
    process.exit(0)
  }

  // Read from env or use defaults
  const username = (process.env.ADMIN_USER || 'admin').toLowerCase()
  const password = process.env.ADMIN_PASS || 'admin123'

  const passwordHash = await hashPassword(password)
  await User.create({ username, passwordHash })

  console.log(`Created admin user: ${username}`)
  console.log('⚠️  Change the default password immediately!')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
