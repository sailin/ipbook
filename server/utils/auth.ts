import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { H3Event } from 'h3'

const SALT_ROUNDS = 10
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

export interface AuthPayload {
  username: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: AuthPayload): string {
  const config = useRuntimeConfig()
  return jwt.sign(payload, config.jwtSecret, { expiresIn: TOKEN_MAX_AGE_SECONDS })
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const config = useRuntimeConfig()
    return jwt.verify(token, config.jwtSecret) as AuthPayload
  } catch {
    return null
  }
}

const AUTH_COOKIE_NAME = 'ipbook_token'

export function setAuthCookie(event: H3Event, token: string) {
  setCookie(event, AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // set true behind HTTPS
    maxAge: TOKEN_MAX_AGE_SECONDS,
    path: '/'
  })
}

export function clearAuthCookie(event: H3Event) {
  deleteCookie(event, AUTH_COOKIE_NAME, { path: '/' })
}

export function getAuthCookie(event: H3Event): string | undefined {
  return getCookie(event, AUTH_COOKIE_NAME)
}

/**
 * Returns the authenticated username, or null if not authenticated.
 */
export function getAuthUser(event: H3Event): string | null {
  const token = getAuthCookie(event)
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.username ?? null
}

/**
 * Throws 401 if the request is not authenticated.
 */
export function requireAuth(event: H3Event): string {
  const username = getAuthUser(event)
  if (!username) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return username
}
