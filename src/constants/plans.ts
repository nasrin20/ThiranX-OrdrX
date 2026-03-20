// OrdrX Plan limits and pricing
// All prices in INR (₹)

import { PlanType, BusinessType } from '@/types'

// ── Plan Limits ────────────────────────────────────────────
export const PLAN_LIMITS: Record<PlanType, {
  products: number
  orders: number
  customers: number
  whatsappSends: number
  storage: number // in MB
}> = {
  free: {
    products:      5,
    orders:        20,
    customers:     50,
    whatsappSends: 10,
    storage:       50,
  },
  starter: {
    products:      25,
    orders:        100,
    customers:     500,
    whatsappSends: 100,
    storage:       500,
  },
  growth: {
    products:      100,
    orders:        500,
    customers:     2000,
    whatsappSends: 500,
    storage:       2048,
  },
  pro: {
    products:      Infinity,
    orders:        Infinity,
    customers:     Infinity,
    whatsappSends: Infinity,
    storage:       10240,
  },
} as const

// ── Plan Pricing ───────────────────────────────────────────
export const PLAN_PRICING: Record<PlanType, {
  monthly: number
  yearly: number
  label: string
  description: string
}> = {
  free: {
    monthly:     0,
    yearly:      0,
    label:       'Free',
    description: 'Perfect to get started',
  },
  starter: {
    monthly:     299,
    yearly:      2990, // 2 months free
    label:       'Starter',
    description: 'For growing sellers',
  },
  growth: {
    monthly:     799,
    yearly:      7990,
    label:       'Growth',
    description: 'For serious sellers',
  },
  pro: {
    monthly:     1499,
    yearly:      14990,
    label:       'Pro',
    description: 'For power sellers',
  },
} as const

// ── Plan Features ──────────────────────────────────────────
export const PLAN_FEATURES: Record<PlanType, {
  invoicePdf:        boolean
  preferencePicker:  boolean
  broadcast:         boolean
  customDomain:      boolean
  fullAnalytics:     boolean
  removeOrdrxBrand:  boolean
}> = {
  free: {
    invoicePdf:       false,
    preferencePicker: false,
    broadcast:        false,
    customDomain:     false,
    fullAnalytics:    false,
    removeOrdrxBrand: false,
  },
  starter: {
    invoicePdf:       true,
    preferencePicker: true,
    broadcast:        false,
    customDomain:     false,
    fullAnalytics:    false,
    removeOrdrxBrand: false,
  },
  growth: {
    invoicePdf:       true,
    preferencePicker: true,
    broadcast:        true,
    customDomain:     true,
    fullAnalytics:    true,
    removeOrdrxBrand: false,
  },
  pro: {
    invoicePdf:       true,
    preferencePicker: true,
    broadcast:        true,
    customDomain:     true,
    fullAnalytics:    true,
    removeOrdrxBrand: true,
  },
} as const