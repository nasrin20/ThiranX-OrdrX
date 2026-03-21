'use client'

// OrdrX Onboarding Flow
// New sellers set up their business in 3 steps
// Slug is derived from their Instagram handle

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { BUSINESS_TYPES } from '@/constants/businessTypes'
import { BusinessType } from '@/types'

// ── Types ──────────────────────────────────────────────────
interface OnboardingState {
  // Step 1
  businessName:      string
  instagramHandle:   string   // e.g. madhu_the_mehak
  // Step 2
  businessType:      BusinessType | ''
  // Step 3
  whatsapp:          string
  bio:               string
}

interface StepError {
  businessName?:    string
  instagramHandle?: string
  businessType?:    string
  whatsapp?:        string
  general?:         string
}

// ── Helpers ────────────────────────────────────────────────

// Clean Instagram handle — remove @ and spaces
// e.g. "@madhu_the_mehak " → "madhu_the_mehak"
const cleanHandle = (value: string): string =>
  value
    .replace(/^@+/, '')   // remove leading @
    .replace(/\s/g, '')   // remove spaces
    .toLowerCase()

// ── Step Indicator ─────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  const steps = ['Business', 'Category', 'Contact']

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, index) => {
        const step     = index + 1
        const isDone   = current > step
        const isActive = current === step

        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div className={[
                'w-8 h-8 rounded-full flex items-center justify-center',
                'text-sm font-bold transition-colors',
                isDone || isActive
                  ? 'bg-[#b5860d] text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400',
              ].join(' ')}>
                {isDone ? '✓' : step}
              </div>
              <span className={[
                'text-xs font-medium',
                isActive
                  ? 'text-[#b5860d]'
                  : 'text-gray-400 dark:text-gray-600',
              ].join(' ')}>
                {label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div className={[
                'w-12 h-0.5 mb-4 transition-colors',
                current > step
                  ? 'bg-[#b5860d]'
                  : 'bg-gray-200 dark:bg-gray-700',
              ].join(' ')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Input classes ──────────────────────────────────────────
const inputBase = [
  'w-full px-4 py-2.5 rounded-xl border text-sm',
  'outline-none transition-colors',
  'text-gray-900 bg-white placeholder-gray-400',
  'dark:text-gray-100 dark:bg-gray-800 dark:placeholder-gray-500',
].join(' ')

const inputNormal = `${inputBase} border-[#f0e8de] focus:border-[#b5860d] dark:border-gray-700`
const inputErr    = `${inputBase} border-red-300 focus:border-red-400 dark:border-red-500`

// ── Component ──────────────────────────────────────────────
export default function OnboardingPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState<StepError>({})

  const [form, setForm] = useState<OnboardingState>({
    businessName:    '',
    instagramHandle: '',
    businessType:    '',
    whatsapp:        '',
    bio:             '',
  })

  // ── Helpers ──────────────────────────────────────────────
  const update = (field: keyof OnboardingState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    update('instagramHandle', cleanHandle(e.target.value))
  }

  // ── Validation per step ───────────────────────────────────
  const validateStep1 = (): boolean => {
    const newErrors: StepError = {}

    if (!form.businessName.trim()) {
      newErrors.businessName = 'Business name is required'
    } else if (form.businessName.length < 2) {
      newErrors.businessName = 'Name must be at least 2 characters'
    }

    if (!form.instagramHandle.trim()) {
      newErrors.instagramHandle = 'Instagram handle is required'
    } else if (form.instagramHandle.length < 2) {
      newErrors.instagramHandle = 'Handle must be at least 2 characters'
    } else if (!/^[a-z0-9._]+$/.test(form.instagramHandle)) {
      newErrors.instagramHandle = 'Only letters, numbers, dots and underscores allowed'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: StepError = {}

    if (!form.businessType) {
      newErrors.businessType = 'Please select a business type'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = (): boolean => {
    const newErrors: StepError = {}

    if (!form.whatsapp.trim()) {
      newErrors.whatsapp = 'WhatsApp number is required'
    } else if (form.whatsapp.replace(/\D/g, '').length < 10) {
      newErrors.whatsapp = 'Enter a valid WhatsApp number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Navigation ───────────────────────────────────────────
  const nextStep = () => {
    setErrors({})
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep((s) => s + 1)
  }

  const prevStep = () => {
    setErrors({})
    setStep((s) => s - 1)
  }

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep3()) return

    setLoading(true)
    setErrors({})

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setErrors({ general: 'Session expired. Please login again.' })
      setLoading(false)
      return
    }

    // Create business — slug = Instagram handle
    const { error } = await supabase
      .from('businesses')
      .insert({
        user_id:     user.id,
        name:        form.businessName.trim(),
        slug:        form.instagramHandle,   // ← Instagram handle IS the slug
        type:        form.businessType,
        whatsapp:    form.whatsapp.trim(),
        bio:         form.bio.trim() || null,
        theme_color: '#b5860d',
        plan:        'free',
        email: user.email,
      })

    if (error) {
      if (error.code === '23505') {
        setErrors({ general: 'This Instagram handle is already registered. Contact support if this is your account.' })
      } else {
        setErrors({ general: error.message })
      }
      setLoading(false)
      return
    }

    // All done!
    router.push('/dashboard')
    router.refresh()
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#fdf6ef] dark:bg-gray-950
      flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#1a1a2e] dark:text-white">
            ⚡ OrdrX
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Let&apos;s set up your store 🚀
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator current={step} />

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm
          border border-[#f0e8de] dark:border-gray-800 p-8">

          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200
              dark:border-red-800 text-red-600 dark:text-red-400
              text-sm rounded-lg px-4 py-3 mb-6">
              {errors.general}
            </div>
          )}

          {/* ── STEP 1 — Business Name + Instagram Handle ── */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-[#1a1a2e] dark:text-white mb-1">
                Tell us about your business
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Your Instagram handle becomes your OrdrX store link.
              </p>

              <div className="space-y-4">

                {/* Business Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase
                    tracking-wide mb-1 text-gray-500 dark:text-gray-400">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => update('businessName', e.target.value)}
                    placeholder="e.g. ThiranX Creations"
                    className={errors.businessName ? inputErr : inputNormal}
                  />
                  {errors.businessName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.businessName}
                    </p>
                  )}
                </div>

                {/* Instagram Handle */}
                <div>
                  <label className="block text-xs font-semibold uppercase
                    tracking-wide mb-1 text-gray-500 dark:text-gray-400">
                    Instagram Handle
                  </label>
                  <div className="flex items-center rounded-xl border overflow-hidden
                    border-[#f0e8de] dark:border-gray-700
                    focus-within:border-[#b5860d]">
                    <span className="px-3 py-2.5 bg-gray-50 dark:bg-gray-800
                      text-gray-400 dark:text-gray-500 text-sm border-r
                      border-[#f0e8de] dark:border-gray-700">
                      @
                    </span>
                    <input
                      type="text"
                      value={form.instagramHandle}
                      onChange={handleHandleChange}
                      placeholder="ThiranX"
                      className={[
                        'flex-1 px-3 py-2.5 text-sm outline-none',
                        'text-gray-900 dark:text-gray-100',
                        'bg-white dark:bg-gray-800',
                        'placeholder-gray-400 dark:placeholder-gray-500',
                      ].join(' ')}
                    />
                  </div>
                  {errors.instagramHandle && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.instagramHandle}
                    </p>
                  )}

                  {/* Live preview */}
                  {form.instagramHandle && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-400">Your store link:</span>
                      <span className="text-xs font-semibold text-[#b5860d]">
                        ordrx.in/@{form.instagramHandle}
                      </span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ── STEP 2 — Business Type ── */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-[#1a1a2e] dark:text-white mb-1">
                What do you sell?
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                We&apos;ll set up your store perfectly for your business.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {BUSINESS_TYPES.map((biz) => (
                  <button
                    key={biz.type}
                    type="button"
                    onClick={() => update('businessType', biz.type)}
                    className={[
                      'flex flex-col items-center gap-2 p-3 rounded-xl border',
                      'transition-all text-center cursor-pointer',
                      form.businessType === biz.type
                        ? 'border-[#b5860d] bg-[#fdf6ef] dark:bg-gray-800'
                        : 'border-[#f0e8de] dark:border-gray-700 hover:border-[#b5860d]',
                    ].join(' ')}
                  >
                    <span className="text-2xl">{biz.emoji}</span>
                    <span className={[
                      'text-xs font-semibold leading-tight',
                      form.businessType === biz.type
                        ? 'text-[#b5860d]'
                        : 'text-gray-600 dark:text-gray-400',
                    ].join(' ')}>
                      {biz.label}
                    </span>
                  </button>
                ))}
              </div>

              {errors.businessType && (
                <p className="text-red-500 text-xs mt-3">
                  {errors.businessType}
                </p>
              )}
            </div>
          )}

          {/* ── STEP 3 — Contact ── */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-[#1a1a2e] dark:text-white mb-1">
                Almost there! 🎉
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Add your WhatsApp so customers can reach you.
              </p>

              <div className="space-y-4">

                {/* WhatsApp */}
                <div>
                  <label className="block text-xs font-semibold uppercase
                    tracking-wide mb-1 text-gray-500 dark:text-gray-400">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => update('whatsapp', e.target.value)}
                    placeholder="+91 98400 12345"
                    className={errors.whatsapp ? inputErr : inputNormal}
                  />
                  {errors.whatsapp && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.whatsapp}
                    </p>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-semibold uppercase
                    tracking-wide mb-1 text-gray-500 dark:text-gray-400">
                    Store Bio{' '}
                    <span className="normal-case font-normal text-gray-400">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => update('bio', e.target.value)}
                    placeholder="Tell customers about your business..."
                    rows={3}
                    className={[
                      'w-full px-4 py-2.5 rounded-xl border text-sm resize-none',
                      'outline-none transition-colors',
                      'text-gray-900 bg-white placeholder-gray-400',
                      'dark:text-gray-100 dark:bg-gray-800 dark:placeholder-gray-500',
                      'border-[#f0e8de] focus:border-[#b5860d]',
                      'dark:border-gray-700 dark:focus:border-[#b5860d]',
                    ].join(' ')}
                  />
                </div>

                {/* Summary */}
                <div className="bg-[#fdf6ef] dark:bg-gray-800 rounded-xl p-4
                  border border-[#f0e8de] dark:border-gray-700">
                  <p className="text-xs font-semibold uppercase tracking-wide
                    text-gray-400 mb-3">
                    Your Store Summary
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: 'Name',      value: form.businessName },
                      { label: 'Instagram', value: `@${form.instagramHandle}` },
                      {
                        label: 'Store link',
                        value: `ordrx.in/@${form.instagramHandle}`,
                        highlight: true,
                      },
                      {
                        label: 'Type',
                        value: `${BUSINESS_TYPES.find(b => b.type === form.businessType)?.emoji} ${BUSINESS_TYPES.find(b => b.type === form.businessType)?.label}`,
                      },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">{label}</span>
                        <span className={[
                          'text-xs font-semibold',
                          highlight
                            ? 'text-[#b5860d]'
                            : 'text-gray-700 dark:text-gray-300',
                        ].join(' ')}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ── Navigation Buttons ── */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 py-3 rounded-xl border text-sm font-bold
                  transition-colors border-[#f0e8de] dark:border-gray-700
                  text-gray-600 dark:text-gray-400
                  hover:border-[#b5860d] hover:text-[#b5860d]"
              >
                ← Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 py-3 rounded-xl text-white text-sm font-bold
                  transition-colors bg-[#b5860d] hover:bg-[#9a7209]"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className={[
                  'flex-1 py-3 rounded-xl text-white text-sm font-bold',
                  'transition-colors bg-[#b5860d] hover:bg-[#9a7209]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                ].join(' ')}
              >
                {loading ? 'Setting up...' : '🚀 Launch My Store!'}
              </button>
            )}
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          ⚡ OrdrX · Your orders. Sorted.
        </p>

      </div>
    </main>
  )
}