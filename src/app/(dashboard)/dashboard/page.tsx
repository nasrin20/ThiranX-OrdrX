'use client'

// OrdrX — Dashboard Page
// Main admin view with stats, revenue chart and orders

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Business, Order, OrderStatus } from '@/types'
import { StatsRow } from '@/components/dashboard/StatsRow'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { OrdersTable } from '@/components/dashboard/OrdersTable'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────
interface OrderWithCustomer extends Order {
  customer_name:  string
  customer_phone: string
  product_name:   string
}

interface DailyRevenue {
  day:     string
  revenue: number
}

// ── Helpers ────────────────────────────────────────────────

// Get last 7 days as labels
const getLast7Days = (): string[] => {
  const days   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const result = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    result.push(days[d.getDay()])
  }
  return result
}

// ── Component ──────────────────────────────────────────────
export default function DashboardPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [business,  setBusiness]  = useState<Business | null>(null)
  const [orders,    setOrders]    = useState<OrderWithCustomer[]>([])
  const [chartData, setChartData] = useState<DailyRevenue[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  // ── Fetch all data ─────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Get business
    const { data: biz, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (bizError || !biz) {
      // No business yet — redirect to onboarding
      router.push('/onboarding')
      return
    }

    setBusiness(biz)

    // Get orders with customer + product info
    const { data: rawOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        customers ( name, phone ),
        products  ( name )
      `)
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (ordersError) {
      setError('Failed to load orders.')
      setLoading(false)
      return
    }

    // Flatten the joined data
    const flatOrders: OrderWithCustomer[] = (rawOrders ?? []).map((o) => ({
      ...o,
      customer_name:  o.customers?.name  ?? 'Unknown',
      customer_phone: o.customers?.phone ?? '',
      product_name:   o.products?.name   ?? 'Unknown',
    }))

    setOrders(flatOrders)

    // Build last 7 days revenue chart
    const days    = getLast7Days()
    const today   = new Date()
    const revenue = days.map((day, i) => {
      const date = new Date()
      date.setDate(today.getDate() - (6 - i))
      const dateStr = date.toISOString().split('T')[0]

      const dayRevenue = flatOrders
        .filter((o) =>
          o.status === 'paid' &&
          o.created_at.startsWith(dateStr)
        )
        .reduce((sum, o) => sum + o.amount, 0)

      return { day, revenue: dayRevenue }
    })

    setChartData(revenue)
    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Computed stats ─────────────────────────────────────
  const totalRevenue  = orders
    .filter((o) => o.status === 'paid')
    .reduce((s, o) => s + o.amount, 0)

  const pendingAmount = orders
    .filter((o) => o.status === 'pending')
    .reduce((s, o) => s + o.amount, 0)

  const overdueCount  = orders
    .filter((o) => o.status === 'overdue')
    .length

  // ── Sign out ───────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // ── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-[#fdf6ef] dark:bg-gray-950
        flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">⚡</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </main>
    )
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#fdf6ef] dark:bg-gray-950 pb-12">
      <div className="max-w-2xl mx-auto px-4 pt-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide
              text-[#b5860d] mb-1">
              ⚡ OrdrX Dashboard
            </p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {business?.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              ordrx.in/@{business?.slug}
            </p>
          </div>

          <div className="flex flex-col gap-2 items-end">
            {/* Copy store link */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/${business?.slug}`
                )
              }}
            >
              Copy Link 📋
            </Button>

            {/* Sign out */}
            <button
              type="button"
              onClick={signOut}
              className="text-xs text-gray-400 dark:text-gray-500
                hover:text-red-500 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200
            dark:border-red-800 text-red-600 dark:text-red-400
            text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* ── Stats ── */}
        <div className="mb-6">
          <StatsRow
            totalRevenue={totalRevenue}
            pendingAmount={pendingAmount}
            totalOrders={orders.length}
            overdueCount={overdueCount}
          />
        </div>

        {/* ── Revenue Chart ── */}
        <div className="mb-6">
          <RevenueChart data={chartData} />
        </div>

        {/* ── Quick links ── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: '🧴 Products', href: '/products' },
            { label: '👥 Customers', href: '/customers' },
            { label: '⚙️ Settings', href: '/settings' },
          ].map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => router.push(link.href)}
              className="bg-white dark:bg-gray-900 rounded-2xl border
                border-[#f0e8de] dark:border-gray-800 p-3 text-center
                hover:border-[#b5860d] transition-colors"
            >
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {link.label}
              </p>
            </button>
          ))}
        </div>

        {/* ── Overdue Alert ── */}
        {overdueCount > 0 && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200
            dark:border-red-800 rounded-2xl p-4 mb-6
            flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-400">
                🚨 {overdueCount} overdue order{overdueCount > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-red-500 dark:text-red-500 mt-0.5">
                Send a WhatsApp reminder to collect payment
              </p>
            </div>
          </div>
        )}

        {/* ── Orders Table ── */}
        <OrdersTable
          orders={orders}
          onRefresh={fetchData}
        />

      </div>
    </main>
  )
}