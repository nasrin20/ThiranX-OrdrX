'use client'

// OrdrX — Explore Page (Bright Version)
import { Suspense } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

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

const TYPE_CONFIG: Record<string, { emoji: string; label: string }> = {
  perfume:   { emoji: '🧴', label: 'Perfume & Attar'  },
  clothing:  { emoji: '👗', label: 'Clothing'         },
  bakery:    { emoji: '🎂', label: 'Bakery & Sweets'  },
  jewellery: { emoji: '💍', label: 'Jewellery'        },
  food:      { emoji: '🍱', label: 'Home Food'        },
  candles:   { emoji: '🕯️', label: 'Candles'         },
  salon:     { emoji: '💆', label: 'Salon & Beauty'   },
  digital:   { emoji: '💻', label: 'Digital Products' },
  other:     { emoji: '✨', label: 'Other'            },
}

const CATEGORIES = [
  { value: '',          label: 'All Stores', emoji: '✦'  },
  { value: 'perfume',   label: 'Perfumes',   emoji: '🧴' },
  { value: 'clothing',  label: 'Clothing',   emoji: '👗' },
  { value: 'bakery',    label: 'Bakery',     emoji: '🎂' },
  { value: 'jewellery', label: 'Jewellery',  emoji: '💍' },
  { value: 'food',      label: 'Food',       emoji: '🍱' },
  { value: 'candles',   label: 'Candles',    emoji: '🕯️'},
  { value: 'salon',     label: 'Salon',      emoji: '💆' },
  { value: 'digital',   label: 'Digital',    emoji: '💻' },
]

function StoreCard({ store }: { store: StoreListing }) {
  const config = TYPE_CONFIG[store.type] ?? { emoji: '✨', label: 'Store' }
  const banner = store.banner_images?.[0] ?? null
  const color  = store.theme_color || '#b5860d'

  return (
    <Link href={`/${store.slug}`}
      className="group block bg-white rounded-3xl overflow-hidden
        border border-gray-100 hover:border-gray-200
        shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

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

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-gray-900 truncate text-sm
            group-hover:text-amber-600 transition-colors">
            {store.name}
          </h3>
          {store.instagram_handle && (
            <span className="text-xs text-gray-400 flex-shrink-0">
              @{store.instagram_handle}
            </span>
          )}
        </div>

        {store.city && (
          <p className="text-xs text-gray-400 mb-2">📍 {store.city}</p>
        )}

        {store.bio && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {store.bio}
          </p>
        )}

        {store.badges?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {store.badges.slice(0, 2).map((b) => (
              <span key={b} className="text-xs bg-amber-50 text-amber-600
                px-2 py-0.5 rounded-full border border-amber-100">{b}</span>
            ))}
            {store.badges.length > 2 && (
              <span className="text-xs text-gray-400">+{store.badges.length - 2}</span>
            )}
          </div>
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
          <span className="text-xs font-bold text-amber-500">Shop →</span>
        </div>
      </div>
    </Link>
  )
}

function ExploreContent() {
  const supabase     = createClient()
  const searchParams = useSearchParams()
  const initialType  = searchParams.get('type') ?? ''

  const [stores,     setStores]     = useState<StoreListing[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [activeType, setActiveType] = useState(initialType)
  const [activeCity, setActiveCity] = useState('')
  const [cities,     setCities]     = useState<string[]>([])

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('businesses')
        .select(`id, name, slug, type, city, bio, logo_url, banner_images, badges, theme_color, is_verified, instagram_handle, instagram_followers`)
        .eq('active', true)
        .order('is_verified', { ascending: false })
        .order('created_at', { ascending: false })

      if (!data) { setLoading(false); return }

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

      setStores(withCounts)
      const uniqueCities = [...new Set(
        withCounts.map((s) => s.city).filter((c): c is string => !!c)
      )].sort()
      setCities(uniqueCities)
      setLoading(false)
    }
    fetchStores()
  }, [supabase])

  const filtered = useMemo(() => {
    return stores.filter((store) => {
      const matchType   = !activeType || store.type === activeType
      const matchCity   = !activeCity || store.city === activeCity
      const matchSearch = !search || [
        store.name, store.bio, store.city, store.instagram_handle,
        ...(store.badges ?? []),
      ].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
      return matchType && matchCity && matchSearch
    })
  }, [stores, activeType, activeCity, search])

  return (
    <main className="min-h-screen bg-gray-50">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl
        border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-black text-gray-900">
              ⚡ OrdrX
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-500">Explore</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-semibold text-gray-500 hover:text-gray-900">
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

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            Discover Indian Stores 🛍️
          </h1>
          <p className="text-gray-500">
            {loading ? 'Loading stores...' : `${filtered.length} stores found`}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores, cities, products..."
            className="w-full bg-white border border-gray-200 rounded-2xl
              pl-10 pr-4 py-3.5 text-sm text-gray-900 placeholder-gray-400
              outline-none focus:border-amber-400 focus:ring-2
              focus:ring-amber-100 transition-all shadow-sm" />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
          {CATEGORIES.map((cat) => (
            <button key={cat.value} type="button"
              onClick={() => setActiveType(cat.value)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2
                rounded-full text-sm font-semibold transition-all whitespace-nowrap
                border"
              style={{
                background:   activeType === cat.value ? '#f59e0b' : '#fff',
                color:        activeType === cat.value ? '#fff' : '#6b7280',
                borderColor:  activeType === cat.value ? '#f59e0b' : '#e5e7eb',
              }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* City pills */}
        {cities.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-6">
            <button type="button" onClick={() => setActiveCity('')}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs
                font-semibold border transition-all"
              style={{
                background:  !activeCity ? '#fef3c7' : '#fff',
                color:       !activeCity ? '#92400e' : '#6b7280',
                borderColor: !activeCity ? '#fcd34d' : '#e5e7eb',
              }}>
              📍 All Cities
            </button>
            {cities.map((city) => (
              <button key={city} type="button" onClick={() => setActiveCity(city)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs
                  font-semibold border transition-all whitespace-nowrap"
                style={{
                  background:  activeCity === city ? '#fef3c7' : '#fff',
                  color:       activeCity === city ? '#92400e' : '#6b7280',
                  borderColor: activeCity === city ? '#fcd34d' : '#e5e7eb',
                }}>
                📍 {city}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden
                border border-gray-100 animate-pulse">
                <div className="h-40 bg-gray-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                  <div className="h-3 bg-gray-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No stores found</h3>
            <p className="text-gray-500 mb-6">Try a different search or category</p>
            <button type="button"
              onClick={() => { setSearch(''); setActiveType(''); setActiveCity('') }}
              className="text-sm font-semibold text-amber-500 hover:underline">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 rounded-3xl p-10 text-center"
          style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
          <div className="text-4xl mb-3">🏪</div>
          <h3 className="text-2xl font-black text-white mb-2">
            Your store could be here
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            Get discovered by buyers across India. Free forever.
          </p>
          <Link href="/signup"
            className="inline-flex items-center gap-2
              bg-gradient-to-r from-amber-500 to-orange-500
              text-white font-bold text-sm px-6 py-3 rounded-full
              hover:opacity-90 transition-opacity">
            Start My Free Store →
          </Link>
        </div>

      </div>
    </main>
  )
}
export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🛍️</div>
          <p className="text-sm text-gray-400">Loading stores...</p>
        </div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  )
}