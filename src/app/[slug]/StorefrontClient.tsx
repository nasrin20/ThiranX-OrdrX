'use client'

// OrdrX — Storefront Client
// Dynamic theme color + background from seller settings

import { useState } from 'react'
import { Business, Product, BusinessType } from '@/types'
import { BUSINESS_TYPE_CONFIG } from '@/constants/businessTypes'

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
  onSelect: (p: Product) => void
}

type Screen = 'shop' | 'detail' | 'checkout' | 'confirmed'

// ── Helpers ────────────────────────────────────────────────
const formatPrice = (paise: number): string =>
  `₹${(paise / 100).toLocaleString('en-IN')}`

const getDiscount = (price: number, mrp: number | null): number | null => {
  if (!mrp || mrp <= 0 || mrp <= price) return null
  return Math.round((1 - price / mrp) * 100)
}

// ── Get header style based on theme_bg ────────────────────
const getHeaderStyle = (color: string, bg: string): React.CSSProperties => {
  if (bg === 'solid')    return { background: color }
  if (bg === 'dark')     return { background: '#1a1a2e' }
  if (bg === 'soft')     return { background: `${color}22`, }
  // default: gradient
  return { background: `linear-gradient(160deg, ${color}ee, ${color}99)` }
}

// ── Get text color based on bg ─────────────────────────────
const getTextColor = (bg: string, color: string): string => {
  if (bg === 'soft') return color
  return '#ffffff'
}

// ── Product Thumbnail ──────────────────────────────────────
function ProductThumbnail({
  photoUrl, emoji, name, color,
}: {
  photoUrl: string | null
  emoji:    string
  name:     string
  color:    string
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
    )
  }
  return (
    <div className="w-full h-full flex items-center justify-center"
      style={{ background: `${color}15` }}>
      <span className="text-4xl">{emoji}</span>
    </div>
  )
}

// ── Store Avatar ───────────────────────────────────────────
function StoreAvatar({ logoUrl, name, emoji }: {
  logoUrl: string | null; name: string; emoji: string
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
    )
  }
  return (
    <div className="w-full h-full flex items-center justify-center text-3xl">
      {emoji}
    </div>
  )
}

// ── Product Item ───────────────────────────────────────────
function ProductItem({ product, color, onSelect }: ProductItemProps) {
  const discount = getDiscount(product.price, product.mrp ?? null)

  return (
    <div
      onClick={() => onSelect(product)}
      className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden
        cursor-pointer hover:shadow-lg transition-all active:scale-[0.98]
        border-2 border-transparent"
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
    >
      <div className="h-36 relative overflow-hidden" style={{ background: `${color}15` }}>
        <ProductThumbnail
          photoUrl={product.photo_url ?? null}
          emoji={product.emoji}
          name={product.name}
          color={color}
        />
        {product.tag && (
          <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: color, color: '#fff' }}>
            {product.tag}
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1 truncate">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-400 mb-2 line-clamp-1">{product.description}</p>
        )}
        {product.variants.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {product.variants.slice(0, 2).map((v) => (
              <span key={v} className="text-xs bg-gray-100 dark:bg-gray-800
                text-gray-500 px-1.5 py-0.5 rounded-md">{v}</span>
            ))}
            {product.variants.length > 2 && (
              <span className="text-xs text-gray-400">+{product.variants.length - 2}</span>
            )}
          </div>
        )}
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
            <span className="text-xs font-bold text-green-500">{discount}% off</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────
export function StorefrontClient({ business, products }: StorefrontClientProps) {
  const config = BUSINESS_TYPE_CONFIG[business.type as BusinessType]

  // Use seller's custom theme color or fallback to business type color
  const color  = business.theme_color || config.color
  const bg     = (business as Business & { theme_bg?: string }).theme_bg || 'gradient'

  const headerStyle = getHeaderStyle(color, bg)
  const textColor   = getTextColor(bg, color)
  const isLight     = bg === 'soft'

  const [screen,   setScreen]   = useState<Screen>('shop')
  const [selected, setSelected] = useState<Product | null>(null)
  const [orderRef, setOrderRef] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const [form, setForm] = useState<OrderForm>({
    customerName: '', customerPhone: '', variant: '', quantity: 1, note: '',
  })

  const update = (field: keyof OrderForm, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const totalAmount = selected ? selected.price * form.quantity : 0

  const selectProduct = (product: Product) => {
    setSelected(product)
    setForm((prev) => ({ ...prev, variant: product.variants[0] ?? '', quantity: 1 }))
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

    try {
      const response = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id:    business.id,
          customer_name:  form.customerName.trim(),
          customer_phone: form.customerPhone.trim(),
          product_id:     selected.id,
          variant:        form.variant || null,
          quantity:       form.quantity,
          amount:         totalAmount,
          notes:          form.note.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error ?? 'Failed to place order.')
        setLoading(false)
        return
      }

      setOrderRef(data.order_ref)
      setScreen('confirmed')
    } catch {
      setError('Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  const inputCls = [
    'w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors',
    'text-gray-900 bg-white placeholder-gray-400',
    'dark:text-gray-100 dark:bg-gray-800 dark:placeholder-gray-500',
    'border-gray-200 dark:border-gray-700',
  ].join(' ')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Header ── */}
      <div
        className="px-4 pt-10 pb-6 text-center relative overflow-hidden"
        style={headerStyle}
      >
        {(screen === 'detail' || screen === 'checkout') && (
          <button type="button" aria-label="Go back"
            onClick={() => setScreen(screen === 'checkout' ? 'detail' : 'shop')}
            className="absolute left-4 top-4 text-2xl font-light"
            style={{ color: textColor }}>
            ←
          </button>
        )}

        {/* Logo */}
        <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3
          border-2 bg-white/20"
          style={{ borderColor: `${textColor}44` }}>
          <StoreAvatar
            logoUrl={business.logo_url ?? null}
            name={business.name}
            emoji={config.emoji}
          />
        </div>

        <h1 className="text-xl font-bold mb-1" style={{ color: textColor }}>
          {business.name}
        </h1>
        <p className="text-sm mb-2" style={{ color: `${textColor}99` }}>
          @{business.slug}
        </p>

        {business.bio && (
          <p className="text-sm max-w-xs mx-auto mb-3" style={{ color: `${textColor}cc` }}>
            {business.bio}
          </p>
        )}

        {/* Badges */}
        <div className="flex justify-center gap-2 flex-wrap">
          {(business.badges && business.badges.length > 0
            ? business.badges
            : config.badge ? [config.badge] : []
          ).map((badge) => (
            <span key={badge}
              className="text-xs px-3 py-1 rounded-full"
              style={{
                background: isLight ? `${color}22` : 'rgba(255,255,255,0.2)',
                color: isLight ? color : '#fff',
              }}>
              {badge}
            </span>
          ))}
          <span className="text-xs px-3 py-1 rounded-full"
            style={{
              background: isLight ? `${color}22` : 'rgba(255,255,255,0.2)',
              color: isLight ? color : '#fff',
            }}>
            💬 WhatsApp orders
          </span>
          <span className="text-xs px-3 py-1 rounded-full"
            style={{
              background: isLight ? `${color}22` : 'rgba(255,255,255,0.2)',
              color: isLight ? color : '#fff',
            }}>
            🚚 Ships India
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-md mx-auto px-4 py-6">

        {/* Shop */}
        {screen === 'shop' && (
          <>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">
              {products.length} Products
            </p>
            {products.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🛍️</div>
                <p className="text-gray-500">No products available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.map((p) => (
                  <ProductItem key={p.id} product={p} color={color} onSelect={selectProduct} />
                ))}
              </div>
            )}
            {business.whatsapp && (
              <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 mt-6
                  bg-[#25D366] text-white rounded-2xl py-3 font-bold text-sm">
                💬 Chat on WhatsApp
              </a>
            )}
          </>
        )}

        {/* Detail */}
        {screen === 'detail' && selected && (
          <div>
            <div className="h-56 rounded-2xl overflow-hidden mb-4"
              style={{ background: `${color}15` }}>
              <ProductThumbnail
                photoUrl={selected.photo_url ?? null}
                emoji={selected.emoji}
                name={selected.name}
                color={color}
              />
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {selected.name}
            </h2>
            {selected.description && (
              <p className="text-sm text-gray-500 mb-4">{selected.description}</p>
            )}

            {selected.variants.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase
                  tracking-wide text-gray-500 mb-2">Select Option</label>
                <div className="flex flex-wrap gap-2">
                  {selected.variants.map((v) => (
                    <button key={v} type="button" onClick={() => update('variant', v)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors"
                      style={{
                        background:  form.variant === v ? color : 'transparent',
                        color:       form.variant === v ? '#fff' : color,
                        borderColor: color,
                      }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase
                tracking-wide text-gray-500 mb-2">Quantity</label>
              <div className="flex items-center gap-4">
                <button type="button"
                  onClick={() => update('quantity', Math.max(1, form.quantity - 1))}
                  className="w-10 h-10 rounded-full border-2 text-lg font-bold
                    flex items-center justify-center"
                  style={{ borderColor: color, color }}>−</button>
                <span className="text-xl font-bold text-gray-900 dark:text-white min-w-8 text-center">
                  {form.quantity}
                </span>
                <button type="button"
                  onClick={() => update('quantity', Math.min(selected.stock, form.quantity + 1))}
                  className="w-10 h-10 rounded-full text-white text-lg font-bold
                    flex items-center justify-center"
                  style={{ background: color }}>+</button>
              </div>
            </div>

            <div className="rounded-2xl p-4 mb-6 flex justify-between items-center"
              style={{ background: `${color}15` }}>
              <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
              <span className="text-2xl font-bold" style={{ color }}>
                {formatPrice(totalAmount)}
              </span>
            </div>

            <button type="button" onClick={() => setScreen('checkout')}
              className="w-full py-4 rounded-2xl text-white text-base font-bold
                transition-all active:scale-[0.98]"
              style={{ background: color }}>
              Order Now →
            </button>
          </div>
        )}

        {/* Checkout */}
        {screen === 'checkout' && selected && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Your Details
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Order confirmation sent to your WhatsApp
            </p>

            <div className="rounded-2xl p-4 mb-6 flex items-center gap-3"
              style={{ background: `${color}15` }}>
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                <ProductThumbnail
                  photoUrl={selected.photo_url ?? null}
                  emoji={selected.emoji}
                  name={selected.name}
                  color={color}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {selected.name}
                </p>
                {form.variant && (
                  <p className="text-xs text-gray-500">{form.variant} × {form.quantity}</p>
                )}
              </div>
              <span className="text-base font-bold flex-shrink-0" style={{ color }}>
                {formatPrice(totalAmount)}
              </span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600
                text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
            )}

            <div className="space-y-3 mb-4">
              <input type="text" value={form.customerName}
                onChange={(e) => update('customerName', e.target.value)}
                placeholder="Your full name" className={inputCls} />
              <div>
                <input type="tel" value={form.customerPhone}
                  onChange={(e) => update('customerPhone', e.target.value)}
                  placeholder="+91 98765 43210" className={inputCls} />
                <p className="text-xs text-gray-400 mt-1">
                  Include country code e.g. +91 for India
                </p>
              </div>
              <textarea value={form.note}
                onChange={(e) => update('note', e.target.value)}
                placeholder="Any special note? (optional)"
                rows={2} className={inputCls + ' resize-none'} />
            </div>

            <button type="button" onClick={placeOrder} disabled={loading}
              className="w-full py-4 rounded-2xl text-white text-base font-bold
                transition-all disabled:opacity-50 active:scale-[0.98]"
              style={{ background: color }}>
              {loading ? 'Placing order...' : `Confirm Order — ${formatPrice(totalAmount)}`}
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              Seller will contact you on WhatsApp to confirm payment
            </p>
          </div>
        )}

        {/* Confirmed */}
        {screen === 'confirmed' && selected && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center
              text-4xl mx-auto mb-4" style={{ background: `${color}20` }}>
              ✅
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Order Confirmed! 🎉
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {business.name} will contact you on WhatsApp soon.
            </p>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border
              border-gray-100 dark:border-gray-800 p-4 text-left mb-4">
              {([
                ['Order Ref', orderRef],
                ['Product',   selected.name],
                ['Variant',   form.variant || '—'],
                ['Quantity',  String(form.quantity)],
                ['Amount',    formatPrice(totalAmount)],
                ['Your Name', form.customerName],
                ['WhatsApp',  form.customerPhone],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b
                  border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>

            {business.whatsapp && (
              <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}?text=Hi! I just placed order ${orderRef} on OrdrX.`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2
                  bg-[#25D366] text-white rounded-2xl py-3 font-bold text-sm mb-3">
                💬 Message {business.name} on WhatsApp
              </a>
            )}

            <button type="button"
              onClick={() => {
                setScreen('shop')
                setSelected(null)
                setForm({ customerName: '', customerPhone: '', variant: '', quantity: 1, note: '' })
              }}
              className="text-sm font-semibold" style={{ color }}>
              ← Back to shop
            </button>
          </div>
        )}

      </div>

      <p className="text-center text-xs text-gray-400 py-6">
        ⚡ Powered by OrdrX · ThiranX
      </p>
    </div>
  )
}