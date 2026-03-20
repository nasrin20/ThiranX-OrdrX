'use client'

// OrdrX — Navigation Bar
// Bottom nav for mobile, side nav for desktop

import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────
interface NavItem {
  label: string
  icon:  string
  href:  string
}

// ── Nav Items ──────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: '📊', href: '/dashboard'  },
  { label: 'Products',  icon: '🧴', href: '/products'   },
  { label: 'Orders',    icon: '📦', href: '/orders'     },
  { label: 'Customers', icon: '👥', href: '/customers'  },
]

// ── Component ──────────────────────────────────────────────
export function NavBar() {
  const pathname = usePathname()
  const router   = useRouter()

  return (
    <>
      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50
        bg-white dark:bg-gray-900
        border-t border-[#f0e8de] dark:border-gray-800
        flex items-center
        lg:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href

          return (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1',
                'py-3 px-2 transition-colors',
                isActive
                  ? 'text-[#b5860d]'
                  : 'text-gray-400 dark:text-gray-500 hover:text-[#b5860d]',
              )}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className={cn(
                'text-xs font-semibold',
                isActive ? 'text-[#b5860d]' : 'text-gray-400 dark:text-gray-500',
              )}>
                {item.label}
              </span>
              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5
                  bg-[#b5860d] rounded-full" />
              )}
            </button>
          )
        })}
      </nav>

      {/* ── DESKTOP SIDE NAV ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0
        w-56 flex-col
        bg-white dark:bg-gray-900
        border-r border-[#f0e8de] dark:border-gray-800
        z-50">

        {/* Logo */}
        <div className="px-6 py-6 border-b border-[#f0e8de] dark:border-gray-800">
          <h1 className="text-xl font-bold text-[#1a1a2e] dark:text-white">
            ⚡ OrdrX
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            by ThiranX
          </p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5',
                  'rounded-xl text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-[#fdf6ef] dark:bg-gray-800 text-[#b5860d]'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-[#b5860d]',
                )}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#b5860d]" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#f0e8de] dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            ⚡ OrdrX · ThiranX
          </p>
        </div>
      </aside>
    </>
  )
}