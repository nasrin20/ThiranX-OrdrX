// OrdrX — Dashboard Layout
// Wraps all dashboard pages with navigation

import { NavBar } from '@/components/ui/NavBar'

// ── Types ──────────────────────────────────────────────────
interface DashboardLayoutProps {
  children: React.ReactNode
}

// ── Layout ─────────────────────────────────────────────────
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#fdf6ef] dark:bg-gray-950">

      {/* Navigation */}
      <NavBar />

      {/* Page content */}
      {/* 
        Mobile:  pb-20 → space for bottom nav
        Desktop: lg:pl-56 → space for side nav
      */}
      <div className="pb-20 lg:pb-0 lg:pl-56">
        {children}
      </div>

    </div>
  )
}