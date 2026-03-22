'use client'

// OrdrX — Reset Password Page
// Handles token from URL hash fragment

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [ready,    setReady]    = useState(false)
  const [checking, setChecking] = useState(true)

  // ── Check session from URL hash ────────────────────────
  useEffect(() => {
    const handleSession = async () => {
      // Supabase puts tokens in URL hash: #access_token=...&type=recovery
      const hash   = window.location.hash
      const params = new URLSearchParams(hash.replace('#', ''))
      const type   = params.get('type')

      if (type === 'recovery') {
        // Exchange the tokens for a session
        const accessToken  = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token:  accessToken,
            refresh_token: refreshToken,
          })

          if (!sessionError) {
            setReady(true)
            setChecking(false)
            return
          }
        }
      }

      // Also check if already in recovery state via auth state
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setReady(true)
      }

      setChecking(false)
    }

    handleSession()
  }, [supabase])

  // ── Also listen for auth state change ─────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setReady(true)
          setChecking(false)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [supabase])

  // ── Handle reset ───────────────────────────────────────
  const handleReset = async () => {
    if (!password.trim()) {
      setError('Please enter a new password.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  const inputCls = [
    'w-full px-4 py-3 rounded-xl border text-sm',
    'outline-none transition-colors',
    'text-gray-900 bg-white placeholder-gray-400',
    'dark:text-gray-100 dark:bg-gray-800 dark:placeholder-gray-500',
    'border-[#f0e8de] focus:border-[#b5860d]',
    'dark:border-gray-700 dark:focus:border-[#b5860d]',
  ].join(' ')

  return (
    <main className="min-h-screen bg-[#fdf6ef] dark:bg-gray-950
      flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1a1a2e] dark:text-white">
            ⚡ OrdrX
          </h1>
          <p className="text-xs text-gray-400 mt-1">by ThiranX</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border
          border-[#f0e8de] dark:border-gray-800 p-6">

          {/* Checking state */}
          {checking && (
            <div className="text-center py-4">
              <div className="text-3xl mb-3 animate-pulse">🔐</div>
              <p className="text-sm text-gray-500">Verifying reset link...</p>
            </div>
          )}

          {/* Success */}
          {!checking && done && (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Password updated!
              </h2>
              <p className="text-sm text-gray-500">
                Redirecting to your dashboard...
              </p>
            </div>
          )}

          {/* Not ready — link expired or invalid */}
          {!checking && !ready && !done && (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Link expired or invalid
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Reset links expire after 1 hour.
                Please request a new one.
              </p>
              <Link href="/forgot-password"
                className="inline-block px-6 py-3 rounded-xl
                  bg-[#b5860d] text-white font-bold text-sm">
                Request new link →
              </Link>
            </div>
          )}

          {/* Ready — show password form */}
          {!checking && ready && !done && (
            <>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Set new password
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Choose a strong password for your account.
              </p>

              {error && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200
                  text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase
                    tracking-wide mb-1.5 text-gray-500 dark:text-gray-400">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase
                    tracking-wide mb-1.5 text-gray-500 dark:text-gray-400">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                    placeholder="Re-enter password"
                    className={inputCls}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#b5860d] hover:bg-[#9a7209]
                    text-white font-bold text-sm transition-colors
                    disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password →'}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ⚡ OrdrX · Your orders. Sorted.
        </p>
      </div>
    </main>
  )
}