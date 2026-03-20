'use client'

// OrdrX — Customers Page

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────
interface CustomerWithStats {
  id:               string
  name:             string
  phone:            string | null
  email:            string | null
  instagram_handle: string | null
  notes:            string | null
  created_at:       string
  totalOrders:      number
  totalSpent:       number
  lastOrderDate:    string | null
}

interface RawOrder {
  customer_id: string
  amount:      number
  status:      string
  created_at:  string
}

// ── Helpers ────────────────────────────────────────────────
const formatPrice = (paise: number) =>
  `₹${(paise / 100).toLocaleString('en-IN')}`

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day:   'numeric',
    month: 'short',
  })
}

// ── Avatar ─────────────────────────────────────────────────
function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const colors = ['#b5860d', '#7c4dca', '#22c47a', '#e05c2a', '#1a8a6e', '#d4478a']
  const color  = colors[name.charCodeAt(0) % colors.length]

  return (
    <div style={{
      width: size, height: size, background: color,
      borderRadius: '50%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.38,
      fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

// ── Customer Card ──────────────────────────────────────────
function CustomerCard({ customer }: { customer: CustomerWithStats }) {
  const [expanded, setExpanded] = useState(false)

  const whatsappLink = customer.phone
    ? `https://wa.me/${customer.phone.replace(/\D/g, '')}`
    : null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border
      border-[#f0e8de] dark:border-gray-800 overflow-hidden">

      <div
        className="flex items-center gap-3 p-4 cursor-pointer
          hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <Avatar name={customer.name} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {customer.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {customer.phone ?? '—'}
            {customer.instagram_handle && (
              <span className="ml-2 text-[#b5860d]">
                @{customer.instagram_handle}
              </span>
            )}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-[#b5860d]">
            {formatPrice(customer.totalSpent)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {customer.totalOrders} order{customer.totalOrders !== 1 ? 's' : ''}
          </p>
        </div>

        <span className={cn(
          'text-gray-400 text-xs transition-transform flex-shrink-0',
          expanded && 'rotate-180',
        )}>▼</span>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-2 gap-2 py-3">
            {([
              ['Total Orders', String(customer.totalOrders)],
              ['Total Spent',  formatPrice(customer.totalSpent)],
              ['Last Order',   formatDate(customer.lastOrderDate)],
              ['Member Since', formatDate(customer.created_at)],
              ['Email',        customer.email ?? '—'],
              ['Instagram',    customer.instagram_handle
                ? `@${customer.instagram_handle}` : '—'],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {customer.notes && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl
              px-3 py-2 mb-3">
              <p className="text-xs text-gray-400 mb-0.5">Note</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {customer.notes}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                  bg-[#25D366] text-white text-xs font-bold"
              >
                💬 WhatsApp
              </a>
            )}
            {customer.email && (
              <a
                href={`mailto:${customer.email}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                  bg-blue-500 text-white text-xs font-bold"
              >
                ✉️ Email
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────
export default function CustomersPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [sortBy,    setSortBy]    = useState<'spent' | 'orders' | 'recent'>('spent')

  // ── Fetch ──────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: biz } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!biz) { router.push('/onboarding'); return }

    // Fetch customers
    const { data: rawCustomers } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false })

    if (!rawCustomers) { setLoading(false); return }

    // Fetch orders (no join — simple query)
    const { data: orders } = await supabase
      .from('orders')
      .select('customer_id, amount, status, created_at')
      .eq('business_id', biz.id)

    const rawOrders: RawOrder[] = orders ?? []

    // Build stats per customer
    const withStats: CustomerWithStats[] = rawCustomers.map((c) => {
      const cOrders = rawOrders.filter((o) => o.customer_id === c.id)
      const paid    = cOrders.filter((o) => o.status === 'paid')
      const last    = cOrders.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

      return {
        id:               c.id,
        name:             c.name,
        phone:            c.phone        ?? null,
        email:            c.email        ?? null,
        instagram_handle: c.instagram_handle ?? null,
        notes:            c.notes        ?? null,
        created_at:       c.created_at,
        totalOrders:      cOrders.length,
        totalSpent:       paid.reduce((s, o) => s + o.amount, 0),
        lastOrderDate:    last?.created_at ?? null,
      }
    })

    setCustomers(withStats)
    setLoading(false)
  }, [supabase, router])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  // ── Sort + filter ──────────────────────────────────────
  const filtered = customers
    .filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'spent')  return b.totalSpent  - a.totalSpent
      if (sortBy === 'orders') return b.totalOrders - a.totalOrders
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const totalSpent   = customers.reduce((s, c) => s + c.totalSpent, 0)
  const repeatBuyers = customers.filter((c) => c.totalOrders > 1).length

  // ── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-[#fdf6ef] dark:bg-gray-950
        flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">👥</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading customers...
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
            👥 Customers
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {customers.length} total ·{' '}
            <span className="text-[#b5860d] font-semibold">
              {formatPrice(totalSpent)} lifetime value
            </span>
            {repeatBuyers > 0 && (
              <span className="text-green-500 font-semibold">
                {' '}· {repeatBuyers} repeat buyers
              </span>
            )}
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total',   value: String(customers.length), color: '#4e8ef7' },
            { label: 'Repeat',  value: String(repeatBuyers),     color: '#22c47a' },
            { label: 'Revenue', value: formatPrice(totalSpent),  color: '#b5860d' },
          ].map((s) => (
            <div key={s.label}
              className="bg-white dark:bg-gray-900 rounded-2xl border
                border-[#f0e8de] dark:border-gray-800 p-3 text-center">
              <p className="text-lg font-bold" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Search + sort */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2
              text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm
                outline-none transition-colors
                text-gray-900 dark:text-gray-100
                bg-white dark:bg-gray-900
                placeholder-gray-400 dark:placeholder-gray-500
                border-[#f0e8de] dark:border-gray-700
                focus:border-[#b5860d]"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2.5 rounded-xl border text-sm outline-none
              text-gray-700 dark:text-gray-300
              bg-white dark:bg-gray-900
              border-[#f0e8de] dark:border-gray-700"
          >
            <option value="spent">Top spenders</option>
            <option value="orders">Most orders</option>
            <option value="recent">Most recent</option>
          </select>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">👤</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {search
                ? `No customers found for "${search}"`
                : 'No customers yet. Share your store link!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </div>
        )}

      </div>
    </main>
  )
}