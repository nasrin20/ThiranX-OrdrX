'use client'

// OrdrX — Upgrade Page
// Pricing plans with Razorpay payment

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Business, PlanType } from '@/types'
import { PLAN_LIMITS } from '@/constants/plans'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────
interface RazorpayOptions {
  key:         string
  amount:      number
  currency:    string
  name:        string
  description: string
  order_id:    string
  prefill: {
    name:  string
    email: string
  }
  theme: { color: string }
  handler: (response: {
    razorpay_order_id:   string
    razorpay_payment_id: string
    razorpay_signature:  string
  }) => void
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void }
  }
}

// ── Plan config ────────────────────────────────────────────
const PLANS = [
  {
    id:       'free' as PlanType,
    name:     'Free',
    price:    0,
    period:   'forever',
    color:    '#6b7280',
    popular:  false,
    features: [
      `${PLAN_LIMITS.free.products} products`,
      `${PLAN_LIMITS.free.orders} orders/month`,
      'WhatsApp invoices',
      'Basic analytics',
      'Preference quiz',
    ],
  },
  {
    id:       'starter' as PlanType,
    name:     'Starter',
    price:    299,
    period:   '/month',
    color:    '#4e8ef7',
    popular:  false,
    features: [
      `${PLAN_LIMITS.starter.products} products`,
      `${PLAN_LIMITS.starter.orders} orders/month`,
      'Email notifications',
      'Custom badges',
      'Priority support',
    ],
  },
  {
    id:       'growth' as PlanType,
    name:     'Growth',
    price:    799,
    period:   '/month',
    color:    '#b5860d',
    popular:  true,
    features: [
      `${PLAN_LIMITS.growth.products} products`,
      `${PLAN_LIMITS.growth.orders} orders/month`,
      'Revenue reports',
      'Customer insights',
      'Custom domain',
    ],
  },
  {
    id:       'pro' as PlanType,
    name:     'Pro',
    price:    1499,
    period:   '/month',
    color:    '#7c4dca',
    popular:  false,
    features: [
      'Unlimited products',
      'Unlimited orders',
      'API access',
      'White label',
      'Dedicated support',
    ],
  },
]

// ── Load Razorpay script ───────────────────────────────────
const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script    = document.createElement('script')
    script.src      = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload   = () => resolve(true)
    script.onerror  = () => resolve(false)
    document.body.appendChild(script)
  })
}

// ── Page ───────────────────────────────────────────────────
export default function UpgradePage() {
  const supabase = createClient()
  const router   = useRouter()

  const [business, setBusiness] = useState<Business | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [paying,   setPaying]   = useState<PlanType | null>(null)
  const [success,  setSuccess]  = useState<string | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  // ── Fetch business ─────────────────────────────────────
  const fetchBusiness = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: biz } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!biz) { router.push('/onboarding'); return }
    setBusiness(biz)
    setLoading(false)
  }, [supabase, router])

  useEffect(() => { fetchBusiness() }, [fetchBusiness])

  // ── Handle upgrade ─────────────────────────────────────
  const handleUpgrade = async (plan: PlanType) => {
    if (plan === 'free') return
    if (!business) return

    setPaying(plan)
    setError(null)

    // Load Razorpay
    const loaded = await loadRazorpay()
    if (!loaded) {
      setError('Failed to load payment gateway. Please try again.')
      setPaying(null)
      return
    }

    // Create order
    const res = await fetch('/api/create-order', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ plan, business_id: business.id }),
    })

    const orderData = await res.json()

    if (!orderData.success) {
      setError(orderData.error ?? 'Failed to create order.')
      setPaying(null)
      return
    }

    // Open Razorpay checkout
    const rzp = new window.Razorpay({
      key:         orderData.key_id,
      amount:      orderData.amount,
      currency:    orderData.currency,
      name:        'OrdrX by ThiranX',
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan — Monthly`,
      order_id:    orderData.order_id,
      prefill: {
        name:  orderData.business_name,
        email: orderData.email,
      },
      theme: { color: '#b5860d' },
      handler: async (response) => {
        // Verify payment
        const verifyRes = await fetch('/api/verify-payment', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
            business_id:         business.id,
            plan,
          }),
        })

        const verifyData = await verifyRes.json()

        if (verifyData.success) {
          setSuccess(`🎉 Successfully upgraded to ${plan} plan!`)
          fetchBusiness()
          setTimeout(() => router.push('/dashboard'), 2000)
        } else {
          setError(verifyData.error ?? 'Payment verification failed.')
        }

        setPaying(null)
      },
    })

    rzp.open()
    setPaying(null)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fdf6ef] dark:bg-gray-950
        flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">⚡</div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </main>
    )
  }

  const currentPlan = business?.plan ?? 'free'

  return (
    <main className="min-h-screen bg-[#fdf6ef] dark:bg-gray-950 pb-12">
      <div className="max-w-2xl mx-auto px-4 pt-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            ⚡ Upgrade Your Plan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Current plan:{' '}
            <span className="font-bold text-[#b5860d] capitalize">
              {currentPlan}
            </span>
          </p>
        </div>

        {/* Success */}
        {success && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200
            text-green-600 text-sm rounded-xl px-4 py-3 mb-6 text-center font-bold">
            {success}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200
            text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Plans */}
        <div className="space-y-4">
          {PLANS.map((plan) => {
            const isCurrent  = currentPlan === plan.id
            const isDowngrade = PLANS.findIndex((p) => p.id === currentPlan) >
                                PLANS.findIndex((p) => p.id === plan.id)

            return (
              <div key={plan.id}
                className={cn(
                  'bg-white dark:bg-gray-900 rounded-2xl border p-5 transition-all',
                  plan.popular
                    ? 'border-[#b5860d] shadow-lg'
                    : 'border-[#f0e8de] dark:border-gray-800',
                  isCurrent && 'ring-2 ring-[#b5860d]/30',
                )}>

                {/* Popular badge */}
                {plan.popular && (
                  <div className="inline-block bg-[#b5860d] text-white
                    text-xs font-bold px-3 py-1 rounded-full mb-3">
                    ⭐ Most Popular
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">

                    {/* Plan name + price */}
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                      {isCurrent && (
                        <span className="text-xs bg-[#b5860d]/10 text-[#b5860d]
                          px-2 py-0.5 rounded-full font-bold">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-black text-gray-900 dark:text-white">
                        {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-sm text-gray-400">{plan.period}</span>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2
                          text-sm text-gray-600 dark:text-gray-400">
                          <span style={{ color: plan.color }}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="flex-shrink-0">
                    {isCurrent ? (
                      <div className="px-4 py-2 rounded-xl bg-gray-100
                        dark:bg-gray-800 text-gray-400 text-sm font-bold">
                        Active
                      </div>
                    ) : isDowngrade ? (
                      <div className="px-4 py-2 rounded-xl border
                        border-gray-200 dark:border-gray-700
                        text-gray-400 text-sm font-bold">
                        Downgrade
                      </div>
                    ) : plan.id === 'free' ? null : (
                      <button
                        type="button"
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={paying !== null}
                        className="px-5 py-2.5 rounded-xl text-white text-sm
                          font-bold transition-all disabled:opacity-50
                          hover:opacity-90 active:scale-[0.98]"
                        style={{ background: plan.color }}
                      >
                        {paying === plan.id ? 'Processing...' : 'Upgrade →'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Payments are secure and processed by Razorpay.
            Plans renew monthly. Cancel anytime.
          </p>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="text-sm text-[#b5860d] font-semibold mt-3 hover:underline"
          >
            ← Back to Dashboard
          </button>
        </div>

      </div>
    </main>
  )
}