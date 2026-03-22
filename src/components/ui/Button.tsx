// OrdrX — Reusable Button Component

import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'


// ── Types ──────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?:    'sm' | 'md' | 'lg'
  loading?: boolean
}

// ── Variant styles ─────────────────────────────────────────
const variants = {
  primary: [
    'bg-[#b5860d] hover:bg-[#9a7209] text-white',
    'disabled:opacity-50',
  ].join(' '),

  secondary: [
    'border border-[#f0e8de] dark:border-gray-700',
    'text-gray-600 dark:text-gray-400',
    'hover:border-[#b5860d] hover:text-[#b5860d]',
    'bg-white dark:bg-gray-900',
  ].join(' '),

  danger: [
    'bg-red-500 hover:bg-red-600 text-white',
    'disabled:opacity-50',
  ].join(' '),

  ghost: [
    'text-gray-500 dark:text-gray-400',
    'hover:text-[#b5860d] hover:bg-[#fdf6ef]',
    'dark:hover:bg-gray-800',
  ].join(' '),
}

// ── Size styles ────────────────────────────────────────────
const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-sm rounded-xl',
}

// ── Component ──────────────────────────────────────────────
export function Button({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        // Base styles
        'font-bold transition-colors cursor-pointer',
        'disabled:cursor-not-allowed',
        // Variant + size
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}