// OrdrX — Stats Row Component
// Shows key metrics at the top of the dashboard

'use client'

// ── Types ──────────────────────────────────────────────────
interface Stat {
  label:    string
  value:    string
  sub:      string
  icon:     string
  color:    string
  bg:       string
}

interface StatsRowProps {
  totalRevenue:  number
  pendingAmount: number
  totalOrders:   number
  overdueCount:  number
}

// ── Component ──────────────────────────────────────────────
export function StatsRow({
  totalRevenue,
  pendingAmount,
  totalOrders,
  overdueCount,
}: StatsRowProps) {
  const stats: Stat[] = [
    {
      label: 'Revenue',
      value: `₹${(totalRevenue / 100).toLocaleString('en-IN')}`,
      sub: 'Paid + Shipped',
      icon:  '💰',
      color: '#22c47a',
      bg:    '#dcfce7',
    },
    {
      label: 'Pending',
      value: `₹${(pendingAmount / 100).toLocaleString('en-IN')}`,
      sub:   'Awaiting payment',
      icon:  '⏳',
      color: '#f5a623',
      bg:    '#fef9c3',
    },
    {
      label: 'Orders',
      value: String(totalOrders),
      sub:   'All time',
      icon:  '📦',
      color: '#4e8ef7',
      bg:    '#dbeafe',
    },
    {
      label: 'Overdue',
      value: String(overdueCount),
      sub:   'Need follow-up',
      icon:  '🚨',
      color: '#ef4444',
      bg:    '#fee2e2',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white dark:bg-gray-900 rounded-2xl border
            border-[#f0e8de] dark:border-gray-800 p-4"
          style={{ borderTop: `3px solid ${s.color}` }}
        >
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide
              text-gray-400 dark:text-gray-500">
              {s.label}
            </p>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: s.bg }}
            >
              {s.icon}
            </div>
          </div>
          <p
            className="text-2xl font-bold mb-0.5"
            style={{ color: s.color }}
          >
            {s.value}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{s.sub}</p>
        </div>
      ))}
    </div>
  )
}