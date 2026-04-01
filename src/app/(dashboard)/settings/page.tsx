'use client'

// OrdrX — Settings Page with Shipping Configuration

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Business, BusinessType, ShippingType } from '@/types'
import { BUSINESS_TYPE_CONFIG } from '@/constants/businessTypes'
import { DEFAULT_QUESTIONS, PrefQuestion } from '@/constants/preferences'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const inputCls = [
  'w-full px-4 py-2.5 rounded-xl border text-sm',
  'outline-none transition-colors',
  'text-gray-900 bg-white placeholder-gray-400',
  'dark:text-gray-100 dark:bg-gray-800 dark:placeholder-gray-500',
  'border-[#f0e8de] focus:border-[#b5860d]',
  'dark:border-gray-700 dark:focus:border-[#b5860d]',
].join(' ')

const labelCls =
  'block text-xs font-semibold uppercase tracking-wide mb-1.5 text-gray-500 dark:text-gray-400'

const THEME_COLORS = [
  { name: 'Gold',    value: '#b5860d' },
  { name: 'Purple',  value: '#7c4dca' },
  { name: 'Pink',    value: '#d4478a' },
  { name: 'Green',   value: '#1a8a6e' },
  { name: 'Orange',  value: '#e05c2a' },
  { name: 'Blue',    value: '#4e8ef7' },
  { name: 'Red',     value: '#e53935' },
  { name: 'Teal',    value: '#00897b' },
  { name: 'Indigo',  value: '#3949ab' },
  { name: 'Rose',    value: '#e91e63' },
  { name: 'Amber',   value: '#f59e0b' },
  { name: 'Emerald', value: '#10b981' },
]

const BG_OPTIONS = [
  { name: 'Gradient', value: 'gradient' },
  { name: 'Solid',    value: 'solid'    },
  { name: 'Dark',     value: 'dark'     },
  { name: 'Soft',     value: 'soft'     },
]

const BADGE_SUGGESTIONS = [
  '🌿 Alcohol Free', '🐰 Cruelty Free', '🌱 Vegan',
  '🏠 Homemade', '✋ Handcrafted', '🚚 Free Delivery',
  '💵 COD Available', '⭐ Premium Quality', '🎁 Gift Wrapping',
  '♻️ Eco Friendly', '🌸 Natural', '💯 Authentic',
]

// ── Preset shipping rates ─────────────────────────────────
const SHIPPING_PRESETS = [50, 80, 100, 150, 200]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border
      border-[#f0e8de] dark:border-gray-800 p-5 space-y-4">
      <h2 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h2>
      {children}
    </div>
  )
}

function QuestionEditor({
  question, index, onUpdate, onDelete, color,
}: {
  question: PrefQuestion; index: number
  onUpdate: (q: PrefQuestion) => void
  onDelete: () => void; color: string
}) {
  const [optionInput, setOptionInput] = useState('')
  const addOption = () => {
    const o = optionInput.trim()
    if (o && !question.options.includes(o) && question.options.length < 6) {
      onUpdate({ ...question, options: [...question.options, o] })
    }
    setOptionInput('')
  }
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
          Question {index + 1}
        </span>
        <button type="button" onClick={onDelete}
          className="text-xs text-red-400 hover:text-red-500">Remove</button>
      </div>
      <input type="text" value={question.question}
        onChange={(e) => onUpdate({ ...question, question: e.target.value })}
        placeholder="e.g. What scent do you prefer?" className={inputCls} />
      <div>
        <p className="text-xs text-gray-400 mb-2">Options ({question.options.length}/6):</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {question.options.map((opt) => (
            <span key={opt} className="flex items-center gap-1 text-xs font-semibold
              px-2.5 py-1 rounded-full"
              style={{ background: `${color}20`, color }}>
              {opt}
              <button type="button"
                onClick={() => onUpdate({ ...question, options: question.options.filter((o) => o !== opt) })}
                className="hover:text-red-500">×</button>
            </span>
          ))}
        </div>
        {question.options.length < 6 && (
          <div className="flex gap-2">
            <input type="text" value={optionInput}
              onChange={(e) => setOptionInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addOption()}
              placeholder="Add option..."
              className={cn(inputCls, 'flex-1 text-xs py-2')} />
            <Button variant="secondary" size="sm" type="button" onClick={addOption}>
              Add
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const supabase  = createClient()
  const router    = useRouter()
  const fileRef   = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  const [business,         setBusiness]         = useState<Business | null>(null)
  const [loading,          setLoading]          = useState(true)
  const [saving,           setSaving]           = useState(false)
  const [uploading,        setUploading]        = useState(false)
  const [uploadingBanner,  setUploadingBanner]  = useState(false)
  const [saved,            setSaved]            = useState(false)
  const [error,            setError]            = useState<string | null>(null)

  // Form state
  const [name,             setName]             = useState('')
  const [bio,              setBio]              = useState('')
  const [aboutUs,          setAboutUs]          = useState('')
  const [address,          setAddress]          = useState('')
  const [whatsapp,         setWhatsapp]         = useState('')
  const [email,            setEmail]            = useState('')
  const [upiId,            setUpiId]            = useState('')
  const [city,             setCity]             = useState('')
  const [instagramHandle,  setInstagramHandle]  = useState('')
  const [instagramFollowers, setInstagramFollowers] = useState('')
  const [type,             setType]             = useState<BusinessType>('perfume')
  const [logoUrl,          setLogoUrl]          = useState<string | null>(null)
  const [logoPreview,      setLogoPreview]      = useState<string | null>(null)
  const [bannerImages,     setBannerImages]     = useState<string[]>([])
  const [badges,           setBadges]           = useState<string[]>([])
  const [customBadge,      setCustomBadge]      = useState('')
  const [themeColor,       setThemeColor]       = useState('#b5860d')
  const [themeBg,          setThemeBg]          = useState('gradient')
  const [questions,        setQuestions]        = useState<PrefQuestion[]>([])

  // Shipping state
  const [shippingType,      setShippingType]      = useState<ShippingType>('free')
  const [shippingRate,      setShippingRate]      = useState(0)
  const [shippingFreeAbove, setShippingFreeAbove] = useState(0)
  const [customRate,        setCustomRate]        = useState('')

  const fetchBusiness = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: biz } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!biz) { router.push('/onboarding'); return }

    setBusiness(biz)
    setName(biz.name              ?? '')
    setBio(biz.bio                ?? '')
    setAboutUs(biz.about_us       ?? '')
    setAddress(biz.address        ?? '')
    setWhatsapp(biz.whatsapp      ?? '')
    setEmail(biz.email            ?? '')
    setUpiId(biz.upi_id              ?? '')
    setCity(biz.city                 ?? '')
    setInstagramHandle(biz.instagram_handle   ?? '')
    setInstagramFollowers(biz.instagram_followers ? String(biz.instagram_followers) : '')
    setType(biz.type              ?? 'perfume')
    setLogoUrl(biz.logo_url       ?? null)
    setLogoPreview(biz.logo_url   ?? null)
    setBannerImages(biz.banner_images    ?? [])
    setBadges(biz.badges          ?? [])
    setThemeColor(biz.theme_color ?? '#b5860d')
    setThemeBg(biz.theme_bg       ?? 'gradient')
    setQuestions(biz.pref_questions      ?? [])
    setShippingType(biz.shipping_type    ?? 'free')
    setShippingRate(biz.shipping_rate    ?? 0)
    setShippingFreeAbove(biz.shipping_free_above ?? 0)
    if (biz.shipping_rate && !SHIPPING_PRESETS.includes(biz.shipping_rate)) {
      setCustomRate(String(biz.shipping_rate / 100))
    }
    setLoading(false)
  }, [supabase, router])

  useEffect(() => { fetchBusiness() }, [fetchBusiness])

  // ── Logo upload ────────────────────────────────────────
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Logo must be under 5MB.'); return }

    setLogoPreview(URL.createObjectURL(file))
    setUploading(true)
    setError(null)

    const fileName = `${business?.id}-logo-${Date.now()}`
    const { data, error: uploadError } = await supabase.storage
      .from('business-logos')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      setError('Logo upload failed.')
      setLogoPreview(logoUrl)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('business-logos')
      .getPublicUrl(data.path)

    setLogoUrl(publicUrl)
    setUploading(false)
  }

  // ── Banner upload ──────────────────────────────────────
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files     = Array.from(e.target.files ?? [])
    const remaining = 3 - bannerImages.length
    const toUpload  = files.slice(0, remaining)

    if (!toUpload.length) { setError('Maximum 3 banner images allowed.'); return }

    setUploadingBanner(true)
    setError(null)

    const newUrls: string[] = []

    for (const file of toUpload) {
      if (!file.type.startsWith('image/')) continue
      if (file.size > 10 * 1024 * 1024) { setError('Each banner must be under 10MB.'); continue }

      const fileName = `${business?.id}-banner-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const { data, error: uploadError } = await supabase.storage
        .from('banner-images')
        .upload(fileName, file, { upsert: true })

      if (uploadError) { setError(`Banner upload failed: ${uploadError.message}`); continue }

      const { data: { publicUrl } } = supabase.storage
        .from('banner-images')
        .getPublicUrl(data.path)

      newUrls.push(publicUrl)
    }

    setBannerImages((prev) => [...prev, ...newUrls].slice(0, 3))
    setUploadingBanner(false)
    if (bannerRef.current) bannerRef.current.value = ''
  }

  // ── Badge helpers ──────────────────────────────────────
  const toggleBadge = (badge: string) => {
    setBadges((prev) =>
      prev.includes(badge)
        ? prev.filter((b) => b !== badge)
        : prev.length < 5 ? [...prev, badge] : prev
    )
  }

  const addCustomBadge = () => {
    const b = customBadge.trim()
    if (b && !badges.includes(b) && badges.length < 5) setBadges((prev) => [...prev, b])
    setCustomBadge('')
  }

  // ── Save ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!business) return
    if (!name.trim()) { setError('Business name is required.'); return }

    // Validate shipping
    let finalRate = shippingRate
    if (shippingType === 'flat' || shippingType === 'free_above') {
      if (customRate) {
        const parsed = Math.round(parseFloat(customRate) * 100)
        if (isNaN(parsed) || parsed <= 0) {
          setError('Please enter a valid shipping rate.')
          return
        }
        finalRate = parsed
      }
    }

    setSaving(true)
    setError(null)
    setSaved(false)

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        name:                name.trim(),
        bio:                 bio.trim()      || null,
        about_us:            aboutUs.trim()  || null,
        address:             address.trim()  || null,
        whatsapp:            whatsapp.trim() || null,
        email:               email.trim()    || null,
        upi_id:              upiId.trim()    || null,
        city:                city.trim()     || null,
        instagram_handle:    instagramHandle.trim().replace('@', '') || null,
        instagram_followers: instagramFollowers ? parseInt(instagramFollowers) : 0,
        is_verified:         !!instagramHandle.trim(),
        type,
        logo_url:            logoUrl,
        banner_images:       bannerImages,
        badges,
        theme_color:         themeColor,
        theme_bg:            themeBg,
        pref_questions:      questions,
        shipping_type:       shippingType,
        shipping_rate:       finalRate,
        shipping_free_above: shippingFreeAbove,
      })
      .eq('id', business.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
    fetchBusiness()
    setTimeout(() => setSaved(false), 3000)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const getHeaderStyle = () => {
    if (themeBg === 'solid') return { background: themeColor }
    if (themeBg === 'dark')  return { background: '#1a1a2e' }
    if (themeBg === 'soft')  return { background: `${themeColor}22` }
    return { background: `linear-gradient(160deg, ${themeColor}ee, ${themeColor}99)` }
  }

  // ── Shipping rate label ────────────────────────────────
  const shippingLabel = () => {
    if (shippingType === 'free') return '🚚 Free shipping on all orders'
    const rate = shippingRate / 100
    if (shippingType === 'flat') return `🚚 Flat ₹${rate} shipping on all orders`
    return `🚚 Free above ₹${shippingFreeAbove / 100}, otherwise ₹${rate}`
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fdf6ef] dark:bg-gray-950
        flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">⚙️</div>
          <p className="text-sm text-gray-500">Loading settings...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fdf6ef] dark:bg-gray-950 pb-12">
      <div className="max-w-2xl mx-auto px-4 pt-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">⚙️ Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Customise your store</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600
            text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
        )}
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-600
            text-sm rounded-xl px-4 py-3 mb-4">✅ Settings saved!</div>
        )}

        <div className="space-y-4">

          {/* Store Info */}
          <Section title="🏪 Store Information">
            <div className="bg-[#fdf6ef] dark:bg-gray-800 rounded-xl px-4 py-3
              flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400">Your store link</p>
                <p className="text-sm font-bold text-[#b5860d]">ordrx.in/{business?.slug}</p>
              </div>
              <Button variant="secondary" size="sm" type="button"
                onClick={() => navigator.clipboard.writeText(
                  `${window.location.origin}/${business?.slug}`
                )}>Copy 📋</Button>
            </div>

            {/* Logo */}
            <div>
              <label className={labelCls}>Store Logo</label>
              <div className="flex items-center gap-4">
                <div onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 rounded-2xl overflow-hidden cursor-pointer
                    border-2 border-dashed border-[#f0e8de] dark:border-gray-700
                    hover:border-[#b5860d] transition-colors flex-shrink-0
                    flex items-center justify-center"
                  style={{ background: logoPreview ? 'transparent' : '#fdf6ef' }}>
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-3xl">{BUSINESS_TYPE_CONFIG[type].emoji}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <Button variant="secondary" size="sm" type="button"
                    loading={uploading} onClick={() => fileRef.current?.click()}>
                    {logoPreview ? '🔄 Change' : '📸 Upload Logo'}
                  </Button>
                  <p className="text-xs text-gray-400">JPG, PNG · Max 5MB</p>
                  {logoPreview && (
                    <button type="button"
                      onClick={() => { setLogoUrl(null); setLogoPreview(null) }}
                      className="text-xs text-red-400">Remove</button>
                  )}
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*"
                onChange={handleLogoChange} className="hidden" />
            </div>

            <div>
              <label className={labelCls}>Business Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Madhu the Mehak" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Tagline / Bio</label>
              <input type="text" value={bio} onChange={(e) => setBio(e.target.value)}
                placeholder="Short tagline shown under your name" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Business Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(BUSINESS_TYPE_CONFIG) as BusinessType[]).map((t) => {
                  const cfg = BUSINESS_TYPE_CONFIG[t]
                  return (
                    <button key={t} type="button" onClick={() => setType(t)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-xl',
                        'border-2 transition-all text-xs font-semibold',
                        type === t
                          ? 'border-[#b5860d] bg-[#fdf6ef] dark:bg-gray-800 text-[#b5860d]'
                          : 'border-gray-100 dark:border-gray-700 text-gray-500',
                      )}>
                      <span className="text-xl">{cfg.emoji}</span>
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </Section>

          {/* Banners */}
          <Section title="🖼️ Banner Images">
            <p className="text-xs text-gray-500 -mt-2">
              Up to 3 images · auto-slide · full width · no cropping
            </p>
            {bannerImages.length > 0 && (
              <div className="space-y-3">
                {bannerImages.map((url, index) => (
                  <div key={url} className="relative rounded-xl overflow-hidden
                    border border-gray-100 dark:border-gray-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Banner ${index + 1}`}
                      className="w-full object-contain max-h-40 bg-gray-50 dark:bg-gray-800" />
                    <div className="absolute top-2 left-2 bg-black/50 text-white
                      text-xs px-2 py-0.5 rounded-full">Banner {index + 1}</div>
                    <button type="button"
                      onClick={() => setBannerImages((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute top-2 right-2 bg-red-500 text-white
                        w-7 h-7 rounded-full flex items-center justify-center
                        text-sm font-bold hover:bg-red-600">✕</button>
                  </div>
                ))}
              </div>
            )}
            {bannerImages.length < 3 && (
              <div onClick={() => bannerRef.current?.click()}
                className="w-full h-28 rounded-xl border-2 border-dashed
                  border-[#f0e8de] dark:border-gray-700 cursor-pointer
                  hover:border-[#b5860d] transition-colors
                  flex flex-col items-center justify-center gap-2">
                {uploadingBanner ? (
                  <p className="text-sm text-gray-400 animate-pulse">Uploading...</p>
                ) : (
                  <>
                    <span className="text-2xl">🖼️</span>
                    <p className="text-sm font-semibold text-gray-500">
                      Add banner ({bannerImages.length}/3)
                    </p>
                    <p className="text-xs text-gray-400">Max 10MB each</p>
                  </>
                )}
              </div>
            )}
            <input ref={bannerRef} type="file" accept="image/*" multiple
              onChange={handleBannerUpload} className="hidden" />
          </Section>

          {/* Theme */}
          <Section title="🎨 Store Theme">
            <div>
              <label className={labelCls}>Preview</label>
              <div className="rounded-2xl overflow-hidden h-16 relative"
                style={getHeaderStyle()}>
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  <p className="text-sm font-bold text-white">{name || 'Your Store'}</p>
                  <p className="text-xs text-white/60">@{business?.slug}</p>
                </div>
              </div>
            </div>
            <div>
              <label className={labelCls}>Brand Color</label>
              <div className="flex flex-wrap gap-2">
                {THEME_COLORS.map((c) => (
                  <button key={c.value} type="button" onClick={() => setThemeColor(c.value)}
                    title={c.name}
                    className={cn(
                      'w-9 h-9 rounded-full transition-all',
                      themeColor === c.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105',
                    )}
                    style={{ background: c.value }} />
                ))}
                <input type="color" value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-9 h-9 rounded-full cursor-pointer border-2 border-gray-200"
                  title="Custom color" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Header Style</label>
              <div className="grid grid-cols-4 gap-2">
                {BG_OPTIONS.map((bg) => (
                  <button key={bg.value} type="button" onClick={() => setThemeBg(bg.value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all',
                      themeBg === bg.value ? 'border-[#b5860d]' : 'border-gray-100 dark:border-gray-700',
                    )}>
                    <div className="w-full h-8 rounded-lg"
                      style={
                        bg.value === 'gradient'
                          ? { background: `linear-gradient(135deg, ${themeColor}ee, ${themeColor}77)` }
                          : bg.value === 'solid' ? { background: themeColor }
                          : bg.value === 'dark'  ? { background: '#1a1a2e' }
                          : { background: `${themeColor}22` }
                      } />
                    <p className="text-xs font-semibold text-gray-500">{bg.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* Badges */}
          <Section title="🏷️ Store Badges">
            <p className="text-xs text-gray-500 -mt-2">Up to 5 badges on your storefront</p>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {badges.map((b) => (
                  <span key={b} className="flex items-center gap-1.5 text-xs font-semibold
                    px-3 py-1.5 rounded-full"
                    style={{ background: `${themeColor}20`, color: themeColor }}>
                    {b}
                    <button type="button" onClick={() => toggleBadge(b)}
                      className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {BADGE_SUGGESTIONS.map((b) => (
                <button key={b} type="button" onClick={() => toggleBadge(b)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full border transition-colors',
                    badges.includes(b) ? 'text-white border-transparent' : 'border-gray-200 dark:border-gray-700 text-gray-500',
                    badges.length >= 5 && !badges.includes(b) && 'opacity-40 cursor-not-allowed',
                  )}
                  style={badges.includes(b) ? { background: themeColor } : {}}>
                  {b}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={customBadge}
                onChange={(e) => setCustomBadge(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomBadge()}
                placeholder="Add custom badge..." disabled={badges.length >= 5}
                className={cn(inputCls, 'flex-1')} />
              <Button variant="secondary" size="md" type="button"
                onClick={addCustomBadge} disabled={badges.length >= 5}>Add</Button>
            </div>
          </Section>

          {/* ── SHIPPING ── */}
          <Section title="🚚 Shipping Settings">
            <p className="text-xs text-gray-500 -mt-2">
              Shown to customers at checkout before they pay
            </p>

            {/* Current shipping label */}
            <div className="bg-[#fdf6ef] dark:bg-gray-800 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-[#b5860d]">{shippingLabel()}</p>
            </div>

            {/* Shipping type selector */}
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'free',       label: '🆓 Free',      desc: 'Always free' },
                { value: 'flat',       label: '📦 Flat Rate', desc: 'Fixed charge' },
                { value: 'free_above', label: '🎯 Free Above', desc: 'Free if order > amount' },
              ] as { value: ShippingType; label: string; desc: string }[]).map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => setShippingType(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-xl',
                    'border-2 transition-all text-center',
                    shippingType === opt.value
                      ? 'border-[#b5860d] bg-[#fdf6ef] dark:bg-gray-800'
                      : 'border-gray-100 dark:border-gray-700',
                  )}>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {opt.label}
                  </span>
                  <span className="text-xs text-gray-400">{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Rate input for flat and free_above */}
            {(shippingType === 'flat' || shippingType === 'free_above') && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>
                    {shippingType === 'flat' ? 'Shipping Rate' : 'Shipping Rate (when not free)'}
                  </label>

                  {/* Preset buttons */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {SHIPPING_PRESETS.map((preset) => (
                      <button key={preset} type="button"
                        onClick={() => {
                          setShippingRate(preset * 100)
                          setCustomRate('')
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-colors',
                          shippingRate === preset * 100 && !customRate
                            ? 'border-[#b5860d] bg-[#fdf6ef] text-[#b5860d]'
                            : 'border-gray-200 text-gray-500',
                        )}>
                        ₹{preset}
                      </button>
                    ))}
                  </div>

                  {/* Custom rate */}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2
                      text-sm text-gray-400 font-semibold">₹</span>
                    <input type="number" value={customRate}
                      onChange={(e) => {
                        setCustomRate(e.target.value)
                        setShippingRate(0)
                      }}
                      placeholder="Custom rate"
                      min="0"
                      className={cn(inputCls, 'pl-8')} />
                  </div>
                </div>

                {/* Free above threshold */}
                {shippingType === 'free_above' && (
                  <div>
                    <label className={labelCls}>Free shipping above (₹)</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {[300, 500, 750, 1000, 1500, 2000].map((amt) => (
                        <button key={amt} type="button"
                          onClick={() => setShippingFreeAbove(amt * 100)}
                          className={cn(
                            'px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-colors',
                            shippingFreeAbove === amt * 100
                              ? 'border-[#b5860d] bg-[#fdf6ef] text-[#b5860d]'
                              : 'border-gray-200 text-gray-500',
                          )}>
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* About Us */}
          <Section title="📖 About Us">
            <p className="text-xs text-gray-500 -mt-2">
              Tell your story — shown as a section on your storefront
            </p>
            <textarea value={aboutUs} onChange={(e) => setAboutUs(e.target.value)}
              placeholder="Tell customers about your business, your story..."
              rows={5} className={inputCls + ' resize-none'} />
            <p className="text-xs text-gray-400">{aboutUs.length}/500 characters</p>
          </Section>

          {/* Preference Questions */}
          <Section title="🧠 Preference Questions">
            <p className="text-xs text-gray-500 -mt-2">
              No questions = no quiz button on storefront
            </p>
            {questions.length === 0 && (
              <button type="button"
                onClick={() => setQuestions(DEFAULT_QUESTIONS[type] ?? [])}
                className="w-full py-3 rounded-xl border-2 border-dashed
                  border-[#f0e8de] dark:border-gray-700 text-sm font-semibold
                  text-gray-500 hover:border-[#b5860d] hover:text-[#b5860d]
                  transition-colors">
                ✨ Load suggested questions for {BUSINESS_TYPE_CONFIG[type].label}
              </button>
            )}
            <div className="space-y-3">
              {questions.map((q, i) => (
                <QuestionEditor key={q.id} question={q} index={i} color={themeColor}
                  onUpdate={(updated) => setQuestions((prev) => prev.map((item, idx) => idx === i ? updated : item))}
                  onDelete={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))} />
              ))}
            </div>
            {questions.length < 5 && (
              <button type="button"
                onClick={() => setQuestions((prev) => [...prev, { id: `q_${Date.now()}`, question: '', options: [] }])}
                className="w-full py-3 rounded-xl border-2 border-dashed
                  border-[#f0e8de] dark:border-gray-700 text-sm font-semibold
                  text-gray-500 hover:border-[#b5860d] hover:text-[#b5860d] transition-colors">
                + Add Question ({questions.length}/5)
              </button>
            )}
            {questions.length > 0 && (
              <button type="button" onClick={() => setQuestions([])}
                className="text-xs text-red-400 hover:text-red-500">Clear all</button>
            )}
          </Section>

          {/* Contact & Payment */}
          <Section title="📱 Contact & Payment">
            <div>
              <label className={labelCls}>WhatsApp Number</label>
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+91 98765 43210" className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">Include country code</p>
            </div>
            <div>
              <label className={labelCls}>UPI ID</label>
              <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@paytm or 9876543210@ybl" className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">
                Customers pay you directly on this UPI ID
              </p>
            </div>
            <div>
              <label className={labelCls}>Email (optional)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mumbai, Chennai, Delhi" className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">
                Shown on your store card in Explore page
              </p>
            </div>
            <div>
              <label className={labelCls}>Instagram Handle</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2
                  text-gray-400 text-sm">@</span>
                <input type="text" value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value.replace('@', ''))}
                  placeholder="yourinstagram" className={inputCls + ' pl-8'} />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Shown on your store card · Adds ✓ Verified badge
              </p>
            </div>
            <div>
              <label className={labelCls}>Instagram Followers (optional)</label>
              <input type="number" value={instagramFollowers}
                onChange={(e) => setInstagramFollowers(e.target.value)}
                placeholder="e.g. 5000" className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">
                Displayed on your store card to build trust
              </p>
            </div>
            <div>
              <label className={labelCls}>Business Address (optional)</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="Shown in your store footer"
                rows={2} className={inputCls + ' resize-none'} />
            </div>
          </Section>

          {/* Store link */}
          <Section title="🔗 Your Store Link">
            <div className="text-center py-2">
              <p className="text-2xl font-bold mb-2" style={{ color: themeColor }}>
                ordrx.in/{business?.slug}
              </p>
              <div className="flex gap-2">
                <Button variant="primary" size="lg" type="button" className="flex-1"
                  onClick={() => navigator.clipboard.writeText(
                    `${window.location.origin}/${business?.slug}`
                  )}>Copy Link 📋</Button>
                <Button variant="secondary" size="lg" type="button" className="flex-1"
                  onClick={() => window.open(
                    `${window.location.origin}/${business?.slug}`, '_blank'
                  )}>Preview 👁️</Button>
              </div>
            </div>
          </Section>

          <Button variant="primary" size="lg" type="button"
            onClick={handleSave}
            loading={saving || uploading || uploadingBanner}
            className="w-full">
            💾 Save Changes
          </Button>

          <Section title="⚠️ Account">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sign out</p>
                <p className="text-xs text-gray-400 mt-0.5">Sign out of OrdrX</p>
              </div>
              <Button variant="danger" size="sm" type="button" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </Section>

        </div>
      </div>
    </main>
  )
}