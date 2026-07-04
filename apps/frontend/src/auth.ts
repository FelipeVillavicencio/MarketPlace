import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { loginSchema } from '@marketplace/shared'

type AuthUser = { accessToken: string; role: string }

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null
        const res = await fetch(`${process.env.BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        }).catch(() => null)
        if (!res || !res.ok) return null
        const body = await res.json().catch(() => null)
        if (!body) return null
        const { token, user } = body
        return { ...user, accessToken: token }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const authUser = user as typeof user & AuthUser
        token.accessToken = authUser.accessToken
        token.role = authUser.role
      }
      return token
    },
    session({ session, token }) {
      session.user.accessToken = token.accessToken as string
      session.user.role = token.role as string
      return session
    },
  },
  pages: { signIn: '/login' },
})
