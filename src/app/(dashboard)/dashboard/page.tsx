'use client'

// OrdrX — Dashboard Page
// Real-time orders, notifications, chart filters, badges

import { useState, useEffect, useCallback, useRef } from 'react'
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

type ChartRange = '7d' | '30d' | '6m' | '1y'

// ── Chart range helpers ────────────────────────────────────
const buildChartData = (
  orders: OrderWithCustomer[],
  range:  ChartRange,
): DailyRevenue[] => {
  const now    = new Date()
  const months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec']
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  if (range === '7d') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(now.getDate() - (6 - i))
      const dateStr = d.toISOString().split('T')[0]
      return {
        day: days[d.getDay()],
        revenue: orders
          .filter((o) => (o.status === 'paid' || o.status === 'shipped') && o.created_at.startsWith(dateStr))
          .reduce((s, o) => s + o.amount, 0),
      }
    })
  }

  if (range === '30d') {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date()
      d.setDate(now.getDate() - (29 - i))
      const dateStr = d.toISOString().split('T')[0]
      return {
        day: `${d.getDate()}/${d.getMonth() + 1}`,
        revenue: orders
          .filter((o) => (o.status === 'paid' || o.status === 'shipped') && o.created_at.startsWith(dateStr))
          .reduce((s, o) => s + o.amount, 0),
      }
    })
  }

  const monthCount = range === '6m' ? 6 : 12
  return Array.from({ length: monthCount }, (_, i) => {
    const d = new Date()
    d.setMonth(now.getMonth() - (monthCount - 1 - i))
    return {
      day: months[d.getMonth()],
      revenue: orders
        .filter((o) => {
          if (o.status !== 'paid' && o.status !== 'shipped') return false
          const od = new Date(o.created_at)
          return od.getMonth() === d.getMonth() &&
                 od.getFullYear() === d.getFullYear()
        })
        .reduce((s, o) => s + o.amount, 0),
    }
  })
}

// ── Component ──────────────────────────────────────────────
export default function DashboardPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [business,   setBusiness]   = useState<Business | null>(null)
  const [orders,     setOrders]     = useState<OrderWithCustomer[]>([])
  const [chartData,  setChartData]  = useState<DailyRevenue[]>([])
  const [chartRange, setChartRange] = useState<ChartRange>('7d')
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [newOrder,   setNewOrder]   = useState<string | null>(null)

  const prevCount = useRef(0)

  // ── Fetch ──────────────────────────────────────────────
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: biz } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!biz) { router.push('/onboarding'); return }
    setBusiness(biz)

    const { data: rawOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`*, customers(name,phone), products(name)`)
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (ordersError) {
      setError('Failed to load orders.')
      setLoading(false)
      return
    }

    const flat: OrderWithCustomer[] = (rawOrders ?? []).map((o) => ({
      ...o,
      customer_name:  o.customers?.name  ?? 'Unknown',
      customer_phone: o.customers?.phone ?? '',
      product_name:   o.products?.name   ?? 'Unknown',
    }))

    // ── New order toast ────────────────────────────────
    if (prevCount.current > 0 && flat.length > prevCount.current) {
      const latest = flat[0]
      setNewOrder(
        `🛍️ New order from ${latest.customer_name} — ₹${(latest.amount / 100).toLocaleString('en-IN')}!`
      )
      setTimeout(() => setNewOrder(null), 6000)
    }
    prevCount.current = flat.length

    setOrders(flat)
    setChartData(buildChartData(flat, chartRange))
    if (!silent) setLoading(false)
  }, [supabase, router, chartRange])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Auto-refresh every 30s ─────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  // ── Update chart on range change ───────────────────────
  useEffect(() => {
    setChartData(buildChartData(orders, chartRange))
  }, [chartRange, orders])

  // ── Stats ──────────────────────────────────────────────
  // ✅ Fixed — paid + shipped both count
const totalRevenue = orders
  .filter((o) => o.status === 'paid' || o.status === 'shipped')
  .reduce((s, o) => s + o.amount, 0)
  const pendingAmount = orders.filter((o) => o.status === 'pending').reduce((s, o) => s + o.amount, 0)
  const overdueCount  = orders.filter((o) => o.status === 'overdue').length

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fdf6ef] dark:bg-gray-950
        flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">⚡</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fdf6ef] dark:bg-gray-950 pb-12">

      {/* ── New Order Toast ── */}
      {newOrder && (
        <div className="fixed top-4 right-4 z-50
          bg-[#b5860d] text-white px-4 py-3 rounded-2xl
          shadow-xl text-sm font-bold animate-bounce">
          {newOrder}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 pt-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#b5860d] mb-1">
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
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/${business?.slug}`)}
            >
              Copy Link 📋
            </Button>
            <button
              type="button"
              onClick={signOut}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200
            text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6">
          <StatsRow
            totalRevenue={totalRevenue}
            pendingAmount={pendingAmount}
            totalOrders={orders.length}
            overdueCount={overdueCount}
          />
        </div>

        {/* Revenue Chart + Range Filter */}
        <div className="mb-6 bg-white dark:bg-gray-900 rounded-2xl border
          border-[#f0e8de] dark:border-gray-800 p-5">

          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                📈 Revenue
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                ₹{(totalRevenue / 100).toLocaleString('en-IN')} total paid
              </p>
            </div>

            {/* Range tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              {(['7d', '30d', '6m', '1y'] as ChartRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setChartRange(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    chartRange === r
                      ? 'bg-[#b5860d] text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-[#b5860d]'
                  }`}
                >
                  {r === '7d' ? '7D' : r === '30d' ? '30D' : r === '6m' ? '6M' : '1Y'}
                </button>
              ))}
            </div>
          </div>

          <RevenueChart data={chartData} />
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: '🧴 Products',  href: '/products'  },
            { label: '👥 Customers', href: '/customers' },
            { label: '⚙️ Settings',  href: '/settings'  },
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

        {/* Overdue alert */}
        {overdueCount > 0 && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200
            dark:border-red-800 rounded-2xl p-4 mb-6">
            <p className="text-sm font-bold text-red-700 dark:text-red-400">
              🚨 {overdueCount} overdue order{overdueCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              Send a WhatsApp reminder to collect payment
            </p>
          </div>
        )}

        {/* Refresh + Orders */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Recent Orders
          </p>
          <button
            type="button"
            onClick={() => fetchData(true)}
            className="text-xs text-[#b5860d] font-semibold hover:underline"
          >
            🔄 Refresh
          </button>
        </div>

        <OrdersTable orders={orders} onRefresh={() => fetchData(true)} />

      </div>
    </main>
  )
}