import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ipbook'

async function fix() {
  await mongoose.connect(MONGO_URI)
  const db = mongoose.connection.db!
  const r = await db.collection('unknownhosts').updateMany(
    { count: { $exists: false } },
    { $set: { count: 1 } }
  )
  console.log('Updated', r.modifiedCount, 'documents')
  await mongoose.disconnect()
  process.exit(0)
}

fix().catch((e) => {
  console.error(e)
  process.exit(1)
})
