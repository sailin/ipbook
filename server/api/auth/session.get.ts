import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const username = getAuthUser(event)
  if (username) {
    return { authenticated: true, username }
  }
  return { authenticated: false, username: null }
})
