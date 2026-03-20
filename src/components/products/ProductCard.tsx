'use client'

// OrdrX — Product Card Component
// Shows photo if available, emoji as fallback

import { useState } from 'react'
import { Product } from '@/types'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────
interface ProductCardProps {
  product:        Product
  onEdit:         (product: Product) => void
  onDelete:       (product: Product) => void
  onToggleActive: (product: Product) => void
}

// ── Toggle ─────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-label="Toggle product visibility"
      className={cn(
        'relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0',
        on ? 'bg-[#b5860d]' : 'bg-gray-200 dark:bg-gray-700',
      )}
    >
      <div className={cn(
        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
        on ? 'translate-x-5' : 'translate-x-0.5',
      )} />
    </button>
  )
}

// ── Stock Bar ──────────────────────────────────────────────
function StockBar({ stock }: { stock: number }) {
  const max   = 20
  const pct   = Math.min(100, (stock / max) * 100)
  const color =
    stock === 0 ? 'bg-red-400' :
    stock < 5   ? 'bg-yellow-400' :
    'bg-green-400'

  return (
    <div className="mt-2">
      <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={cn(
        'text-xs mt-0.5 font-semibold',
        stock === 0 ? 'text-red-400' :
        stock < 5   ? 'text-yellow-500' :
        'text-green-500',
      )}>
        {stock === 0 ? 'Out of stock' : `${stock} in stock`}
      </p>
    </div>
  )
}

// ── Product Thumbnail ──────────────────────────────────────
function ProductThumbnail({
  photoUrl,
  emoji,
  name,
}: {
  photoUrl: string | null
  emoji:    string
  name:     string
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
      />
    )
  }

  return (
    <div className="w-14 h-14 rounded-xl bg-[#fdf6ef] dark:bg-gray-800
      flex items-center justify-center text-2xl flex-shrink-0">
      {emoji}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────
export function ProductCard({
  product,
  onEdit,
  onDelete,
  onToggleActive,
}: ProductCardProps) {
  const [showDelete, setShowDelete] = useState(false)

  const price    = `₹${(product.price / 100).toLocaleString('en-IN')}`
  const mrp      = product.mrp && product.mrp > 0
    ? `₹${(product.mrp / 100).toLocaleString('en-IN')}`
    : null
  const discount = product.mrp && product.mrp > product.price
    ? Math.round((1 - product.price / product.mrp) * 100)
    : null

  return (
    <div className={cn(
      'bg-white dark:bg-gray-900 rounded-2xl border p-4 transition-all',
      product.active
        ? 'border-[#f0e8de] dark:border-gray-800'
        : 'border-dashed border-gray-200 dark:border-gray-700 opacity-60',
    )}>
      <div className="flex gap-3">

        {/* Thumbnail — photo or emoji */}
        <ProductThumbnail
          photoUrl={product.photo_url ?? null}
          emoji={product.emoji}
          name={product.name}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">

              {/* Name + Tag */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {product.name}
                </h3>
                {product.tag && (
                  <span className="text-xs bg-[#fdf6ef] dark:bg-gray-800
                    text-[#b5860d] px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                    {product.tag}
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {product.description}
                </p>
              )}

              {/* Variants */}
              {product.variants.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {product.variants.map((v) => (
                    <span key={v}
                      className="text-xs bg-gray-100 dark:bg-gray-800
                        text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-md">
                      {v}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Toggle */}
            <Toggle on={product.active} onChange={() => onToggleActive(product)} />
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-base font-bold text-[#b5860d]">{price}</span>
            {mrp && (
              <span className="text-xs text-gray-400 line-through">{mrp}</span>
            )}
            {discount && (
              <span className="text-xs bg-green-50 dark:bg-green-950
                text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-md font-semibold">
                {discount}% off
              </span>
            )}
          </div>

          {/* Stock */}
          <StockBar stock={product.stock} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3
        border-t border-gray-100 dark:border-gray-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(product)}
          className="flex-1"
        >
          ✏️ Edit
        </Button>

        {!showDelete ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDelete(true)}
            className="flex-1 !text-red-400 hover:!bg-red-50 dark:hover:!bg-red-950"
          >
            🗑️ Delete
          </Button>
        ) : (
          <div className="flex gap-2 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDelete(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(product)}
              className="flex-1"
            >
              Confirm
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}