'use client'

// OrdrX — Storefront Client Component
// Shows real product photos, fixes MRP display bug

import { useState } from 'react'
import { Business, Product, BusinessType } from '@/types'
import { BUSINESS_TYPE_CONFIG } from '@/constants/businessTypes'
import { createClient } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────
interface StorefrontClientProps {
  business: Business
  products: Product[]
}

interface OrderForm {
  customerName:  string
  customerPhone: string
  variant:       string
  quantity:      number
  note:          string
}

interface ProductItemProps {
  product:  Product
  color:    string
  badge:    string | null
  onSelect: (p: Product) => void
}

type Screen = 'shop' | 'detail' | 'checkout' | 'confirmed'

// ── Helpers ────────────────────────────────────────────────
const generateRef = (): string =>
  'ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase()

const formatPrice = (paise: number): string =>
  `₹${(paise / 100).toLocaleString('en-IN')}`

// Returns discount % only when MRP is valid and greater than price
const getDiscount = (price: number, mrp: number | null): number | null => {
  if (!mrp || mrp <= 0 || mrp <= price) return null
  return Math.round((1 - price / mrp) * 100)
}

// ── Product Thumbnail ──────────────────────────────────────
function ProductThumbnail({
  photoUrl,
  emoji,
  name,
  color,
  large = false,
}: {
  photoUrl: string | null
  emoji:    string
  name:     string
  color:    string
  large?:   boolean
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={large
          ? 'w-full h-full object-cover'
          : 'w-full h-full object-cover'
        }
      />
    )
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: `${color}15` }}
    >
      <span className={large ? 'text-7xl' : 'text-4xl'}>{emoji}</span>
    </div>
  )
}

// ── Product Item (grid card) ───────────────────────────────
function ProductItem({ product, color, badge, onSelect }: ProductItemProps) {
  const discount = getDiscount(product.price, product.mrp ?? null)

  return (
    <div
      onClick={() => onSelect(product)}
      className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden
        cursor-pointer hover:shadow-lg transition-all active:scale-[0.98]
        border-2 border-transparent hover:border-current"
      style={{ '--hover-color': color } as React.CSSProperties}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
    >
      {/* Image / Emoji area */}
      <div className="h-36 relative overflow-hidden"
        style={{ background: `${color}15` }}>
        <ProductThumbnail
          photoUrl={product.photo_url ?? null}
          emoji={product.emoji}
          name={product.name}
          color={color}
        />
        {product.tag && (
          <span
            className="absolute top-2 left-2 text-xs font-bold
              px-2 py-0.5 rounded-full"
            style={{ background: color, color: '#fff' }}
          >
            {product.tag}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white
          leading-tight mb-1 truncate">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 line-clamp-1">
            {product.description}
          </p>
        )}

        {/* Variants */}
        {product.variants.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {product.variants.slice(0, 2).map((v) => (
              <span key={v}
                className="text-xs bg-gray-100 dark:bg-gray-800
                  text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-md">
                {v}
              </span>
            ))}
            {product.variants.length > 2 && (
              <span className="text-xs text-gray-400">
                +{product.variants.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-bold" style={{ color }}>
            {formatPrice(product.price)}
          </span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.mrp)}
            </span>
          )}
          {discount && (
            <span className="text-xs font-bold text-green-500">
              {discount}% off
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────
export function StorefrontClient({ business, products }: StorefrontClientProps) {
  const supabase = createClient()
  const config   = BUSINESS_TYPE_CONFIG[business.type as BusinessType]

  const [screen,   setScreen]   = useState<Screen>('shop')
  const [selected, setSelected] = useState<Product | null>(null)
  const [orderRef, setOrderRef] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const [form, setForm] = useState<OrderForm>({
    customerName:  '',
    customerPhone: '',
    variant:       '',
    quantity:      1,
    note:          '',
  })

  // ── Helpers ──────────────────────────────────────────────
  const update = (field: keyof OrderForm, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const totalAmount = selected ? selected.price * form.quantity : 0

  const selectProduct = (product: Product) => {
    setSelected(product)
    setForm((prev) => ({
      ...prev,
      variant:  product.variants[0] ?? '',
      quantity: 1,
    }))
    setScreen('detail')
  }

  // ── Place order ───────────────────────────────────────────
  const placeOrder = async () => {
    if (!selected) return

    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      setError('Please fill in your name and WhatsApp number.')
      return
    }

    setLoading(true)
    setError(null)

    const ref = generateRef()

    // Upsert customer
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .upsert(
        {
          business_id: business.id,
          name:        form.customerName.trim(),
          phone:       form.customerPhone.trim(),
        },
        { onConflict: 'business_id,phone' }
      )
      .select()
      .single()

    if (custError || !customer) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    // Create order
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        business_id: business.id,
        customer_id: customer.id,
        order_ref:   ref,
        product_id:  selected.id,
        variant:     form.variant || null,
        quantity:    form.quantity,
        amount:      totalAmount,
        status:      'pending',
        notes:       form.note.trim() || null,
      })

    if (orderError) {
      setError('Failed to place order. Please try again.')
      setLoading(false)
      return
    }

    // Reduce stock
    await supabase
      .from('products')
      .update({ stock: selected.stock - form.quantity })
      .eq('id', selected.id)

    setOrderRef(ref)
    setScreen('confirmed')
    setLoading(false)
  }

  // ── Input class ───────────────────────────────────────────
  const inputCls = [
    'w-full px-4 py-3 rounded-xl border text-sm',
    'outline-none transition-colors',
    'text-gray-900 bg-white placeholder-gray-400',
    'dark:text-gray-100 dark:bg-gray-800 dark:placeholder-gray-500',
    'border-gray-200 dark:border-gray-700',
    `focus:border-[${config.color}]`,
  ].join(' ')

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── HEADER ── */}
      <div
        className="px-4 pt-10 pb-6 text-center relative overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${config.color}ee, ${config.color}99)` }}
      >
        {(screen === 'detail' || screen === 'checkout') && (
          <button
            type="button"
            onClick={() => setScreen(screen === 'checkout' ? 'detail' : 'shop')}
            aria-label="Go back"
            className="absolute left-4 top-4 text-white text-2xl font-light"
          >
            ←
          </button>
        )}

        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center
          justify-center text-3xl mx-auto mb-3">
          {config.emoji}
        </div>

        <h1 className="text-xl font-bold text-white mb-1">{business.name}</h1>
        <p className="text-sm text-white/70 mb-2">@{business.slug}</p>

        {business.bio && (
          <p className="text-sm text-white/80 max-w-xs mx-auto mb-3">
            {business.bio}
          </p>
        )}

        <div className="flex justify-center gap-2 flex-wrap">
          {config.badge && (
            <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full">
              {config.badge}
            </span>
          )}
          <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full">
            💬 WhatsApp orders
          </span>
          <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full">
            🚚 Ships India
          </span>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-md mx-auto px-4 py-6">

        {/* ── SHOP ── */}
        {screen === 'shop' && (
          <>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500
              uppercase tracking-wide mb-4">
              {products.length} Products
            </p>

            {products.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🛍️</div>
                <p className="text-gray-500 dark:text-gray-400">
                  No products available yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.map((p) => (
                  <ProductItem
                    key={p.id}
                    product={p}
                    color={config.color}
                    badge={config.badge}
                    onSelect={selectProduct}
                  />
                ))}
              </div>
            )}

            {business.whatsapp && (
              <a
                href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 mt-6
                  bg-[#25D366] hover:bg-[#20b858] text-white
                  rounded-2xl py-3 font-bold text-sm transition-colors"
              >
                💬 Chat on WhatsApp
              </a>
            )}
          </>
        )}

        {/* ── DETAIL ── */}
        {screen === 'detail' && selected && (
          <div>
            {/* Product image */}
            <div className="h-56 rounded-2xl overflow-hidden mb-4"
              style={{ background: `${config.color}15` }}>
              <ProductThumbnail
                photoUrl={selected.photo_url ?? null}
                emoji={selected.emoji}
                name={selected.name}
                color={config.color}
                large
              />
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {selected.name}
            </h2>

            {selected.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {selected.description}
              </p>
            )}

            {/* Variant selector */}
            {selected.variants.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase
                  tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                  Select Option
                </label>
                <div className="flex flex-wrap gap-2">
                  {selected.variants.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => update('variant', v)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold
                        border-2 transition-colors"
                      style={{
                        background:  form.variant === v ? config.color : 'transparent',
                        color:       form.variant === v ? '#fff' : config.color,
                        borderColor: config.color,
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase
                tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => update('quantity', Math.max(1, form.quantity - 1))}
                  className="w-10 h-10 rounded-full border-2 text-lg font-bold
                    flex items-center justify-center"
                  style={{ borderColor: config.color, color: config.color }}
                >
                  −
                </button>
                <span className="text-xl font-bold text-gray-900 dark:text-white
                  min-w-8 text-center">
                  {form.quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    update('quantity', Math.min(selected.stock, form.quantity + 1))
                  }
                  className="w-10 h-10 rounded-full text-white text-lg font-bold
                    flex items-center justify-center"
                  style={{ background: config.color }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Total */}
            <div
              className="rounded-2xl p-4 mb-6 flex justify-between items-center"
              style={{ background: `${config.color}15` }}
            >
              <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
              <span className="text-2xl font-bold" style={{ color: config.color }}>
                {formatPrice(totalAmount)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setScreen('checkout')}
              className="w-full py-4 rounded-2xl text-white text-base font-bold
                transition-all active:scale-[0.98]"
              style={{ background: config.color }}
            >
              Order Now →
            </button>
          </div>
        )}

        {/* ── CHECKOUT ── */}
        {screen === 'checkout' && selected && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Your Details
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Order confirmation sent to your WhatsApp
            </p>

            {/* Summary */}
            <div
              className="rounded-2xl p-4 mb-6 flex items-center gap-3"
              style={{ background: `${config.color}15` }}
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                style={{ background: `${config.color}15` }}>
                <ProductThumbnail
                  photoUrl={selected.photo_url ?? null}
                  emoji={selected.emoji}
                  name={selected.name}
                  color={config.color}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {selected.name}
                </p>
                {form.variant && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {form.variant} × {form.quantity}
                  </p>
                )}
              </div>
              <span className="text-base font-bold flex-shrink-0"
                style={{ color: config.color }}>
                {formatPrice(totalAmount)}
              </span>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200
                dark:border-red-800 text-red-600 dark:text-red-400
                text-sm rounded-xl px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={form.customerName}
                onChange={(e) => update('customerName', e.target.value)}
                placeholder="Your full name"
                className={inputCls}
              />
              <input
                type="tel"
                value={form.customerPhone}
                onChange={(e) => update('customerPhone', e.target.value)}
                placeholder="WhatsApp number"
                className={inputCls}
              />
              <textarea
                value={form.note}
                onChange={(e) => update('note', e.target.value)}
                placeholder="Any special note? (optional)"
                rows={2}
                className={inputCls + ' resize-none'}
              />
            </div>

            <button
              type="button"
              onClick={placeOrder}
              disabled={loading}
              className="w-full py-4 rounded-2xl text-white text-base font-bold
                transition-all disabled:opacity-50 active:scale-[0.98]"
              style={{ background: config.color }}
            >
              {loading
                ? 'Placing order...'
                : `Confirm Order — ${formatPrice(totalAmount)}`}
            </button>

            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
              Seller will contact you on WhatsApp to confirm payment
            </p>
          </div>
        )}

        {/* ── CONFIRMED ── */}
        {screen === 'confirmed' && selected && (
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center
                text-4xl mx-auto mb-4"
              style={{ background: `${config.color}20` }}
            >
              ✅
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Order Confirmed! 🎉
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {business.name} will contact you on WhatsApp soon.
            </p>

            {/* Receipt */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border
              border-gray-100 dark:border-gray-800 p-4 text-left mb-4">
              {[
                ['Order Ref',  orderRef],
                ['Product',    selected.name],
                ['Variant',    form.variant || '—'],
                ['Quantity',   String(form.quantity)],
                ['Amount',     formatPrice(totalAmount)],
                ['Your Name',  form.customerName],
                ['WhatsApp',   form.customerPhone],
              ].map(([label, value]) => (
                <div key={label}
                  className="flex justify-between py-2 border-b
                    border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {business.whatsapp && (
              <a
                href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}?text=Hi! I just placed order ${orderRef} on OrdrX.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2
                  bg-[#25D366] hover:bg-[#20b858] text-white
                  rounded-2xl py-3 font-bold text-sm transition-colors mb-3"
              >
                💬 Message {business.name} on WhatsApp
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                setScreen('shop')
                setSelected(null)
                setForm({
                  customerName:  '',
                  customerPhone: '',
                  variant:       '',
                  quantity:      1,
                  note:          '',
                })
              }}
              className="text-sm font-semibold"
              style={{ color: config.color }}
            >
              ← Back to shop
            </button>
          </div>
        )}

      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 dark:text-gray-600 py-6">
        ⚡ Powered by OrdrX · ThiranX
      </p>

    </div>
  )
}