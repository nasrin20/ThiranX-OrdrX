'use client'

// OrdrX — Orders Table Component
// Shows recent orders with status + actions

import { useState } from 'react'
import { Order, OrderStatus } from '@/types'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────
interface OrderWithCustomer extends Order {
  customer_name:  string
  customer_phone: string
  product_name:   string
}

interface OrdersTableProps {
  orders:    OrderWithCustomer[]
  onRefresh: () => void
}

// ── Status config ──────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: '#92400e', bg: '#fef9c3' },
  paid:      { label: 'Paid',      color: '#14532d', bg: '#dcfce7' },
  shipped:   { label: 'Shipped',   color: '#1e3a8a', bg: '#dbeafe' },
  cancelled: { label: 'Cancelled', color: '#6b7280', bg: '#f3f4f6' },
  overdue:   { label: 'Overdue',   color: '#991b1b', bg: '#fee2e2' },
}

// ── Status Badge ───────────────────────────────────────────
function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

// ── Order Row ──────────────────────────────────────────────
function OrderRow({
  order,
  onStatusChange,
}: {
  order:          OrderWithCustomer
  onStatusChange: (id: string, status: OrderStatus) => void
}) {
  const [open, setOpen] = useState(false)

  const amount    = `₹${(order.amount / 100).toLocaleString('en-IN')}`
  const date      = new Date(order.created_at).toLocaleDateString('en-IN', {
    day:   'numeric',
    month: 'short',
  })
  const whatsappLink = `https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=Hi ${order.customer_name}! Your order ${order.order_ref} for ${order.product_name} is confirmed. Total: ${amount}. Please complete payment to proceed. — OrdrX`

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0">
      {/* Main row */}
      <div
        className="flex items-center gap-3 py-3 px-1 cursor-pointer
          hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#fdf6ef] dark:bg-gray-800
          flex items-center justify-center text-sm font-bold text-[#b5860d]
          flex-shrink-0">
          {order.customer_name.slice(0, 2).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {order.customer_name}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {order.product_name}
            {order.variant ? ` · ${order.variant}` : ''}
            {order.quantity > 1 ? ` × ${order.quantity}` : ''}
          </p>
        </div>

        {/* Amount + status */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-[#b5860d]">{amount}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{date}</p>
        </div>

        {/* Status */}
        <StatusBadge status={order.status} />

        {/* Chevron */}
        <span className={cn(
          'text-gray-400 text-xs transition-transform',
          open ? 'rotate-180' : '',
        )}>
          ▼
        </span>
      </div>

      {/* Expanded actions */}
      {open && (
        <div className="pb-3 px-1 flex flex-wrap gap-2">
          <p className="w-full text-xs text-gray-400 dark:text-gray-500 mb-1">
            Ref: {order.order_ref} · {order.customer_phone}
          </p>

          {/* WhatsApp remind */}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              bg-[#25D366] text-white text-xs font-bold"
          >
            💬 Send WhatsApp
          </a>

          {/* Status update buttons */}
          {order.status === 'pending' && (
            <button
              type="button"
              onClick={() => onStatusChange(order.id, 'paid')}
              className="px-3 py-1.5 rounded-lg bg-green-500 text-white
                text-xs font-bold"
            >
              ✅ Mark Paid
            </button>
          )}

          {order.status === 'paid' && (
            <button
              type="button"
              onClick={() => onStatusChange(order.id, 'shipped')}
              className="px-3 py-1.5 rounded-lg bg-blue-500 text-white
                text-xs font-bold"
            >
              🚚 Mark Shipped
            </button>
          )}

          {(order.status === 'pending' || order.status === 'overdue') && (
            <button
              type="button"
              onClick={() => onStatusChange(order.id, 'cancelled')}
              className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700
                text-gray-600 dark:text-gray-300 text-xs font-bold"
            >
              ✕ Cancel
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────
export function OrdersTable({ orders, onRefresh }: OrdersTableProps) {
  const supabase = createClient()
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')

  // ── Update status ────────────────────────────────────────
  const updateStatus = async (id: string, status: OrderStatus) => {
    await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)

    onRefresh()
  }

  // ── Filter ───────────────────────────────────────────────
  const filtered = filter === 'all'
    ? orders
    : orders.filter((o) => o.status === filter)

  const filters: { label: string; value: OrderStatus | 'all' }[] = [
    { label: 'All',      value: 'all'      },
    { label: 'Pending',  value: 'pending'  },
    { label: 'Paid',     value: 'paid'     },
    { label: 'Shipped',  value: 'shipped'  },
    { label: 'Overdue',  value: 'overdue'  },
  ]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border
      border-[#f0e8de] dark:border-gray-800">

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b
        border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          📦 Recent Orders
        </h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {orders.length} total
        </span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-3 border-b border-gray-100 dark:border-gray-800
        overflow-x-auto">
        {filters.map((f) => {
          const count = f.value === 'all'
            ? orders.length
            : orders.filter((o) => o.status === f.value).length

          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                'flex items-center gap-1 px-3 py-1 rounded-lg text-xs',
                'font-semibold whitespace-nowrap transition-colors',
                filter === f.value
                  ? 'bg-[#b5860d] text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
            >
              {f.label}
              {count > 0 && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  filter === f.value
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500',
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Orders */}
      <div className="p-3">
        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No {filter === 'all' ? '' : filter} orders yet
            </p>
          </div>
        ) : (
          filtered.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onStatusChange={updateStatus}
            />
          ))
        )}
      </div>
    </div>
  )
}