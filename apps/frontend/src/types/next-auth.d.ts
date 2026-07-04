import 'next-auth'
declare module 'next-auth' {
  interface Session {
    user: { accessToken: string; role: string; name?: string | null; email?: string | null }
  }
}
