// OrdrX — Homepage v3
// Bright, bold, premium — Shopify/Stripe/Zepto inspired

import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface StoreListing {
  id:                  string
  name:                string
  slug:                string
  type:                string
  city:                string | null
  bio:                 string | null
  logo_url:            string | null
  banner_images:       string[]
  badges:              string[]
  theme_color:         string
  is_verified:         boolean
  instagram_handle:    string | null
  instagram_followers: number
  product_count:       number
}

const TYPE_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  perfume:   { emoji: '🧴', label: 'Perfumes',   color: '#f0abfc' },
  clothing:  { emoji: '👗', label: 'Clothing',   color: '#93c5fd' },
  bakery:    { emoji: '🎂', label: 'Bakery',     color: '#fcd34d' },
  jewellery: { emoji: '💍', label: 'Jewellery',  color: '#fca5a5' },
  food:      { emoji: '🍱', label: 'Home Food',  color: '#86efac' },
  candles:   { emoji: '🕯️', label: 'Candles',   color: '#fdba74' },
  salon:     { emoji: '💆', label: 'Salon',      color: '#c4b5fd' },
  digital:   { emoji: '💻', label: 'Digital',    color: '#67e8f9' },
  other:     { emoji: '✨', label: 'Other',      color: '#e2e8f0' },
}

async function getFeaturedStores(): Promise<StoreListing[]> {
  const { data } = await supabase
    .from('businesses')
    .select(`id, name, slug, type, city, bio, logo_url, banner_images, badges, theme_color, is_verified, instagram_handle, instagram_followers`)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(6)

  if (!data) return []

  const withCounts = await Promise.all(
    data.map(async (store) => {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', store.id)
        .eq('active', true)
      return { ...store, product_count: count ?? 0 }
    })
  )
  return withCounts
}

function StoreCard({ store }: { store: StoreListing }) {
  const config = TYPE_CONFIG[store.type] ?? { emoji: '✨', label: 'Store', color: '#e2e8f0' }
  const banner = store.banner_images?.[0] ?? null
  const color  = store.theme_color || '#b5860d'

  return (
    <Link href={`/${store.slug}`}
      className="group block bg-white rounded-3xl overflow-hidden
        border border-gray-100 hover:border-gray-200
        shadow-sm hover:shadow-xl transition-all duration-300
        hover:-translate-y-1">

      {/* Banner */}
      <div className="relative h-40 overflow-hidden"
        style={{ background: banner ? 'transparent' : `${color}15` }}>
        {banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner} alt={store.name}
            className="w-full h-full object-cover group-hover:scale-105
              transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {config.emoji}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        {store.is_verified && (
          <div className="absolute top-3 right-3 bg-white text-green-600
            text-xs font-bold px-2.5 py-1 rounded-full shadow-sm
            flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            Verified
          </div>
        )}

        <div className="absolute bottom-3 left-3">
          <div className="w-12 h-12 rounded-2xl border-2 border-white overflow-hidden
            shadow-lg bg-white flex items-center justify-center">
            {store.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logo_url} alt={store.name}
                className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">{config.emoji}</span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-gray-900 truncate text-sm
            group-hover:text-[#b5860d] transition-colors">
            {store.name}
          </h3>
        </div>

        {store.city && (
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <span>📍</span>{store.city}
          </p>
        )}

        {store.bio && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {store.bio}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              <span className="font-bold text-gray-700">{store.product_count}</span> products
            </span>
            {store.instagram_followers > 0 && (
              <span className="text-xs text-gray-400">
                <span className="font-bold text-gray-700">
                  {store.instagram_followers >= 1000
                    ? `${(store.instagram_followers / 1000).toFixed(1)}K`
                    : store.instagram_followers}
                </span> followers
              </span>
            )}
          </div>
          <span className="text-xs font-bold text-[#b5860d] group-hover:gap-2">
            Shop →
          </span>
        </div>
      </div>
    </Link>
  )
}

export default async function HomePage() {
  const stores = await getFeaturedStores()

  const CATEGORIES = [
    { emoji: '🧴', label: 'Perfumes',   type: 'perfume',   bg: '#fdf4ff', color: '#a855f7' },
    { emoji: '👗', label: 'Clothing',   type: 'clothing',  bg: '#eff6ff', color: '#3b82f6' },
    { emoji: '🎂', label: 'Bakery',     type: 'bakery',    bg: '#fffbeb', color: '#f59e0b' },
    { emoji: '💍', label: 'Jewellery',  type: 'jewellery', bg: '#fff1f2', color: '#f43f5e' },
    { emoji: '🍱', label: 'Home Food',  type: 'food',      bg: '#f0fdf4', color: '#22c55e' },
    { emoji: '🕯️', label: 'Candles',   type: 'candles',   bg: '#fff7ed', color: '#f97316' },
    { emoji: '💆', label: 'Salon',      type: 'salon',     bg: '#faf5ff', color: '#8b5cf6' },
    { emoji: '💻', label: 'Digital',    type: 'digital',   bg: '#ecfeff', color: '#06b6d4' },
  ]

  const FEATURES = [
    { icon: '⚡', title: 'Live in 2 minutes', desc: 'Signup → add products → share your link. That\'s it.' },
    { icon: '🛒', title: 'Real cart system',  desc: 'Customers add multiple products and checkout in one go.' },
    { icon: '💳', title: 'UPI payments',      desc: 'Customers pay directly to your UPI. No middleman.' },
    { icon: '📊', title: 'Order dashboard',   desc: 'Track every order, payment, and customer in one place.' },
    { icon: '🎯', title: 'Smart quiz',        desc: 'Help customers find the right product with a preference quiz.' },
    { icon: '📧', title: 'Instant alerts',    desc: 'Get email the moment a new order comes in. Never miss a sale.' },
  ]

  return (
    <main className="min-h-screen bg-white overflow-x-hidden">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl
        border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-xl font-black text-gray-900">
              ⚡ OrdrX
            </span>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/explore"
                className="text-sm font-medium text-gray-500 hover:text-gray-900
                  transition-colors">
                Explore Stores
              </Link>
              <a href="#how-it-works"
                className="text-sm font-medium text-gray-500 hover:text-gray-900
                  transition-colors">
                How it works
              </a>
              <a href="#pricing"
                className="text-sm font-medium text-gray-500 hover:text-gray-900
                  transition-colors">
                Pricing
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-semibold text-gray-600 hover:text-gray-900
                transition-colors">
              Sign in
            </Link>
            <Link href="/signup"
              className="text-sm font-bold bg-gray-900 text-white px-5 py-2.5
                rounded-full hover:bg-gray-700 transition-colors">
              Start Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/30
          rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-200/20
          rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800
            text-xs font-bold px-4 py-1.5 rounded-full mb-6 border border-amber-200">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            India&apos;s #1 Instagram Store Platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight mb-6">
            Your Instagram store,{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text
                bg-gradient-to-r from-amber-500 to-orange-500">
                sorted.
              </span>
              <span className="absolute inset-x-0 bottom-1 h-4 bg-amber-200/60
                rounded-sm -z-0" />
            </span>
          </h1>

          <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto">
            Turn your DMs into a real store in 2 minutes.
            Or discover unique products from India&apos;s best small sellers.
          </p>

          {/* ── SPLIT CARDS ── */}
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-12">

            {/* Buyer */}
            <Link href="/explore"
              className="group relative text-left rounded-3xl p-7 overflow-hidden
                hover:-translate-y-1 transition-all duration-300
                hover:shadow-2xl block"
              style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300/30
                rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="text-4xl mb-4">🛍️</div>
                <div className="text-xs font-bold uppercase tracking-widest
                  text-amber-600 mb-2">For Buyers</div>
                <h2 className="text-2xl font-black text-gray-900 mb-2 leading-tight">
                  Discover local stores
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">
                  Browse handpicked Indian sellers. Order directly.
                  Support small businesses.
                </p>
                <div className="flex flex-col gap-1.5 mb-5">
                  {['Verified Instagram sellers', 'Direct UPI payment', 'WhatsApp support'].map((p) => (
                    <div key={p} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-4 h-4 bg-amber-400 rounded-full flex items-center
                        justify-center text-white text-[10px] font-bold flex-shrink-0">✓</span>
                      {p}
                    </div>
                  ))}
                </div>
                <div className="inline-flex items-center gap-2 bg-amber-400
                  hover:bg-amber-500 text-white font-bold text-sm px-5 py-2.5
                  rounded-full transition-colors">
                  Explore Stores →
                </div>
              </div>
            </Link>

            {/* Seller */}
            <Link href="/signup"
              className="group relative text-left rounded-3xl p-7 overflow-hidden
                hover:-translate-y-1 transition-all duration-300
                hover:shadow-2xl block"
              style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20
                rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="text-4xl mb-4">🏪</div>
                <div className="text-xs font-bold uppercase tracking-widest
                  text-orange-400 mb-2">For Sellers</div>
                <h2 className="text-2xl font-black text-white mb-2 leading-tight">
                  Start your free store
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed mb-5">
                  Get your own store link. Add products.
                  Get orders automatically. All free.
                </p>
                <div className="flex flex-col gap-1.5 mb-5">
                  {['Free forever · No commission', 'Setup in 2 minutes', 'Your brand, your colors'].map((p) => (
                    <div key={p} className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="w-4 h-4 bg-orange-500 rounded-full flex items-center
                        justify-center text-white text-[10px] font-bold flex-shrink-0">✓</span>
                      {p}
                    </div>
                  ))}
                </div>
                <div className="inline-flex items-center gap-2 bg-gradient-to-r
                  from-amber-500 to-orange-500 text-white font-bold text-sm
                  px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
                  style={{ boxShadow: '0 4px 20px rgba(249,115,22,0.4)' }}>
                  Start Free Store →
                </div>
              </div>
            </Link>

          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 justify-center">
            {[
              { num: '₹0',    label: 'Commission ever'  },
              { num: '2 min', label: 'To go live'       },
              { num: '100%',  label: 'Free forever'     },
              { num: '9+',    label: 'Business types'   },
            ].map((stat) => (
              <div key={stat.label}
                className="flex items-center gap-2 bg-white/80 border border-gray-200
                  px-4 py-2 rounded-full shadow-sm">
                <span className="text-lg font-black text-gray-900">{stat.num}</span>
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest
              text-gray-400 mb-2">What&apos;s on OrdrX</p>
            <h2 className="text-3xl font-black text-gray-900">
              Shop by category
            </h2>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {CATEGORIES.map((cat) => (
              <Link key={cat.type} href={`/explore?type=${cat.type}`}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl
                  hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                style={{ background: cat.bg }}>
                <span className="text-3xl">{cat.emoji}</span>
                <span className="text-xs font-semibold text-center leading-tight"
                  style={{ color: cat.color }}>
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED STORES ── */}
      {stores.length > 0 && (
        <section className="py-16 bg-gray-50 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest
                  text-gray-400 mb-2">Featured Stores</p>
                <h2 className="text-3xl font-black text-gray-900">
                  Discover Indian sellers
                </h2>
              </div>
              <Link href="/explore"
                className="text-sm font-bold text-[#b5860d] hover:underline
                  underline-offset-2">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest
            text-gray-400 mb-3">How it works</p>
          <h2 className="text-4xl font-black text-gray-900 mb-4">
            From DMs to store in{' '}
            <span className="text-transparent bg-clip-text
              bg-gradient-to-r from-amber-500 to-orange-500">
              2 minutes
            </span>
          </h2>
          <p className="text-gray-500 mb-14 max-w-xl mx-auto">
            No tech knowledge needed. No monthly fees.
            Just your store, your products, your customers.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                step: '01', icon: '🏪', bg: '#fffbeb',
                title: 'Create your store',
                desc: 'Sign up with your email. Your store goes live at ordrx.in/@yourhandle instantly.',
              },
              {
                step: '02', icon: '🧴', bg: '#f0fdf4',
                title: 'Add your products',
                desc: 'Upload photos, set prices, add variants. Takes under 5 minutes.',
              },
              {
                step: '03', icon: '🎉', bg: '#faf5ff',
                title: 'Get orders!',
                desc: 'Share your link in Instagram bio. Get orders, payments, and customers automatically.',
              },
            ].map((item) => (
              <div key={item.step} className="relative rounded-3xl p-7 text-left"
                style={{ background: item.bg }}>
                <div className="text-xs font-black text-gray-300 mb-3 font-mono">
                  {item.step}
                </div>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title}
                className="bg-white border border-gray-100 rounded-2xl p-5 text-left
                  hover:border-amber-200 hover:shadow-md transition-all">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest
            text-gray-400 mb-3">Pricing</p>
          <h2 className="text-4xl font-black text-gray-900 mb-4">
            Start free. Scale as you grow.
          </h2>
          <p className="text-gray-500 mb-14 max-w-xl mx-auto">
            No hidden fees. No commission on orders. Ever.
          </p>

          {/* <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                name: 'Free', price: '₹0', period: 'forever',
                highlight: false,
                features: ['20 products', '50 orders/mo', 'WhatsApp invoices', 'Preference quiz'],
              },
              {
                name: 'Starter', price: '₹299', period: '/month',
                highlight: false,
                features: ['50 products', '200 orders/mo', 'Email alerts', 'Custom badges'],
              },
              {
                name: 'Growth', price: '₹799', period: '/month',
                highlight: true,
                features: ['200 products', '1000 orders/mo', 'Revenue reports', 'Priority support'],
              },
              {
                name: 'Pro', price: '₹1,499', period: '/month',
                highlight: false,
                features: ['Unlimited products', 'Unlimited orders', 'API access', 'White label'],
              },
            ].map((plan) => (
              <div key={plan.name}
                className={`rounded-3xl p-6 text-left relative ${
                  plan.highlight
                    ? 'bg-gray-900 text-white shadow-2xl scale-105'
                    : 'bg-white border border-gray-100'
                }`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2
                    bg-gradient-to-r from-amber-500 to-orange-500
                    text-white text-xs font-bold px-3 py-1 rounded-full">
                    ⭐ Most Popular
                  </div>
                )}
                <h3 className={`text-sm font-bold mb-3 ${
                  plan.highlight ? 'text-gray-400' : 'text-gray-500'
                }`}>{plan.name}</h3>
                <div className="mb-4">
                  <span className={`text-3xl font-black ${
                    plan.highlight ? 'text-white' : 'text-gray-900'
                  }`}>{plan.price}</span>
                  <span className={`text-sm ${
                    plan.highlight ? 'text-gray-500' : 'text-gray-400'
                  }`}>{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-xs ${
                      plan.highlight ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      <span className={plan.highlight ? 'text-amber-400' : 'text-amber-500'}>
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup"
                  className={`block w-full text-center py-2.5 rounded-xl text-xs
                    font-bold transition-colors ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  Get started
                </Link>
              </div>
            ))}
          </div> */}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="rounded-3xl p-12 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10
              rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10
              rounded-full blur-3xl" />
            <div className="relative">
              <div className="text-5xl mb-4">⚡</div>
              <h2 className="text-4xl font-black text-white mb-4">
                Ready to launch your store?
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                Join sellers across India already using OrdrX.
                Free forever. No credit card. Setup in 2 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2
                    bg-gradient-to-r from-amber-500 to-orange-500
                    text-white font-bold text-base px-8 py-4 rounded-full
                    hover:opacity-90 transition-opacity"
                  style={{ boxShadow: '0 4px 24px rgba(249,115,22,0.4)' }}>
                  Create Free Store →
                </Link>
                <Link href="/explore"
                  className="inline-flex items-center justify-center gap-2
                    border border-white/20 text-white font-semibold text-base
                    px-8 py-4 rounded-full hover:bg-white/10 transition-colors">
                  Browse Stores
                </Link>
              </div>
              <p className="text-xs text-gray-600 mt-4">
                Takes 2 minutes · No credit card · Free forever
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-50 border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
            <div>
              <div className="text-xl font-black text-gray-900 mb-2">⚡ OrdrX</div>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                Turn your Instagram DMs into a real store.
                Built for Indian small businesses.
              </p>
              <p className="text-xs text-gray-400 mt-2">by ThiranX</p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest
                  text-gray-400 mb-3">Product</p>
                <div className="space-y-2">
                  {[
                    { label: 'Explore Stores', href: '/explore' },
                    { label: 'How it works',   href: '#how-it-works' },
                    { label: 'Pricing',        href: '#pricing' },
                  ].map((l) => (
                    <Link key={l.label} href={l.href}
                      className="block text-sm text-gray-500 hover:text-gray-900
                        transition-colors">{l.label}</Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest
                  text-gray-400 mb-3">Account</p>
                <div className="space-y-2">
                  {[
                    { label: 'Sign up', href: '/signup' },
                    { label: 'Sign in', href: '/login'  },
                  ].map((l) => (
                    <Link key={l.label} href={l.href}
                      className="block text-sm text-gray-500 hover:text-gray-900
                        transition-colors">{l.label}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-gray-200 flex flex-col md:flex-row
            items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} ThiranX. Built with ❤️ for Indian small businesses.
            </p>
            <p className="text-xs text-gray-400">
              Made in Australia 🇦🇺 · For India 🇮🇳
            </p>
          </div>
        </div>
      </footer>

    </main>
  )
}