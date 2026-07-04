import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { loginSchema } from '@marketplace/shared'

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
        })
        if (!res.ok) return null
        const { token, user } = await res.json()
        return { ...user, accessToken: token }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as typeof user & { accessToken: string }).accessToken
        token.role = (user as typeof user & { role: string }).role
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
