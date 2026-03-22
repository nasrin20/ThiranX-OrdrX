'use client'

// OrdrX — Revenue Chart Component
// Shows daily revenue for the last 7 days

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────
interface DailyRevenue {
  day:     string   // e.g. "Mon"
  revenue: number   // in paise
}

interface RevenueChartProps {
  data: DailyRevenue[]
}

// ── Custom Tooltip ─────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?:  boolean
  payload?: { value: number }[]
  label?:   string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-white dark:bg-gray-800 border border-[#f0e8de]
      dark:border-gray-700 rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-[#b5860d]">
        ₹{((payload[0].value ?? 0) / 100).toLocaleString('en-IN')}
      </p>
    </div>
  )
}

// ── Component ──────────────────────────────────────────────
export function RevenueChart({ data }: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)
  const todayLabel = data[data.length - 1]?.day

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border
      border-[#f0e8de] dark:border-gray-800 p-5">

      <div className="flex items-center justify-between mb-4">
        <div>
          {/* <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            📈 Revenue — Last 7 Days
          </h3> */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Paid orders only
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 dark:text-gray-500">Total</p>
          <p className="text-sm font-bold text-[#b5860d]">
            ₹{(data.reduce((s, d) => s + d.revenue, 0) / 100).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barSize={28}>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
          />
          <YAxis hide />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(181,134,13,0.05)' }}
          />
          <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.day}
                fill={
                  entry.day === todayLabel
                    ? '#b5860d'
                    : '#f0e8de'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}