import { User } from '~/server/models'
import { hashPassword, verifyPassword, signToken, setAuthCookie } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body || {}

  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Username and password required' })
  }

  const normalizedName = username.trim().toLowerCase()
  const user = await User.findOne({ username: normalizedName })

  // If no user exists yet, create the first admin (bootstrapping)
  if (!user) {
    const userCount = await User.countDocuments()
    if (userCount === 0) {
      const passwordHash = await hashPassword(password)
      await User.create({ username: normalizedName, passwordHash })
      const token = signToken({ username: normalizedName })
      setAuthCookie(event, token)
      return { success: true, username: normalizedName, created: true }
    }
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const token = signToken({ username: user.username })
  setAuthCookie(event, token)

  return { success: true, username: user.username }
})
