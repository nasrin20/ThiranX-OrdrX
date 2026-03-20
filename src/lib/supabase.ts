// OrdrX Supabase Client
// Two clients: browser (client) and server

import { createBrowserClient } from '@supabase/ssr'

// ── Browser Client ─────────────────────────────────────────
// Use this in components and client-side code
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )