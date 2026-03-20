'use client'

// OrdrX — Orders Page
// Full order management with filters and actions

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Order, OrderStatus, Business } from '@/types'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────
interface OrderWithDetails extends Order {
  customer_name:  string
  customer_phone: string
  product_name:   string
  product_emoji:  string
}

// ── Status config ──────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, {
  label: string
  color: string
  bg:    string
  dark:  string
}> = {
  pending:   { label: 'Pending',   color: '#92400e', bg: '#fef9c3', dark: 'dark:bg-yellow-950 dark:text-yellow-400' },
  paid:      { label: 'Paid',      color: '#14532d', bg: '#dcfce7', dark: 'dark:bg-green-950  dark:text-green-400'  },
  shipped:   { label: 'Shipped',   color: '#1e3a8a', bg: '#dbeafe', dark: 'dark:bg-blue-950   dark:text-blue-400'   },
  cancelled: { label: 'Cancelled', color: '#6b7280', bg: '#f3f4f6', dark: 'dark:bg-gray-800   dark:text-gray-400'   },
  overdue:   { label: 'Overdue',   color: '#991b1b', bg: '#fee2e2', dark: 'dark:bg-red-950    dark:text-red-400'    },
}

// ── Helpers ────────────────────────────────────────────────
const formatPrice = (paise: number) =>
  `₹${(paise / 100).toLocaleString('en-IN')}`

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  })

// ── Status Badge ───────────────────────────────────────────
function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'text-xs font-bold px-2.5 py-1 rounded-full',
        s.dark,
      )}
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

// ── Order Card ─────────────────────────────────────────────
function OrderCard({
  order,
  onStatusChange,
}: {
  order:          OrderWithDetails
  onStatusChange: (id: string, status: OrderStatus) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const whatsappMsg = encodeURIComponent(
    `Hi ${order.customer_name}! 👋\n\nYour order ${order.order_ref} for ${order.product_name} (${formatPrice(order.amount)}) is confirmed.\n\nPlease complete payment to proceed.\n\n— OrdrX`
  )

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border
      border-[#f0e8de] dark:border-gray-800 overflow-hidden">

      {/* Main row */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer
          hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Product emoji */}
        <div className="w-11 h-11 rounded-xl bg-[#fdf6ef] dark:bg-gray-800
          flex items-center justify-center text-xl flex-shrink-0">
          {order.product_emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {order.customer_name}
            </p>
            <p className="text-xs text-gray-400 flex-shrink-0">
              {order.order_ref}
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {order.product_name}
            {order.variant   ? ` · ${order.variant}`   : ''}
            {order.quantity > 1 ? ` × ${order.quantity}` : ''}
          </p>
        </div>

        {/* Amount + date */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-[#b5860d]">
            {formatPrice(order.amount)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {formatDate(order.created_at)}
          </p>
        </div>

        {/* Status */}
        <div className="flex-shrink-0">
          <StatusBadge status={order.status} />
        </div>

        {/* Chevron */}
        <span className={cn(
          'text-gray-400 text-xs transition-transform flex-shrink-0',
          expanded && 'rotate-180',
        )}>
          ▼
        </span>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-2 py-3">
            {[
              ['Customer',  order.customer_name],
              ['Phone',     order.customer_phone],
              ['Product',   order.product_name],
              ['Variant',   order.variant || '—'],
              ['Quantity',  String(order.quantity)],
              ['Amount',    formatPrice(order.amount)],
              ['Order Ref', order.order_ref],
              ['Date',      formatDate(order.created_at)],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {label}
                </p>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 mb-3">
              <p className="text-xs text-gray-400 mb-0.5">Note</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {order.notes}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                bg-[#25D366] text-white text-xs font-bold"
            >
              💬 WhatsApp
            </a>

            {/* Status actions */}
            {order.status === 'pending' && (
              <>
                <button
                  type="button"
                  onClick={() => onStatusChange(order.id, 'paid')}
                  className="px-3 py-2 rounded-xl bg-green-500 text-white
                    text-xs font-bold"
                >
                  ✅ Mark Paid
                </button>
                <button
                  type="button"
                  onClick={() => onStatusChange(order.id, 'overdue')}
                  className="px-3 py-2 rounded-xl bg-red-100 dark:bg-red-950
                    text-red-600 dark:text-red-400 text-xs font-bold"
                >
                  🚨 Mark Overdue
                </button>
              </>
            )}

            {order.status === 'paid' && (
              <button
                type="button"
                onClick={() => onStatusChange(order.id, 'shipped')}
                className="px-3 py-2 rounded-xl bg-blue-500 text-white
                  text-xs font-bold"
              >
                🚚 Mark Shipped
              </button>
            )}

            {(order.status === 'pending' || order.status === 'overdue') && (
              <button
                type="button"
                onClick={() => onStatusChange(order.id, 'cancelled')}
                className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800
                  text-gray-600 dark:text-gray-300 text-xs font-bold"
              >
                ✕ Cancel
              </button>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────
export default function OrdersPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [business, setBusiness] = useState<Business | null>(null)
  const [orders,   setOrders]   = useState<OrderWithDetails[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<OrderStatus | 'all'>('all')
  const [search,   setSearch]   = useState('')

  // ── Fetch ──────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: biz } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!biz) { router.push('/onboarding'); return }
    setBusiness(biz)

    const { data: raw } = await supabase
      .from('orders')
      .select(`
        *,
        customers ( name, phone ),
        products  ( name, emoji )
      `)
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false })

    const flat: OrderWithDetails[] = (raw ?? []).map((o) => ({
      ...o,
      customer_name:  o.customers?.name  ?? 'Unknown',
      customer_phone: o.customers?.phone ?? '',
      product_name:   o.products?.name   ?? 'Unknown',
      product_emoji:  o.products?.emoji  ?? '📦',
    }))

    setOrders(flat)
    setLoading(false)
  }, [supabase, router])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // ── Update status ──────────────────────────────────────
  const updateStatus = async (id: string, status: OrderStatus) => {
    await supabase.from('orders').update({ status }).eq('id', id)
    fetchOrders()
  }

  // ── Filtered orders ────────────────────────────────────
  const filtered = orders.filter((o) => {
    const matchFilter = filter === 'all' || o.status === filter
    const matchSearch =
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.product_name.toLowerCase().includes(search.toLowerCase())  ||
      o.order_ref.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  // ── Stats ──────────────────────────────────────────────
  const totalRevenue = orders
    .filter((o) => o.status === 'paid')
    .reduce((s, o) => s + o.amount, 0)

  const pendingCount = orders.filter((o) => o.status === 'pending').length

  // ── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-[#fdf6ef] dark:bg-gray-950
        flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">📦</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading orders...
          </p>
        </div>
      </main>
    )
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#fdf6ef] dark:bg-gray-950 pb-12">
      <div className="max-w-2xl mx-auto px-4 pt-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            📦 Orders
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {orders.length} total ·{' '}
            <span className="text-[#b5860d] font-semibold">
              {formatPrice(totalRevenue)} earned
            </span>
            {pendingCount > 0 && (
              <span className="text-yellow-500 font-semibold">
                {' '}· {pendingCount} pending
              </span>
            )}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2
            text-gray-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, product or order ref..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm
              outline-none transition-colors
              text-gray-900 dark:text-gray-100
              bg-white dark:bg-gray-900
              placeholder-gray-400 dark:placeholder-gray-500
              border-[#f0e8de] dark:border-gray-700
              focus:border-[#b5860d]"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {(['all', 'pending', 'paid', 'shipped', 'overdue', 'cancelled'] as const).map((f) => {
            const count = f === 'all'
              ? orders.length
              : orders.filter((o) => o.status === f).length

            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl',
                  'text-xs font-bold whitespace-nowrap transition-colors',
                  filter === f
                    ? 'bg-[#b5860d] text-white'
                    : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-[#f0e8de] dark:border-gray-700',
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  filter === f
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 dark:bg-gray-800',
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Orders list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {search ? `No orders found for "${search}"` : 'No orders yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={updateStatus}
              />
            ))}
          </div>
        )}

      </div>
    </main>
  )
}