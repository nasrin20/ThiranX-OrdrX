'use client'

// OrdrX — Luxury Storefront with Shipping + Address

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Business, Product, BusinessType, CartItem, PrefQuestion, ShippingType } from '@/types'
import { BUSINESS_TYPE_CONFIG } from '@/constants/businessTypes'
import { matchProducts, PrefAnswer } from '@/constants/preferences'

interface StorefrontClientProps {
  business: Business & {
    upi_id?:             string | null
    about_us?:           string | null
    address?:            string | null
    banner_images?:      string[]
    shipping_type?:      ShippingType
    shipping_rate?:      number
    shipping_free_above?: number
    instagram_handle?:    string | null
  }
  products: Product[]
}

interface OrderForm {
  customerName:    string
  customerPhone:   string
  deliveryAddress: string
  note:            string
}

type Screen = 'shop' | 'quiz' | 'detail' | 'checkout' | 'payment' | 'confirmed'

// ── Helpers ────────────────────────────────────────────────
const fmt = (paise: number): string =>
  `₹${(paise / 100).toLocaleString('en-IN')}`

const disc = (price: number, mrp: number | null): number | null => {
  if (!mrp || mrp <= price) return null
  return Math.round((1 - price / mrp) * 100)
}

// ── Calculate shipping ─────────────────────────────────────
const calcShipping = (
  subtotal:    number,
  type:        ShippingType | undefined,
  rate:        number,
  freeAbove:   number,
): number => {
  if (!type || type === 'free') return 0
  if (type === 'flat') return rate
  if (type === 'free_above') {
    return subtotal >= freeAbove ? 0 : rate
  }
  return 0
}

const UPI_APPS = [
  { name: 'PhonePe', icon: '💜', scheme: 'phonepe' },
  { name: 'GPay',    icon: '🔵', scheme: 'gpay'    },
  { name: 'Paytm',   icon: '🔷', scheme: 'paytm'   },
  { name: 'BHIM',    icon: '🇮🇳', scheme: 'upi'     },
]

// ── Banner Slider ──────────────────────────────────────────
function BannerSlider({ images, color }: { images: string[]; color: string }) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = useCallback(() => {
    if (images.length <= 1) return
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % images.length)
    }, 5000)
  }, [images.length])

  useEffect(() => {
    startTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [startTimer])

  const goTo = (i: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setCurrent(i)
    startTimer()
  }

  if (images.length === 0) return null

  return (
    <div className="relative w-full overflow-hidden"
      style={{ height: '50vh', minHeight: '240px', maxHeight: '420px' }}>
      {images.map((url, i) => (
        <div key={url} className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`Banner ${i + 1}`}
            className="w-full h-full object-contain"
            style={{ background: '#f8f8f6' }} />
        </div>
      ))}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
          {images.map((_, i) => (
            <button key={i} type="button" onClick={() => goTo(i)}
              className="transition-all duration-300"
              style={{
                width: i === current ? '24px' : '6px', height: '6px',
                borderRadius: '3px',
                background: i === current ? color : `${color}60`,
              }} />
          ))}
        </div>
      )}
      {images.length > 1 && (
        <>
          <button type="button"
            onClick={() => goTo((current - 1 + images.length) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10
              w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full
              flex items-center justify-center shadow-sm text-gray-700 text-sm font-bold">‹</button>
          <button type="button"
            onClick={() => goTo((current + 1) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10
              w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full
              flex items-center justify-center shadow-sm text-gray-700 text-sm font-bold">›</button>
        </>
      )}
    </div>
  )
}

// ── Product Image ──────────────────────────────────────────
function ProductImage({
  photoUrl, photoUrl2, emoji, name, color,
}: {
  photoUrl: string | null; photoUrl2: string | null
  emoji: string; name: string; color: string
}) {
  const [idx, setIdx] = useState(0)
  const images = [photoUrl, photoUrl2].filter(Boolean) as string[]

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center"
        style={{ background: `${color}08` }}>
        <span className="text-5xl opacity-60">{emoji}</span>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[idx]} alt={name}
        className="w-full h-full object-contain transition-opacity duration-300"
        style={{ background: '#f8f8f6' }} />
      {images.length > 1 && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100
          transition-opacity duration-500">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[1]} alt={name}
            className="w-full h-full object-contain"
            style={{ background: '#f8f8f6' }} />
        </div>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
          {images.map((_, i) => (
            <button key={i} type="button"
              onClick={(e) => { e.stopPropagation(); setIdx(i) }}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{ background: i === idx ? color : '#00000030' }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Store Logo ─────────────────────────────────────────────
function StoreLogo({ logoUrl, name, emoji, size = 'md' }: {
  logoUrl: string | null; name: string; emoji: string; size?: 'sm' | 'md'
}) {
  const cls = size === 'sm' ? 'w-7 h-7 text-lg' : 'w-10 h-10 text-xl'
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={name}
        className={`${cls} rounded-full object-contain border border-black/10`} />
    )
  }
  return (
    <div className={`${cls} rounded-full flex items-center justify-center bg-black/5`}>
      {emoji}
    </div>
  )
}

// ── Product Card ───────────────────────────────────────────
function ProductCard({
  product, color, cartItem, recommended,
  onSelect, onAddToCart, onUpdateQty,
}: {
  product: Product; color: string; cartItem?: CartItem; recommended?: boolean
  onSelect: (p: Product) => void; onAddToCart: (p: Product) => void
  onUpdateQty: (id: string, delta: number) => void
}) {
  const d      = disc(product.price, product.mrp ?? null)
  const inCart = !!cartItem
  const qty    = cartItem?.quantity ?? 0

  return (
    <div className="group cursor-pointer" onClick={() => onSelect(product)}>
      <div className="relative aspect-square overflow-hidden bg-[#f8f8f6] rounded-sm mb-3">
        <ProductImage
          photoUrl={product.photo_url ?? null}
          photoUrl2={product.photo_url_2 ?? null}
          emoji={product.emoji} name={product.name} color={color}
        />
        {product.tag && (
          <span className="absolute top-2 left-2 text-xs font-semibold
            tracking-wider uppercase px-2 py-0.5 bg-white/90 text-gray-700">
            {product.tag}
          </span>
        )}
        {recommended && !inCart && (
          <span className="absolute top-2 right-2 text-xs font-semibold
            px-2 py-0.5 text-white rounded-sm" style={{ background: color }}>
            ✦ Match
          </span>
        )}
        {d && (
          <span className="absolute bottom-2 left-2 text-xs font-bold
            px-2 py-0.5 bg-red-500 text-white rounded-sm">-{d}%</span>
        )}

        {/* Quick add */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full
          group-hover:translate-y-0 transition-transform duration-300">
          {!inCart ? (
            <button type="button"
              onClick={(e) => {
                e.stopPropagation()
                product.variants.length > 0 ? onSelect(product) : onAddToCart(product)
              }}
              className="w-full py-2.5 text-xs font-semibold tracking-widest
                uppercase text-white" style={{ background: color }}>
              {product.variants.length > 0 ? 'Select Options' : '+ Add to Cart'}
            </button>
          ) : (
            <div className="flex items-center justify-between px-4 py-2"
              style={{ background: color }}
              onClick={(e) => e.stopPropagation()}>
              <button type="button"
                onClick={() => onUpdateQty(product.id, -1)}
                className="text-white text-lg font-light w-8 text-center">−</button>
              <span className="text-white text-xs font-semibold tracking-widest">
                {qty} IN CART
              </span>
              <button type="button"
                onClick={() => onUpdateQty(product.id, 1)}
                className="text-white text-lg font-light w-8 text-center">+</button>
            </div>
          )}
        </div>

        {inCart && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full
            flex items-center justify-center text-white text-xs font-bold"
            style={{ background: color }}>{qty}</div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-900 tracking-wide
          leading-tight truncate group-hover:underline underline-offset-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-400 truncate">{product.description}</p>
        )}
        {product.variants.length > 0 && (
          <p className="text-xs text-gray-400">
            {product.variants.slice(0, 3).join(' · ')}
            {product.variants.length > 3 ? ` +${product.variants.length - 3}` : ''}
          </p>
        )}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-sm font-semibold text-gray-900">{fmt(product.price)}</span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-xs text-gray-400 line-through">{fmt(product.mrp)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Cart Bar ───────────────────────────────────────────────
function CartBar({ cart, color, onCheckout }: {
  cart: CartItem[]; color: string; onCheckout: () => void
}) {
  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const count = cart.reduce((s, i) => s + i.quantity, 0)
  if (count === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <button type="button" onClick={onCheckout}
        className="w-full max-w-lg mx-auto flex items-center justify-between
          px-6 py-4 text-white font-semibold tracking-wide text-sm
          shadow-2xl block hover:opacity-90 transition-opacity"
        style={{ background: color }}>
        <span className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-white/20 flex items-center
            justify-center text-xs font-bold">{count}</span>
          VIEW CART
        </span>
        <span>{fmt(total)}</span>
      </button>
    </div>
  )
}

// ── Preference Quiz ────────────────────────────────────────
function PreferenceQuiz({
  questions, color, onComplete, onSkip,
}: {
  questions: PrefQuestion[]; color: string
  onComplete: (answers: PrefAnswer[]) => void; onSkip: () => void
}) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers,  setAnswers]  = useState<Record<string, string[]>>({})

  const q        = questions[currentQ]
  const isLast   = currentQ === questions.length - 1
  const isFirst  = currentQ === 0
  const selected = answers[q.id] ?? []

  const toggle = (opt: string) =>
    setAnswers((prev) => {
      const cur = prev[q.id] ?? []
      return { ...prev, [q.id]: cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt] }
    })

  const next = () => {
    if (isLast) {
      onComplete(
        Object.entries(answers).flatMap(([questionId, opts]) =>
          opts.map((answer) => ({ questionId, answer }))
        )
      )
    } else {
      setCurrentQ((n) => n + 1)
    }
  }

  return (
    <div className="min-h-[60vh] flex flex-col justify-center py-8 px-4">
      <div className="flex gap-1 mb-10">
        {questions.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 transition-all duration-500"
            style={{ background: i <= currentQ ? color : '#e5e7eb' }} />
        ))}
      </div>
      <p className="text-xs text-gray-400 tracking-widest uppercase mb-3">
        {currentQ + 1} of {questions.length}
      </p>
      <h2 className="text-2xl font-light text-gray-900 mb-2">{q.question}</h2>
      <p className="text-sm text-gray-400 mb-8">Select all that apply</p>
      <div className="grid grid-cols-2 gap-3 mb-10">
        {q.options.map((opt) => {
          const sel = selected.includes(opt)
          return (
            <button key={opt} type="button" onClick={() => toggle(opt)}
              className="py-3 px-4 text-sm font-medium border transition-all text-left tracking-wide"
              style={{
                borderColor: sel ? color : '#e5e7eb',
                background:  sel ? `${color}10` : 'transparent',
                color:       sel ? color : '#374151',
              }}>
              {opt}
            </button>
          )
        })}
      </div>
      <div className="flex gap-3">
        {!isFirst && (
          <button type="button" onClick={() => setCurrentQ((n) => n - 1)}
            className="flex-1 py-3 border border-gray-300 text-sm font-medium
              tracking-widest uppercase text-gray-600">Back</button>
        )}
        <button type="button" onClick={next} disabled={selected.length === 0}
          className="flex-1 py-3 text-white text-sm font-semibold
            tracking-widest uppercase disabled:opacity-30"
          style={{ background: color }}>
          {isLast ? 'Find My Match' : 'Next'}
        </button>
      </div>
      <button type="button" onClick={onSkip}
        className="text-center text-xs text-gray-400 tracking-widest uppercase mt-6">
        Skip · Show all products
      </button>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────
export function StorefrontClient({ business, products }: StorefrontClientProps) {
  const config       = BUSINESS_TYPE_CONFIG[business.type as BusinessType]
  const color        = business.theme_color || config.color
  const upiId        = business.upi_id ?? null
  const aboutUs      = business.about_us ?? null
  const address      = business.address ?? null
  const bannerImages = business.banner_images ?? []
  const hasQuiz      = (business.pref_questions ?? []).length > 0

  const shippingType      = business.shipping_type      ?? 'free'
  const shippingRate      = business.shipping_rate      ?? 0
  const shippingFreeAbove = business.shipping_free_above ?? 0

  const [screen,        setScreen]        = useState<Screen>('shop')
  const [selected,      setSelected]      = useState<Product | null>(null)
  const [orderRef,      setOrderRef]      = useState('')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [cart,          setCart]          = useState<CartItem[]>([])
  const [answers,       setAnswers]       = useState<PrefAnswer[]>([])
  const [quizDone,      setQuizDone]      = useState(false)
  const [detailVariant, setDetailVariant] = useState('')
  const [detailQty,     setDetailQty]     = useState(1)
  const [copied,        setCopied]        = useState(false)
  const [form,          setForm]          = useState<OrderForm>({
    customerName: '', customerPhone: '', deliveryAddress: '', note: '',
  })

  const updateForm = (f: keyof OrderForm, v: string) =>
    setForm((prev) => ({ ...prev, [f]: v }))

  // ── Shipping calculation ──────────────────────────────────
  const subtotal      = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const shippingCost  = calcShipping(subtotal, shippingType, shippingRate, shippingFreeAbove)
  const totalAmount   = subtotal + shippingCost
  const totalItems    = cart.reduce((s, i) => s + i.quantity, 0)
  const isFreeShipping = shippingCost === 0

  // How much more needed for free shipping
  const amountForFreeShipping = shippingType === 'free_above' && shippingCost > 0
    ? shippingFreeAbove - subtotal
    : 0

  // ── Filtered products ─────────────────────────────────────
  const displayProducts = useMemo(() => {
    if (!quizDone || !answers.length) return products
    return matchProducts(products, answers)
  }, [products, answers, quizDone])

  const recommendedIds = useMemo(() => {
    if (!quizDone || !answers.length) return new Set<string>()
    const vals = answers.map((a) => a.answer.toLowerCase())
    return new Set(
      products
        .filter((p) => {
          const tags = [...(p.pref_tags ?? []), ...(p.variants ?? [])].map((t) => t.toLowerCase())
          return vals.some((a) => tags.some((t) => t.includes(a) || a.includes(t)))
        })
        .map((p) => p.id)
    )
  }, [products, answers, quizDone])

  const getCartItem = (id: string) => cart.find((i) => i.product.id === id)

  const addToCart = useCallback((product: Product, variant = '', qty = 1) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id && i.variant === variant)
      if (ex) {
        return prev.map((i) =>
          i.product.id === product.id && i.variant === variant
            ? { ...i, quantity: Math.min(product.stock, i.quantity + qty) }
            : i
        )
      }
      return [...prev, { product, variant, quantity: qty }]
    })
  }, [])

  const updateQty = (id: string, delta: number) =>
    setCart((prev) =>
      prev
        .map((i) => i.product.id === id ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0)
    )

  const removeFromCart = (id: string) =>
    setCart((prev) => prev.filter((i) => i.product.id !== id))

  const openDetail = (product: Product) => {
    setSelected(product)
    setDetailVariant(product.variants[0] ?? '')
    setDetailQty(1)
    setScreen('detail')
  }

  // ── Place order ───────────────────────────────────────────
  const placeOrder = async () => {
    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      setError('Please fill in your name and WhatsApp number.')
      return
    }
    if (!form.deliveryAddress.trim()) {
      setError('Please enter your delivery address.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id:      business.id,
          customer_name:    form.customerName.trim(),
          customer_phone:   form.customerPhone.trim(),
          delivery_address: form.deliveryAddress.trim(),
          items: cart.map((i) => ({
            product_id: i.product.id,
            variant:    i.variant || null,
            quantity:   i.quantity,
            price:      i.product.price,
          })),
          subtotal,
          shipping_amount: shippingCost,
          total_amount:    totalAmount,
          notes:           form.note.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Failed to place order.')
        setLoading(false)
        return
      }
      setOrderRef(data.order_ref)
      setScreen(upiId ? 'payment' : 'confirmed')
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const copyUpi = () => {
    if (upiId) {
      navigator.clipboard.writeText(upiId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openUpiApp = (scheme: string) => {
    const amount = (totalAmount / 100).toFixed(2)
    const note   = encodeURIComponent(`OrdrX Order ${orderRef}`)
    const name   = encodeURIComponent(business.name)
    const urls: Record<string, string> = {
      phonepe: `phonepe://pay?pa=${upiId}&pn=${name}&am=${amount}&tn=${note}`,
      gpay:    `tez://upi/pay?pa=${upiId}&pn=${name}&am=${amount}&tn=${note}`,
      paytm:   `paytmmp://pay?pa=${upiId}&pn=${name}&am=${amount}&tn=${note}`,
      upi:     `upi://pay?pa=${upiId}&pn=${name}&am=${amount}&tn=${note}&cu=INR`,
    }
    window.location.href = urls[scheme] ?? urls.upi
  }

  const inputCls = [
    'w-full px-4 py-3 border-b border-gray-200 text-sm bg-transparent',
    'outline-none transition-colors placeholder-gray-400',
    'focus:border-gray-900 text-gray-900',
  ].join(' ')

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {screen !== 'shop' ? (
              <button type="button" onClick={() => setScreen('shop')}
                className="text-gray-600 hover:text-gray-900 text-sm">← Back</button>
            ) : (
              <>
                <StoreLogo logoUrl={business.logo_url ?? null}
                  name={business.name} emoji={config.emoji} size="sm" />
                <span className="text-sm font-semibold tracking-widest uppercase
                  text-gray-900 truncate max-w-[140px]">{business.name}</span>
              </>
            )}
          </div>
          {business.whatsapp && (
            <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold
                tracking-wide text-white px-3 py-1.5 rounded-full"
              style={{ background: '#25D366' }}>
              <span>💬</span>
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
          {/* Instagram link in navbar */}
          {business.instagram_handle && (
            
              <a href={`https://instagram.com/${business.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 
              text-xs text-gray-500 hover:text-pink-500 transition-colors">
              <span>📷</span>
              <span>@{business.instagram_handle}</span>
            </a>
          )}
        </div>
      </nav>

      {/* ── BANNER ── */}
      {screen === 'shop' && <BannerSlider images={bannerImages} color={color} />}

      {/* ── SHOP HEADER ── */}
      {screen === 'shop' && (
        <div className="max-w-lg mx-auto px-4 py-6 text-center">
          {business.bio && (
            <p className="text-sm text-gray-500 tracking-wide mb-4">{business.bio}</p>
          )}
          {(business.badges?.length > 0 || config.badge) && (
            <div className="flex flex-wrap justify-center gap-2">
              {(business.badges?.length > 0
                ? business.badges
                : config.badge ? [config.badge] : []
              ).map((badge) => (
                <span key={badge} className="text-xs px-3 py-1 tracking-wide border"
                  style={{ borderColor: `${color}50`, color }}>
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CONTENT ── */}
      <div className="max-w-lg mx-auto px-4 pb-40">

        {/* Quiz */}
        {screen === 'quiz' && (
          <PreferenceQuiz
            questions={business.pref_questions}
            color={color}
            onComplete={(a) => { setAnswers(a); setQuizDone(true); setScreen('shop') }}
            onSkip={() => { setAnswers([]); setQuizDone(false); setScreen('shop') }}
          />
        )}

        {/* Shop */}
        {screen === 'shop' && (
          <>
            {hasQuiz && !quizDone && (
              <button type="button" onClick={() => setScreen('quiz')}
                className="w-full mb-6 py-3 border border-gray-200 text-sm
                  font-medium tracking-widest uppercase text-gray-700
                  hover:border-gray-700 transition-colors flex items-center
                  justify-center gap-3">
                <span>✦</span><span>Find Your Perfect Match</span><span>→</span>
              </button>
            )}

            {quizDone && (
              <div className="mb-6 py-3 border-l-2 pl-4 flex items-center justify-between"
                style={{ borderColor: color }}>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {recommendedIds.size > 0
                      ? `${recommendedIds.size} products curated for you`
                      : 'Showing all products'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Based on your preferences</p>
                </div>
                <button type="button"
                  onClick={() => { setAnswers([]); setQuizDone(false) }}
                  className="text-xs text-gray-400 underline underline-offset-2">
                  Reset
                </button>
              </div>
            )}

            {/* Shipping badge */}
            {shippingType !== 'free' && (
              <div className="mb-4 py-2.5 px-4 bg-gray-50 border border-gray-100
                flex items-center gap-2">
                <span className="text-sm">🚚</span>
                <p className="text-xs text-gray-600 font-medium">
                  {shippingType === 'flat' && `Flat ₹${shippingRate / 100} shipping`}
                  {shippingType === 'free_above' &&
                    `Free shipping on orders above ${fmt(shippingFreeAbove)} · otherwise ${fmt(shippingRate)}`}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mb-5">
              <p className="text-xs tracking-widest uppercase text-gray-400">
                {products.length} Products
              </p>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-sm tracking-wide">No products yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                {displayProducts.map((p) => (
                  <ProductCard key={p.id} product={p} color={color}
                    cartItem={getCartItem(p.id)}
                    recommended={quizDone && recommendedIds.has(p.id)}
                    onSelect={openDetail}
                    onAddToCart={(prod) => addToCart(prod, '', 1)}
                    onUpdateQty={updateQty} />
                ))}
              </div>
            )}

            {/* About Us */}
            {aboutUs && (
              <div className="mt-16 pt-12 border-t border-gray-100">
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-6">About Us</p>
                <div className="flex items-start gap-4 mb-4">
                  <StoreLogo logoUrl={business.logo_url ?? null}
                    name={business.name} emoji={config.emoji} />
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 tracking-wide">
                      {business.name}
                    </h3>
                    {business.bio && (
                      <p className="text-xs text-gray-400 mt-0.5">{business.bio}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{aboutUs}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-xs tracking-widest uppercase text-gray-400 mb-4">
                    {business.name}
                  </p>
                  <div className="space-y-2.5">
                    {business.whatsapp && (
                      <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-gray-500
                          hover:text-gray-900 transition-colors">
                        <span>💬</span><span>WhatsApp</span>
                      </a>
                    )}
                    {business.instagram_handle && (
  
                        <a href={`https://instagram.com/${business.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-gray-500
                          hover:text-pink-500 transition-colors"
                      >
                        <span>📷</span>
                        <span>@{business.instagram_handle}</span>
                      </a>
                    )}
                    {business.email && (
                      <a href={`mailto:${business.email}`}
                        className="flex items-center gap-2 text-xs text-gray-500
                          hover:text-gray-900 transition-colors">
                        <span>✉️</span><span>{business.email}</span>
                      </a>
                    )}
                    {address && (
                      <div className="flex items-start gap-2 text-xs text-gray-500">
                        <span className="flex-shrink-0 mt-0.5">📍</span>
                        <span className="leading-relaxed">{address}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs tracking-widest uppercase text-gray-400 mb-4">Shop</p>
                  <div className="space-y-2.5">
                    <button type="button"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="block text-xs text-gray-500 hover:text-gray-900">
                      All Products
                    </button>
                    {hasQuiz && (
                      <button type="button" onClick={() => setScreen('quiz')}
                        className="block text-xs text-gray-500 hover:text-gray-900">
                        Find My Match ✦
                      </button>
                    )}
                    {business.whatsapp && (
                      <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="block text-xs text-gray-500 hover:text-gray-900">
                        Contact Us
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">© {new Date().getFullYear()} {business.name}</p>
                <a href="https://ordrx.in" target="_blank" rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-gray-700 tracking-wide">
                  Powered by <span className="font-semibold" style={{ color }}>OrdrX</span>
                </a>
              </div>
            </div>
          </>
        )}

        {/* Detail */}
        {screen === 'detail' && selected && (
          <div className="py-4">
            <div className="aspect-square bg-[#f8f8f6] rounded-sm mb-6 overflow-hidden">
              <ProductImage
                photoUrl={selected.photo_url ?? null}
                photoUrl2={selected.photo_url_2 ?? null}
                emoji={selected.emoji} name={selected.name} color={color}
              />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-wide mb-1">
              {selected.name}
            </h1>
            {selected.description && (
              <p className="text-sm text-gray-500 leading-relaxed mb-3">{selected.description}</p>
            )}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xl font-semibold text-gray-900">{fmt(selected.price)}</span>
              {selected.mrp && selected.mrp > selected.price && (
                <span className="text-sm text-gray-400 line-through">{fmt(selected.mrp)}</span>
              )}
              {disc(selected.price, selected.mrp ?? null) && (
                <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5">
                  -{disc(selected.price, selected.mrp ?? null)}%
                </span>
              )}
            </div>

            {selected.variants.length > 0 && (
              <div className="mb-6">
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-3">
                  Select Option
                </p>
                <div className="flex flex-wrap gap-2">
                  {selected.variants.map((v) => (
                    <button key={v} type="button" onClick={() => setDetailVariant(v)}
                      className="px-4 py-2 text-sm border transition-all"
                      style={{
                        background:  detailVariant === v ? color : 'transparent',
                        borderColor: detailVariant === v ? color : '#d1d5db',
                        color:       detailVariant === v ? '#fff' : '#374151',
                      }}>{v}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <p className="text-xs tracking-widest uppercase text-gray-400 mb-3">Quantity</p>
              <div className="flex items-center gap-4 border border-gray-200 w-fit">
                <button type="button"
                  onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center
                    text-gray-600 hover:bg-gray-50 text-lg font-light">−</button>
                <span className="text-sm font-medium text-gray-900 min-w-[20px] text-center">
                  {detailQty}
                </span>
                <button type="button"
                  onClick={() => setDetailQty((q) => Math.min(selected.stock, q + 1))}
                  className="w-10 h-10 flex items-center justify-center
                    text-gray-600 hover:bg-gray-50 text-lg font-light">+</button>
              </div>
            </div>

            <div className="flex justify-between items-center py-4 border-y
              border-gray-100 mb-6">
              <span className="text-sm text-gray-500">
                {detailQty} × {fmt(selected.price)}
              </span>
              <span className="text-lg font-semibold text-gray-900">
                {fmt(selected.price * detailQty)}
              </span>
            </div>

            <button type="button"
              onClick={() => { addToCart(selected, detailVariant, detailQty); setScreen('shop') }}
              className="w-full py-4 text-white text-sm font-semibold
                tracking-widest uppercase hover:opacity-90 transition-opacity"
              style={{ background: color }}>
              Add to Cart
            </button>
          </div>
        )}

        {/* Checkout */}
        {screen === 'checkout' && (
          <div className="py-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold text-gray-900">Your Order</h2>
              <button type="button" onClick={() => setScreen('shop')}
                className="text-xs text-gray-500 tracking-widest uppercase
                  underline underline-offset-2">Edit Cart</button>
            </div>

            {/* Items */}
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div key={`${item.product.id}-${item.variant}`} className="flex gap-4">
                  <div className="w-16 h-16 bg-[#f8f8f6] flex-shrink-0 overflow-hidden">
                    <ProductImage
                      photoUrl={item.product.photo_url ?? null}
                      photoUrl2={item.product.photo_url_2 ?? null}
                      emoji={item.product.emoji} name={item.product.name} color={color}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.product.name}{item.variant ? ` — ${item.variant}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {fmt(item.product.price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-start gap-3 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-900">
                      {fmt(item.product.price * item.quantity)}
                    </span>
                    <button type="button" onClick={() => removeFromCart(item.product.id)}
                      className="text-gray-300 hover:text-red-400 text-sm mt-0.5">✕</button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Order Summary with Shipping ── */}
            <div className="border-t border-gray-200 pt-4 mb-8 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal ({totalItems} items)</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1.5">
                  🚚 Shipping
                  {shippingType === 'free_above' && !isFreeShipping && (
                    <span className="text-xs text-gray-400">
                      (free above {fmt(shippingFreeAbove)})
                    </span>
                  )}
                </span>
                <span className={isFreeShipping ? 'text-green-600 font-semibold' : 'text-gray-900'}>
                  {isFreeShipping ? 'FREE ✓' : fmt(shippingCost)}
                </span>
              </div>

              {/* Upsell — add more for free shipping */}
              {amountForFreeShipping > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-amber-700 font-medium">
                    🎁 Add {fmt(amountForFreeShipping)} more for FREE shipping!
                  </p>
                </div>
              )}

              <div className="flex justify-between text-base font-semibold
                text-gray-900 pt-2 border-t border-gray-200">
                <span>Total to Pay</span>
                <span style={{ color }}>{fmt(totalAmount)}</span>
              </div>
            </div>

            {/* Customer details */}
            <h3 className="text-xs tracking-widest uppercase text-gray-400 mb-6">
              Your Details
            </h3>

            {error && (
              <div className="border border-red-200 bg-red-50 text-red-600
                text-sm px-4 py-3 mb-6">{error}</div>
            )}

            <div className="space-y-0 mb-8">
              <input type="text" value={form.customerName}
                onChange={(e) => updateForm('customerName', e.target.value)}
                placeholder="Full name" className={inputCls} />
              <input type="tel" value={form.customerPhone}
                onChange={(e) => updateForm('customerPhone', e.target.value)}
                placeholder="WhatsApp (+91 98765 43210)" className={inputCls} />
              <textarea value={form.deliveryAddress}
                onChange={(e) => updateForm('deliveryAddress', e.target.value)}
                placeholder="Delivery address *"
                rows={3}
                className={inputCls.replace('border-b', 'border-b') + ' resize-none'} />
              <input type="text" value={form.note}
                onChange={(e) => updateForm('note', e.target.value)}
                placeholder="Special note (optional)" className={inputCls} />
            </div>

            <button type="button" onClick={placeOrder} disabled={loading}
              className="w-full py-4 text-white text-sm font-semibold
                tracking-widest uppercase disabled:opacity-50 hover:opacity-90
                transition-opacity"
              style={{ background: color }}>
              {loading ? 'Placing Order...' : `Place Order — ${fmt(totalAmount)}`}
            </button>

            <p className="text-center text-xs text-gray-400 mt-4 tracking-wide">
              {upiId ? 'UPI payment details shown next' : 'Seller will contact you on WhatsApp'}
            </p>
          </div>
        )}

        {/* Payment */}
        {screen === 'payment' && upiId && (
          <div className="py-4">
            <div className="text-center mb-8">
              <p className="text-xs tracking-widest uppercase text-gray-400 mb-2">
                Ref: {orderRef}
              </p>
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                Complete Payment
              </h2>
              <p className="text-sm text-gray-500">
                Pay {fmt(totalAmount)} to confirm your order
              </p>
              {shippingCost > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Includes {fmt(shippingCost)} shipping
                </p>
              )}
            </div>

            <div className="border border-gray-200 p-5 mb-6">
              <p className="text-xs tracking-widest uppercase text-gray-400 mb-4">Pay via UPI</p>
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 mb-5">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">UPI ID</p>
                  <p className="text-base font-semibold text-gray-900">{upiId}</p>
                </div>
                <button type="button" onClick={copyUpi}
                  className="text-xs font-semibold tracking-widest uppercase px-4 py-2
                    border transition-colors"
                  style={{ borderColor: copied ? '#22c55e' : color, color: copied ? '#22c55e' : color }}>
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
              <div className="text-center">
                <p className="text-3xl font-semibold text-gray-900 mb-1">{fmt(totalAmount)}</p>
                {shippingCost > 0 && (
                  <p className="text-xs text-gray-400">
                    Products {fmt(subtotal)} + Shipping {fmt(shippingCost)}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">Add note: {orderRef}</p>
              </div>
            </div>

            <p className="text-xs tracking-widest uppercase text-gray-400 mb-3">Open UPI App</p>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {UPI_APPS.map((app) => (
                <button key={app.name} type="button" onClick={() => openUpiApp(app.scheme)}
                  className="flex flex-col items-center gap-2 py-4 border
                    border-gray-100 hover:border-gray-300 transition-colors">
                  <span className="text-2xl">{app.icon}</span>
                  <span className="text-xs text-gray-500 font-medium">{app.name}</span>
                </button>
              ))}
            </div>

            <div className="border-l-2 border-amber-400 pl-4 mb-6">
              <p className="text-xs font-semibold text-amber-700 mb-1">After paying</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Send your payment screenshot on WhatsApp so {business.name}
                can confirm and ship your order.
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              {business.whatsapp && (
                <button type="button"
                  onClick={() => {
                    const msg = encodeURIComponent(
                      `Hi ${business.name}! 👋\n\nI paid ${fmt(totalAmount)} for order *${orderRef}* via UPI.\n\n📸 Please find my payment screenshot attached.\n\nKindly confirm my order. Thank you! 🙏`
                    )
                    window.open(`https://wa.me/${business.whatsapp!.replace(/\D/g, '')}?text=${msg}`, '_blank')
                    setScreen('confirmed')
                  }}
                  className="w-full py-4 text-white text-sm font-semibold
                    tracking-widest uppercase hover:opacity-90 transition-opacity"
                  style={{ background: color }}>
                  ✅ I&apos;ve Paid — Send Screenshot
                </button>
              )}

              {business.whatsapp && (
                <button type="button"
                  onClick={() => {
                    const msg = encodeURIComponent(
                      `Hi ${business.name}! 👋\n\nI placed order *${orderRef}* for ${fmt(totalAmount)} but I'm having trouble completing the payment.\n\nCan you help me? 🙏`
                    )
                    window.open(`https://wa.me/${business.whatsapp!.replace(/\D/g, '')}?text=${msg}`, '_blank')
                  }}
                  className="w-full py-3 border border-gray-300 text-sm font-medium
                    tracking-widest uppercase text-gray-600 hover:border-gray-700
                    transition-colors">
                  🆘 Having Trouble Paying?
                </button>
              )}

              <button type="button" onClick={() => setScreen('confirmed')}
                className="w-full text-center text-xs text-gray-400 tracking-widest
                  uppercase underline underline-offset-4 hover:text-gray-700 py-2">
                Skip — Confirm Order
              </button>
            </div>
          </div>
        )}

        {/* Confirmed */}
        {screen === 'confirmed' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 border-2 flex items-center justify-center
              text-2xl mx-auto mb-6" style={{ borderColor: color }}>✓</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Order Confirmed</h2>
            <p className="text-sm text-gray-500 mb-8">
              {upiId
                ? `${business.name} will confirm after receiving payment.`
                : `${business.name} will contact you on WhatsApp.`}
            </p>

            <div className="text-left border border-gray-100 p-5 mb-6">
              <div className="flex justify-between py-2.5 border-b border-gray-100">
                <span className="text-xs tracking-widest uppercase text-gray-400">Order Ref</span>
                <span className="text-xs font-semibold text-gray-900">{orderRef}</span>
              </div>
              {cart.map((item) => (
                <div key={`${item.product.id}-${item.variant}`}
                  className="flex justify-between py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-500 truncate flex-1 mr-4">
                    {item.product.name}{item.variant ? ` — ${item.variant}` : ''} × {item.quantity}
                  </span>
                  <span className="text-xs font-semibold text-gray-900 flex-shrink-0">
                    {fmt(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}

              {/* Shipping in receipt */}
              <div className="flex justify-between py-2.5 border-t border-gray-100 mt-1">
                <span className="text-xs text-gray-400">🚚 Shipping</span>
                <span className="text-xs font-semibold text-gray-900">
                  {isFreeShipping ? 'FREE' : fmt(shippingCost)}
                </span>
              </div>

              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="text-xs font-semibold tracking-widest uppercase text-gray-500">
                  Total
                </span>
                <span className="text-sm font-bold" style={{ color }}>{fmt(totalAmount)}</span>
              </div>

              {/* Delivery address */}
              {form.deliveryAddress && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">📍 Delivery to</span>
                  <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                    {form.deliveryAddress}
                  </p>
                </div>
              )}
            </div>

            {business.whatsapp && (
              <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}?text=Hi ${business.name}! I placed order ${orderRef} for ${fmt(totalAmount)} on OrdrX.`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4
                  text-white text-sm font-semibold tracking-widest uppercase mb-4"
                style={{ background: '#25D366' }}>
                💬 Message {business.name}
              </a>
            )}

            <button type="button"
              onClick={() => {
                setScreen('shop')
                setCart([])
                setForm({ customerName: '', customerPhone: '', deliveryAddress: '', note: '' })
              }}
              className="text-xs tracking-widest uppercase text-gray-400
                hover:text-gray-900 underline underline-offset-4">
              Continue Shopping
            </button>
          </div>
        )}

      </div>

      {/* Cart Bar */}
      {screen === 'shop' && (
        <CartBar cart={cart} color={color} onCheckout={() => setScreen('checkout')} />
      )}
    </div>
  )
}