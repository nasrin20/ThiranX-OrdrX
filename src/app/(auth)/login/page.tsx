'use client'

// OrdrX Login Page
// Supports light + dark mode via system preference

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────
interface FormState {
  email:    string
  password: string
}

interface FormError {
  email?:   string
  password?: string
  general?:  string
}

// ── Shared input classes ───────────────────────────────────
const inputBase = [
  'w-full px-4 py-2.5 rounded-xl border text-sm',
  'outline-none transition-colors',
  // Light mode
  'text-gray-900 bg-white placeholder-gray-400',
  // Dark mode
  'dark:text-gray-100 dark:bg-gray-800 dark:placeholder-gray-500',
].join(' ')

const inputNormal = [
  inputBase,
  'border-[#f0e8de] focus:border-[#b5860d]',
  'dark:border-gray-700 dark:focus:border-[#b5860d]',
].join(' ')

const inputError = [
  inputBase,
  'border-red-300 focus:border-red-400',
  'dark:border-red-500 dark:focus:border-red-400',
].join(' ')

// ── Component ──────────────────────────────────────────────
export default function LoginPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [form, setForm]       = useState<FormState>({ email: '', password: '' })
  const [errors, setErrors]   = useState<FormError>({})
  const [loading, setLoading] = useState(false)

  // ── Helpers ────────────────────────────────────────────
  const update = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  // ── Validation ─────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormError = {}

    if (!form.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Enter a valid email'
    }

    if (!form.password) {
      newErrors.password = 'Password is required'
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Submit ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})

    const { error } = await supabase.auth.signInWithPassword({
      email:    form.email,
      password: form.password,
    })

    if (error) {
      setErrors({ general: error.message })
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <main className={[
      'min-h-screen flex items-center justify-center px-4',
      // Light mode
      'bg-[#fdf6ef]',
      // Dark mode
      'dark:bg-gray-950',
    ].join(' ')}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1a1a2e] dark:text-white">
            ⚡ OrdrX
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            by ThiranX
          </p>
        </div>

        {/* Card */}
        <div className={[
          'rounded-2xl shadow-sm border p-8',
          // Light mode
          'bg-white border-[#f0e8de]',
          // Dark mode
          'dark:bg-gray-900 dark:border-gray-800',
        ].join(' ')}>

          <h2 className="text-xl font-bold text-[#1a1a2e] dark:text-white mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Sign in to your OrdrX account
          </p>

          {/* General Error */}
          {errors.general && (
            <div className={[
              'text-sm rounded-lg px-4 py-3 mb-4',
              'bg-red-50 border border-red-200 text-red-600',
              'dark:bg-red-950 dark:border-red-800 dark:text-red-400',
            ].join(' ')}>
              {errors.general}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1
                text-gray-500 dark:text-gray-400">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
                className={errors.email ? inputError : inputNormal}
              />
              {errors.email && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1
                text-gray-500 dark:text-gray-400">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={update('password')}
                placeholder="••••••••"
                className={errors.password ? inputError : inputNormal}
              />
              {errors.password && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={[
                'w-full py-3 rounded-xl text-white text-sm font-bold mt-2',
                'bg-[#b5860d] hover:bg-[#9a7209] transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              ].join(' ')}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>

          </form>

          {/* Signup Link */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-[#b5860d] font-semibold hover:underline"
            >
              Sign up free
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          ⚡ OrdrX · Your orders. Sorted.
        </p>

      </div>
    </main>
  )
}