'use client'

// OrdrX — Storefront Client with Razorpay Payment

import { useState, useMemo, useEffect } from 'react'
import { Business, Product, BusinessType, CartItem, PrefQuestion } from '@/types'
import { BUSINESS_TYPE_CONFIG } from '@/constants/businessTypes'
import { matchProducts, PrefAnswer } from '@/constants/preferences'

// ── Razorpay types ─────────────────────────────────────────
interface RazorpayOptions {
  key:         string
  amount:      number
  currency:    string
  name:        string
  description: string
  order_id:    string
  prefill: {
    name:    string
    contact: string
  }
  theme:   { color: string }
  handler: (response: {
    razorpay_order_id:   string
    razorpay_payment_id: string
    razorpay_signature:  string
  }) => void
  modal: {
    ondismiss: () => void
  }
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void }
  }
}

// ── Types ──────────────────────────────────────────────────
interface StorefrontClientProps {
  business: Business
  products: Product[]
}

interface OrderForm {
  customerName:  string
  customerPhone: string
  note:          string
}

type Screen = 'shop' | 'quiz' | 'detail' | 'checkout' | 'confirmed'

// ── Helpers ────────────────────────────────────────────────
const formatPrice = (paise: number): string =>
  `₹${(paise / 100).toLocaleString('en-IN')}`

const getDiscount = (price: number, mrp: number | null): number | null => {
  if (!mrp || mrp <= 0 || mrp <= price) return null
  return Math.round((1 - price / mrp) * 100)
}

const getHeaderStyle = (color: string, bg: string): React.CSSProperties => {
  if (bg === 'solid') return { background: color }
  if (bg === 'dark')  return { background: '#1a1a2e' }
  if (bg === 'soft')  return { background: `${color}22` }
  return { background: `linear-gradient(160deg, ${color}ee, ${color}99)` }
}

const getTextColor = (bg: string, color: string): string =>
  bg === 'soft' ? color : '#ffffff'

// ── Load Razorpay script ───────────────────────────────────
const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script    = document.createElement('script')
    script.src      = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload   = () => resolve(true)
    script.onerror  = () => resolve(false)
    document.body.appendChild(script)
  })
}

// ── Product Thumbnail ──────────────────────────────────────
function ProductThumbnail({
  photoUrl, emoji, name, color,
}: {
  photoUrl: string | null; emoji: string; name: string; color: string
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

// ── Product Card ───────────────────────────────────────────
function ProductCard({
  product, color, cartItem, recommended,
  onSelect, onAddToCart, onUpdateQty,
}: {
  product:      Product
  color:        string
  cartItem?:    CartItem
  recommended?: boolean
  onSelect:     (p: Product) => void
  onAddToCart:  (p: Product) => void
  onUpdateQty:  (productId: string, delta: number) => void
}) {
  const discount = getDiscount(product.price, product.mrp ?? null)
  const inCart   = !!cartItem
  const cartQty  = cartItem?.quantity ?? 0

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden
      border-2 transition-all"
      style={{ borderColor: inCart ? color : recommended ? `${color}60` : 'transparent' }}>

      <div className="h-36 relative overflow-hidden cursor-pointer"
        style={{ background: `${color}15` }}
        onClick={() => onSelect(product)}>
        <ProductThumbnail photoUrl={product.photo_url ?? null}
          emoji={product.emoji} name={product.name} color={color} />
        {product.tag && (
          <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: color, color: '#fff' }}>{product.tag}</span>
        )}
        {recommended && !inCart && (
          <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5
            rounded-full bg-green-500 text-white">✨ Match</span>
        )}
        {inCart && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full
            flex items-center justify-center text-white text-xs font-bold"
            style={{ background: color }}>{cartQty}</div>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white
          leading-tight mb-1 truncate cursor-pointer"
          onClick={() => onSelect(product)}>{product.name}</h3>
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
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
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

        {!inCart ? (
          <button type="button"
            onClick={() => product.variants.length > 0 ? onSelect(product) : onAddToCart(product)}
            className="w-full py-2 rounded-xl text-white text-xs font-bold"
            style={{ background: color }}>
            + Add to Cart
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => onUpdateQty(product.id, -1)}
              className="w-8 h-8 rounded-full border-2 text-sm font-bold
                flex items-center justify-center"
              style={{ borderColor: color, color }}>−</button>
            <span className="text-sm font-bold" style={{ color }}>{cartQty} in cart</span>
            <button type="button" onClick={() => onUpdateQty(product.id, 1)}
              className="w-8 h-8 rounded-full text-white text-sm font-bold
                flex items-center justify-center"
              style={{ background: color }}>+</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Cart Bar ───────────────────────────────────────────────
function CartBar({ cart, color, onCheckout }: {
  cart: CartItem[]; color: string; onCheckout: () => void
}) {
  const totalItems  = cart.reduce((s, i) => s + i.quantity, 0)
  const totalAmount = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)
  if (totalItems === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2
      bg-gradient-to-t from-gray-50 dark:from-gray-950 to-transparent">
      <button type="button" onClick={onCheckout}
        className="w-full max-w-md mx-auto flex items-center justify-between
          px-5 py-4 rounded-2xl text-white font-bold shadow-xl
          transition-all active:scale-[0.98] block"
        style={{ background: color }}>
        <div className="flex items-center gap-2">
          <span className="bg-white/20 rounded-full w-7 h-7
            flex items-center justify-center text-sm">{totalItems}</span>
          <span className="text-sm">{totalItems} item{totalItems > 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{formatPrice(totalAmount)}</span>
          <span>→</span>
        </div>
      </button>
    </div>
  )
}

// ── Preference Quiz ────────────────────────────────────────
function PreferenceQuiz({
  questions, color, onComplete, onSkip,
}: {
  questions:  PrefQuestion[]
  color:      string
  onComplete: (answers: PrefAnswer[]) => void
  onSkip:     () => void
}) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers,  setAnswers]  = useState<Record<string, string[]>>({})

  const question = questions[currentQ]
  const isLastQ  = currentQ === questions.length - 1
  const isFirstQ = currentQ === 0
  const progress = (currentQ / questions.length) * 100
  const selected = answers[question.id] ?? []

  const toggleOption = (opt: string) => {
    setAnswers((prev) => {
      const current = prev[question.id] ?? []
      return {
        ...prev,
        [question.id]: current.includes(opt)
          ? current.filter((o) => o !== opt)
          : [...current, opt],
      }
    })
  }

  const handleNext = () => {
    if (isLastQ) {
      const flat: PrefAnswer[] = Object.entries(answers).flatMap(
        ([questionId, opts]) => opts.map((answer) => ({ questionId, answer }))
      )
      onComplete(flat)
    } else {
      setCurrentQ((q) => q + 1)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: color }} />
        </div>
        <span className="text-xs text-gray-400">{currentQ + 1}/{questions.length}</span>
      </div>

      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {question.question}
      </h2>
      <p className="text-sm text-gray-400 mb-6">Select all that apply</p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {question.options.map((opt) => {
          const isSelected = selected.includes(opt)
          return (
            <button key={opt} type="button" onClick={() => toggleOption(opt)}
              className="p-4 rounded-2xl border-2 text-sm font-semibold
                transition-all text-left flex items-center gap-2"
              style={{
                background:  isSelected ? `${color}15` : 'transparent',
                borderColor: isSelected ? color : '#e5e7eb',
                color:       isSelected ? color : undefined,
              }}>
              <div className="w-5 h-5 rounded-full border-2 flex items-center
                justify-center flex-shrink-0"
                style={{
                  borderColor: isSelected ? color : '#d1d5db',
                  background:  isSelected ? color : 'transparent',
                }}>
                {isSelected && <span className="text-white text-xs">✓</span>}
              </div>
              {opt}
            </button>
          )
        })}
      </div>

      <div className="flex gap-3">
        {!isFirstQ && (
          <button type="button" onClick={() => setCurrentQ((q) => q - 1)}
            className="flex-1 py-3 rounded-2xl border-2 text-sm font-bold
              text-gray-500 border-gray-200 dark:border-gray-700">
            ← Back
          </button>
        )}
        <button type="button" onClick={handleNext}
          disabled={selected.length === 0}
          className="flex-1 py-3 rounded-2xl text-white text-sm font-bold
            transition-all disabled:opacity-40"
          style={{ background: color }}>
          {isLastQ ? '✨ Show my matches!' : 'Next →'}
        </button>
      </div>

      <button type="button" onClick={onSkip}
        className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-4">
        Skip — Show all products
      </button>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────
export function StorefrontClient({ business, products }: StorefrontClientProps) {
  const config = BUSINESS_TYPE_CONFIG[business.type as BusinessType]
  const color  = business.theme_color || config.color
  const bg     = (business as Business & { theme_bg?: string }).theme_bg || 'gradient'

  const headerStyle = getHeaderStyle(color, bg)
  const textColor   = getTextColor(bg, color)
  const isLight     = bg === 'soft'
  const hasQuiz     = (business.pref_questions ?? []).length > 0

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
  const [paymentDone,   setPaymentDone]   = useState(false)

  const [form, setForm] = useState<OrderForm>({
    customerName: '', customerPhone: '', note: '',
  })

  const updateForm = (field: keyof OrderForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  // ── Preload Razorpay ──────────────────────────────────────
  useEffect(() => { loadRazorpay() }, [])

  // ── Filtered products ─────────────────────────────────────
  const displayProducts = useMemo(() => {
    if (!quizDone || !answers.length) return products
    return matchProducts(products, answers)
  }, [products, answers, quizDone])

  const recommendedIds = useMemo(() => {
    if (!quizDone || !answers.length) return new Set<string>()
    const answerValues = answers.map((a) => a.answer.toLowerCase())
    return new Set(
      products
        .filter((p) => {
          const tags = [...(p.pref_tags ?? []), ...(p.variants ?? [])].map((t) => t.toLowerCase())
          return answerValues.some((a) => tags.some((t) => t.includes(a) || a.includes(t)))
        })
        .map((p) => p.id)
    )
  }, [products, answers, quizDone])

  // ── Cart helpers ──────────────────────────────────────────
  const totalAmount = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const totalItems  = cart.reduce((s, i) => s + i.quantity, 0)
  const getCartItem = (productId: string) => cart.find((i) => i.product.id === productId)

  const addToCart = (product: Product, variant = '', qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.variant === variant)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && i.variant === variant
            ? { ...i, quantity: Math.min(product.stock, i.quantity + qty) }
            : i
        )
      }
      return [...prev, { product, variant, quantity: qty }]
    })
  }

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0)
    )
  }

  const removeFromCart = (productId: string) =>
    setCart((prev) => prev.filter((i) => i.product.id !== productId))

  const openDetail = (product: Product) => {
    setSelected(product)
    setDetailVariant(product.variants[0] ?? '')
    setDetailQty(1)
    setScreen('detail')
  }

  const addDetailToCart = () => {
    if (!selected) return
    addToCart(selected, detailVariant, detailQty)
    setScreen('shop')
  }

  // ── Save order to database ─────────────────────────────────
  const saveOrder = async (
    paymentData: {
      razorpay_order_id:   string
      razorpay_payment_id: string
      razorpay_signature:  string
    } | null
  ) => {
    const response = await fetch('/api/orders', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id:    business.id,
        customer_name:  form.customerName.trim(),
        customer_phone: form.customerPhone.trim(),
        items: cart.map((i) => ({
          product_id: i.product.id,
          variant:    i.variant || null,
          quantity:   i.quantity,
          price:      i.product.price,
        })),
        total_amount:        totalAmount,
        notes:               form.note.trim() || null,
        razorpay_order_id:   paymentData?.razorpay_order_id   ?? null,
        razorpay_payment_id: paymentData?.razorpay_payment_id ?? null,
        razorpay_signature:  paymentData?.razorpay_signature  ?? null,
      }),
    })

    return response.json()
  }

  // ── Place order with Razorpay ─────────────────────────────
  const placeOrder = async () => {
    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      setError('Please fill in your name and WhatsApp number.')
      return
    }
    if (cart.length === 0) { setError('Your cart is empty.'); return }

    setLoading(true)
    setError(null)

    try {
      // Step 1: Create Razorpay order
      const orderRes = await fetch('/api/storefront-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id:   business.id,
          customer_name: form.customerName.trim(),
          customer_phone: form.customerPhone.trim(),
          items: cart.map((i) => ({
            product_id: i.product.id,
            variant:    i.variant || null,
            quantity:   i.quantity,
            price:      i.product.price,
          })),
          total_amount: totalAmount,
          notes:        form.note.trim() || null,
        }),
      })

      const orderData = await orderRes.json()

      if (!orderData.success) {
        setError(orderData.error ?? 'Failed to initiate payment.')
        setLoading(false)
        return
      }

      setLoading(false)

      // Step 2: Open Razorpay checkout
      const loaded = await loadRazorpay()
      if (!loaded) {
        setError('Failed to load payment gateway. Please try again.')
        return
      }

      const rzp = new window.Razorpay({
        key:         orderData.key_id,
        amount:      orderData.amount,
        currency:    orderData.currency,
        name:        business.name,
        description: `Order from ${business.name}`,
        order_id:    orderData.razorpay_order_id,
        prefill: {
          name:    form.customerName.trim(),
          contact: form.customerPhone.trim(),
        },
        theme: { color },
        handler: async (response) => {
          setLoading(true)

          // Step 3: Save order with payment details
          const saveData = await saveOrder({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
          })

          if (saveData.success) {
            setOrderRef(saveData.order_ref)
            setPaymentDone(true)
            setScreen('confirmed')
          } else {
            setError(saveData.error ?? 'Order failed after payment. Contact support.')
          }

          setLoading(false)
        },
        modal: {
          ondismiss: () => {
            setError('Payment cancelled. Please try again.')
            setLoading(false)
          },
        },
      })

      rzp.open()

    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const inputCls = [
    'w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors',
    'text-gray-900 bg-white placeholder-gray-400',
    'dark:text-gray-100 dark:bg-gray-800 dark:placeholder-gray-500',
    'border-gray-200 dark:border-gray-700',
  ].join(' ')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Header */}
      <div className="px-4 pt-10 pb-6 text-center relative overflow-hidden"
        style={headerStyle}>
        {(screen === 'detail' || screen === 'checkout' || screen === 'quiz') && (
          <button type="button" aria-label="Go back"
            onClick={() => setScreen('shop')}
            className="absolute left-4 top-4 text-2xl font-light"
            style={{ color: textColor }}>←</button>
        )}

        <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3
          border-2 bg-white/20" style={{ borderColor: `${textColor}44` }}>
          <StoreAvatar logoUrl={business.logo_url ?? null}
            name={business.name} emoji={config.emoji} />
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

        <div className="flex justify-center gap-2 flex-wrap">
          {(business.badges?.length > 0
            ? business.badges
            : config.badge ? [config.badge] : []
          ).map((badge) => (
            <span key={badge} className="text-xs px-3 py-1 rounded-full"
              style={{
                background: isLight ? `${color}22` : 'rgba(255,255,255,0.2)',
                color: isLight ? color : '#fff',
              }}>{badge}</span>
          ))}
          <span className="text-xs px-3 py-1 rounded-full"
            style={{
              background: isLight ? `${color}22` : 'rgba(255,255,255,0.2)',
              color: isLight ? color : '#fff',
            }}>💬 WhatsApp orders</span>
          <span className="text-xs px-3 py-1 rounded-full"
            style={{
              background: isLight ? `${color}22` : 'rgba(255,255,255,0.2)',
              color: isLight ? color : '#fff',
            }}>🚚 Ships India</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6 pb-32">

        {/* Quiz */}
        {screen === 'quiz' && hasQuiz && (
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
                className="w-full mb-4 py-4 rounded-2xl border-2 text-sm font-bold
                  flex items-center justify-between px-5"
                style={{ borderColor: color, color }}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <div className="text-left">
                    <p className="font-bold">Help me choose</p>
                    <p className="text-xs opacity-60 font-normal">
                      Answer {business.pref_questions.length} quick questions
                    </p>
                  </div>
                </div>
                <span>→</span>
              </button>
            )}

            {quizDone && (
              <div className="mb-4 px-4 py-3 rounded-2xl flex items-center justify-between"
                style={{ background: `${color}15` }}>
                <div>
                  <p className="text-sm font-bold" style={{ color }}>
                    ✨ {recommendedIds.size > 0
                      ? `${recommendedIds.size} products match your taste!`
                      : 'Showing all products'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Based on your preferences</p>
                </div>
                <button type="button"
                  onClick={() => { setAnswers([]); setQuizDone(false) }}
                  className="text-xs text-gray-400 underline">Reset</button>
              </div>
            )}

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

            {business.whatsapp && totalItems === 0 && (
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
              <ProductThumbnail photoUrl={selected.photo_url ?? null}
                emoji={selected.emoji} name={selected.name} color={color} />
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
                    <button key={v} type="button" onClick={() => setDetailVariant(v)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold border-2"
                      style={{
                        background:  detailVariant === v ? color : 'transparent',
                        color:       detailVariant === v ? '#fff' : color,
                        borderColor: color,
                      }}>{v}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase
                tracking-wide text-gray-500 mb-2">Quantity</label>
              <div className="flex items-center gap-4">
                <button type="button"
                  onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-full border-2 text-lg font-bold
                    flex items-center justify-center"
                  style={{ borderColor: color, color }}>−</button>
                <span className="text-xl font-bold text-gray-900 dark:text-white
                  min-w-8 text-center">{detailQty}</span>
                <button type="button"
                  onClick={() => setDetailQty((q) => Math.min(selected.stock, q + 1))}
                  className="w-10 h-10 rounded-full text-white text-lg font-bold
                    flex items-center justify-center"
                  style={{ background: color }}>+</button>
              </div>
            </div>

            <div className="rounded-2xl p-4 mb-4 flex justify-between items-center"
              style={{ background: `${color}15` }}>
              <span className="text-sm text-gray-600">
                {detailQty} × {formatPrice(selected.price)}
              </span>
              <span className="text-2xl font-bold" style={{ color }}>
                {formatPrice(selected.price * detailQty)}
              </span>
            </div>

            <button type="button" onClick={addDetailToCart}
              className="w-full py-4 rounded-2xl text-white text-base font-bold
                transition-all active:scale-[0.98]"
              style={{ background: color }}>🛒 Add to Cart</button>
            <button type="button" onClick={() => setScreen('shop')}
              className="w-full py-3 text-sm font-semibold mt-2" style={{ color }}>
              ← Continue Shopping
            </button>
          </div>
        )}

        {/* Checkout */}
        {screen === 'checkout' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Your Order
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Review and pay</p>
              </div>
              <button type="button" onClick={() => setScreen('shop')}
                className="text-sm font-bold px-3 py-1.5 rounded-xl border-2"
                style={{ borderColor: color, color }}>✏️ Edit</button>
            </div>

            {/* Cart items */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border
              border-gray-100 dark:border-gray-800 p-4 mb-4">
              {cart.map((item) => (
                <div key={`${item.product.id}-${item.variant}`}
                  className="flex items-center gap-3 py-2 border-b
                    border-gray-100 last:border-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                    <ProductThumbnail photoUrl={item.product.photo_url ?? null}
                      emoji={item.product.emoji} name={item.product.name} color={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {item.product.name}{item.variant ? ` · ${item.variant}` : ''}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatPrice(item.product.price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold" style={{ color }}>
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                    <button type="button" onClick={() => removeFromCart(item.product.id)}
                      className="text-gray-300 hover:text-red-400 text-lg">×</button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 mt-1">
                <span className="text-sm font-bold text-gray-700">
                  Total ({totalItems} items)
                </span>
                <span className="text-xl font-bold" style={{ color }}>
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
              Your Details
            </h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600
                text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
            )}

            <div className="space-y-3 mb-6">
              <input type="text" value={form.customerName}
                onChange={(e) => updateForm('customerName', e.target.value)}
                placeholder="Your full name" className={inputCls} />
              <div>
                <input type="tel" value={form.customerPhone}
                  onChange={(e) => updateForm('customerPhone', e.target.value)}
                  placeholder="+91 98765 43210" className={inputCls} />
                <p className="text-xs text-gray-400 mt-1">
                  Include country code e.g. +91 for India
                </p>
              </div>
              <textarea value={form.note}
                onChange={(e) => updateForm('note', e.target.value)}
                placeholder="Any special note? (optional)"
                rows={2} className={inputCls + ' resize-none'} />
            </div>

            {/* Pay button */}
            <button type="button" onClick={placeOrder} disabled={loading}
              className="w-full py-4 rounded-2xl text-white text-base font-bold
                transition-all disabled:opacity-50 active:scale-[0.98]
                flex items-center justify-center gap-2"
              style={{ background: color }}>
              {loading ? (
                'Processing...'
              ) : (
                <>
                  <span>Pay {formatPrice(totalAmount)}</span>
                  <span className="text-xs opacity-70">via Razorpay</span>
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              🔒 Secure payment via Razorpay · UPI, Cards, Netbanking
            </p>
          </div>
        )}

        {/* Confirmed */}
        {screen === 'confirmed' && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center
              text-4xl mx-auto mb-4" style={{ background: `${color}20` }}>
              {paymentDone ? '✅' : '🎉'}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Order Confirmed! 🎉
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              {paymentDone
                ? '✅ Payment successful!'
                : `${business.name} will contact you on WhatsApp.`}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {business.name} will process your order soon.
            </p>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border
              border-gray-100 dark:border-gray-800 p-4 text-left mb-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-xs text-gray-400">Order Ref</span>
                <span className="text-xs font-bold text-gray-900">{orderRef}</span>
              </div>
              {cart.map((item) => (
                <div key={`${item.product.id}-${item.variant}`}
                  className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-400 truncate flex-1 mr-2">
                    {item.product.name}{item.variant ? ` · ${item.variant}` : ''} × {item.quantity}
                  </span>
                  <span className="text-xs font-bold text-gray-900 flex-shrink-0">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-3">
                <span className="text-xs font-bold text-gray-500">Total Paid</span>
                <span className="text-sm font-bold" style={{ color }}>
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            {business.whatsapp && (
              <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}?text=Hi! I just paid and placed order ${orderRef} on OrdrX. Total: ${formatPrice(totalAmount)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2
                  bg-[#25D366] text-white rounded-2xl py-3 font-bold text-sm mb-3">
                💬 Message {business.name} on WhatsApp
              </a>
            )}

            <button type="button"
              onClick={() => {
                setScreen('shop')
                setCart([])
                setPaymentDone(false)
                setForm({ customerName: '', customerPhone: '', note: '' })
              }}
              className="text-sm font-semibold" style={{ color }}>
              ← Back to shop
            </button>
          </div>
        )}

      </div>

      {/* Cart Bar */}
      {screen === 'shop' && (
        <CartBar cart={cart} color={color} onCheckout={() => setScreen('checkout')} />
      )}

      <p className="text-center text-xs text-gray-400 py-6">
        ⚡ Powered by OrdrX · ThiranX
      </p>
    </div>
  )
}