'use client'

// OrdrX — Forgot Password Page
// Uses custom API route with Resend instead of Supabase SMTP

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (data.success) {
        setSent(true)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }

    setLoading(false)
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

          {!sent ? (
            <>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Forgot password?
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Enter your email and we&apos;ll send you a reset link.
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
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#b5860d] hover:bg-[#9a7209]
                    text-white font-bold text-sm transition-colors
                    disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Link →'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Check your email!
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                We sent a password reset link to:
              </p>
              <p className="text-sm font-bold text-[#b5860d] mb-6">
                {email}
              </p>
              <p className="text-xs text-gray-400">
                Didn&apos;t receive it? Check spam or{' '}
                <button type="button"
                  onClick={() => { setSent(false); setError(null) }}
                  className="text-[#b5860d] font-semibold hover:underline">
                  try again
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Remember your password?{' '}
          <Link href="/login"
            className="text-[#b5860d] font-semibold hover:underline">
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-4">
          ⚡ OrdrX · Your orders. Sorted.
        </p>
      </div>
    </main>
  )
}