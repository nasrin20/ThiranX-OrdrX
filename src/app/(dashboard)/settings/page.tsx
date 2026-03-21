'use client'

// OrdrX — Settings Page
// Edit profile + upload logo + custom badges

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Business, BusinessType } from '@/types'
import { BUSINESS_TYPE_CONFIG } from '@/constants/businessTypes'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

// ── Shared styles ──────────────────────────────────────────
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

// ── Suggested badges ───────────────────────────────────────
const BADGE_SUGGESTIONS = [
  '🌿 Alcohol Free',
  '🐰 Cruelty Free',
  '🌱 Vegan',
  '🏠 Homemade',
  '✋ Handcrafted',
  '🚚 Free Delivery',
  '💵 COD Available',
  '⭐ Premium Quality',
  '🎁 Gift Wrapping',
  '♻️ Eco Friendly',
  '🌸 Natural',
  '💯 Authentic',
]

// ── Section wrapper ────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border
      border-[#f0e8de] dark:border-gray-800 p-5 space-y-4">
      <h2 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h2>
      {children}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────
export default function SettingsPage() {
  const supabase = createClient()
  const router   = useRouter()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [business,    setBusiness]    = useState<Business | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  // ── Form state ─────────────────────────────────────────
  const [name,        setName]        = useState('')
  const [bio,         setBio]         = useState('')
  const [whatsapp,    setWhatsapp]    = useState('')
  const [email,       setEmail]       = useState('')
  const [type,        setType]        = useState<BusinessType>('perfume')
  const [logoUrl,     setLogoUrl]     = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [badges,      setBadges]      = useState<string[]>([])
  const [customBadge, setCustomBadge] = useState('')

  // ── Fetch ──────────────────────────────────────────────
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
    setName(biz.name         ?? '')
    setBio(biz.bio           ?? '')
    setWhatsapp(biz.whatsapp ?? '')
    setEmail(biz.email       ?? '')
    setType(biz.type         ?? 'perfume')
    setLogoUrl(biz.logo_url  ?? null)
    setLogoPreview(biz.logo_url ?? null)
    setBadges(biz.badges     ?? [])
    setLoading(false)
  }, [supabase, router])

  useEffect(() => { fetchBusiness() }, [fetchBusiness])

  // ── Logo upload ────────────────────────────────────────
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image.'); return }
    if (file.size > 5 * 1024 * 1024)    { setError('Logo must be under 5MB.'); return }

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

  // ── Badge helpers ──────────────────────────────────────
  const toggleBadge = (badge: string) => {
    setBadges((prev) =>
      prev.includes(badge)
        ? prev.filter((b) => b !== badge)
        : prev.length < 5
          ? [...prev, badge]
          : prev
    )
  }

  const addCustomBadge = () => {
    const b = customBadge.trim()
    if (b && !badges.includes(b) && badges.length < 5) {
      setBadges((prev) => [...prev, b])
    }
    setCustomBadge('')
  }

  // ── Save ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!business) return
    if (!name.trim()) { setError('Business name is required.'); return }

    setSaving(true)
    setError(null)
    setSaved(false)

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        name:     name.trim(),
        bio:      bio.trim()      || null,
        whatsapp: whatsapp.trim() || null,
        email:    email.trim()    || null,
        type,
        logo_url: logoUrl,
        badges,
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fdf6ef] dark:bg-gray-950
        flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">⚙️</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading settings...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fdf6ef] dark:bg-gray-950 pb-12">
      <div className="max-w-2xl mx-auto px-4 pt-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">⚙️ Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Update your store profile</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200
            text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
        )}
        {saved && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200
            text-green-600 text-sm rounded-xl px-4 py-3 mb-4">
            ✅ Settings saved successfully!
          </div>
        )}

        <div className="space-y-4">

          {/* Store Info */}
          <Section title="🏪 Store Information">

            {/* Store link */}
            <div className="bg-[#fdf6ef] dark:bg-gray-800 rounded-xl px-4 py-3
              flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400">Your store link</p>
                <p className="text-sm font-bold text-[#b5860d]">
                  ordrx.in/{business?.slug}
                </p>
              </div>
              <Button variant="secondary" size="sm" type="button"
                onClick={() => navigator.clipboard.writeText(
                  `${window.location.origin}/${business?.slug}`
                )}>
                Copy 📋
              </Button>
            </div>

            {/* Logo */}
            <div>
              <label className={labelCls}>Store Logo</label>
              <div className="flex items-center gap-4">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 rounded-2xl overflow-hidden cursor-pointer
                    border-2 border-dashed border-[#f0e8de] dark:border-gray-700
                    hover:border-[#b5860d] transition-colors flex-shrink-0
                    flex items-center justify-center"
                  style={{ background: logoPreview ? 'transparent' : '#fdf6ef' }}
                >
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">{BUSINESS_TYPE_CONFIG[type].emoji}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <Button variant="secondary" size="sm" type="button"
                    loading={uploading}
                    onClick={() => fileRef.current?.click()}>
                    {logoPreview ? '🔄 Change Logo' : '📸 Upload Logo'}
                  </Button>
                  <p className="text-xs text-gray-400">JPG, PNG · Max 5MB</p>
                  {logoPreview && (
                    <button type="button"
                      onClick={() => { setLogoUrl(null); setLogoPreview(null) }}
                      className="text-xs text-red-400 hover:text-red-500">
                      Remove logo
                    </button>
                  )}
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*"
                onChange={handleLogoChange} className="hidden" />
            </div>

            {/* Name */}
            <div>
              <label className={labelCls}>Business Name *</label>
              <input type="text" value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Madhu the Mehak" className={inputCls} />
            </div>

            {/* Bio */}
            <div>
              <label className={labelCls}>Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                placeholder="Tell customers about your store..."
                rows={3} className={inputCls + ' resize-none'} />
              <p className="text-xs text-gray-400 mt-1">{bio.length}/150 characters</p>
            </div>

            {/* Business type */}
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

          {/* ── Badges ── */}
          <Section title="🏷️ Store Badges">
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
              Add up to 5 badges shown on your storefront. Builds customer trust!
            </p>

            {/* Selected badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {badges.map((b) => (
                  <span key={b}
                    className="flex items-center gap-1.5 bg-[#fdf6ef] dark:bg-gray-800
                      text-[#b5860d] text-xs font-semibold px-3 py-1.5 rounded-full">
                    {b}
                    <button type="button" onClick={() => toggleBadge(b)}
                      className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggestions */}
            <div>
              <p className="text-xs text-gray-400 mb-2">
                Quick add ({badges.length}/5 selected):
              </p>
              <div className="flex flex-wrap gap-2">
                {BADGE_SUGGESTIONS.map((b) => (
                  <button key={b} type="button" onClick={() => toggleBadge(b)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full border transition-colors',
                      badges.includes(b)
                        ? 'bg-[#b5860d] text-white border-[#b5860d]'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-[#b5860d] hover:text-[#b5860d]',
                      badges.length >= 5 && !badges.includes(b) && 'opacity-40 cursor-not-allowed',
                    )}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom badge */}
            <div className="flex gap-2">
              <input type="text" value={customBadge}
                onChange={(e) => setCustomBadge(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomBadge()}
                placeholder="Add custom badge..."
                disabled={badges.length >= 5}
                className={inputCls + ' flex-1'} />
              <Button variant="secondary" size="md" type="button"
                onClick={addCustomBadge}
                disabled={badges.length >= 5}>
                Add
              </Button>
            </div>
          </Section>

          {/* Contact */}
          <Section title="📱 Contact Details">
            <div>
              <label className={labelCls}>WhatsApp Number</label>
              <input type="tel" value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+91 98765 43210" className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">
                Include country code — customers message you here
              </p>
            </div>
            <div>
              <label className={labelCls}>Email (optional)</label>
              <input type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className={inputCls} />
            </div>
          </Section>

          {/* Store link */}
          <Section title="🔗 Your Store Link">
            <div className="text-center py-2">
              <p className="text-2xl font-bold text-[#b5860d] mb-2">
                ordrx.in/{business?.slug}
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Share this on your Instagram bio
              </p>
              <div className="flex gap-2">
                <Button variant="primary" size="lg" type="button" className="flex-1"
                  onClick={() => navigator.clipboard.writeText(
                    `${window.location.origin}/${business?.slug}`
                  )}>
                  Copy Link 📋
                </Button>
                <Button variant="secondary" size="lg" type="button" className="flex-1"
                  onClick={() => window.open(
                    `${window.location.origin}/${business?.slug}`, '_blank'
                  )}>
                  Preview 👁️
                </Button>
              </div>
            </div>
          </Section>

          {/* Save */}
          <Button variant="primary" size="lg" type="button"
            onClick={handleSave} loading={saving || uploading} className="w-full">
            💾 Save Changes
          </Button>

          {/* Account */}
          <Section title="⚠️ Account">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sign out</p>
                <p className="text-xs text-gray-400 mt-0.5">Sign out of your OrdrX account</p>
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