'use client'

// OrdrX — Product Form Component
// Add / Edit products with photo upload

import { useState, useEffect, useRef } from 'react'
import { Product, BusinessType } from '@/types'
import { BUSINESS_TYPE_CONFIG } from '@/constants/businessTypes'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────
interface ProductFormProps {
  businessType: BusinessType
  initial?:     Product | null
  onSave:       (data: ProductFormData) => Promise<void>
  onCancel:     () => void
}

export interface ProductFormData {
  name:        string
  description: string
  price:       number
  mrp:         number | null
  stock:       number
  emoji:       string
  tag:         string
  variants:    string[]
  active:      boolean
  photo_url:   string | null
}

// ── Constants ──────────────────────────────────────────────
const EMOJIS = [
  '🧴','👗','🎂','💍','🕯️','🍱','👘','🥻','👚',
  '🌸','🟤','⚫','🟡','🌿','✨','🎁','📦','💄',
  '👠','🧣','🍰','🧁','💎','🌺','🫙','🧪','🫧',
]

const TAGS = ['Bestseller', 'New', 'Sale', 'Premium', 'Limited', '']

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
  'block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-500 dark:text-gray-400'

// ── Component ──────────────────────────────────────────────
export function ProductForm({
  businessType,
  initial,
  onSave,
  onCancel,
}: ProductFormProps) {
  const supabase  = createClient()
  const config    = BUSINESS_TYPE_CONFIG[businessType]
  const isEdit    = !!initial
  const fileRef   = useRef<HTMLInputElement>(null)

  const [saving,        setSaving]        = useState(false)
  const [uploading,     setUploading]     = useState(false)
  const [uploadError,   setUploadError]   = useState<string | null>(null)

  // ── Form state ─────────────────────────────────────────
  const [name,         setName]         = useState('')
  const [description,  setDescription]  = useState('')
  const [priceInput,   setPriceInput]   = useState('')
  const [mrpInput,     setMrpInput]     = useState('')
  const [stock,        setStock]        = useState('10')
  const [emoji,        setEmoji]        = useState(config.emoji)
  const [tag,          setTag]          = useState('')
  const [active,       setActive]       = useState(true)
  const [variants,     setVariants]     = useState<string[]>([])
  const [variantInput, setVariantInput] = useState('')
  const [photoUrl,     setPhotoUrl]     = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // ── Populate on edit ───────────────────────────────────
  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setDescription(initial.description ?? '')
      setPriceInput(String(initial.price / 100))
      setMrpInput(initial.mrp ? String(initial.mrp / 100) : '')
      setStock(String(initial.stock))
      setEmoji(initial.emoji)
      setTag(initial.tag ?? '')
      setActive(initial.active)
      setVariants(initial.variants)
      setPhotoUrl(initial.photo_url ?? null)
      setPhotoPreview(initial.photo_url ?? null)
    }
  }, [initial])

  // ── Photo upload ───────────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5MB.')
      return
    }

    // Show preview immediately
    const preview = URL.createObjectURL(file)
    setPhotoPreview(preview)
    setUploadError(null)
    setUploading(true)

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { upsert: true })

    if (error) {
      setUploadError('Upload failed. Please try again.')
      setPhotoPreview(photoUrl) // revert preview
      setUploading(false)
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path)

    setPhotoUrl(publicUrl)
    setUploading(false)
  }

  const removePhoto = () => {
    setPhotoUrl(null)
    setPhotoPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Variant helpers ────────────────────────────────────
  const addVariant = () => {
    const v = variantInput.trim()
    if (v && !variants.includes(v)) {
      setVariants((prev) => [...prev, v])
    }
    setVariantInput('')
  }

  const removeVariant = (v: string) =>
    setVariants((prev) => prev.filter((x) => x !== v))

  // ── Submit ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim() || !priceInput || !stock) return

    setSaving(true)

    const mrpPaise = mrpInput
      ? Math.round(parseFloat(mrpInput) * 100)
      : null

    await onSave({
      name:        name.trim(),
      description: description.trim(),
      price:       Math.round(parseFloat(priceInput) * 100),
      mrp:         mrpPaise,
      stock:       parseInt(stock),
      emoji,
      tag,
      variants,
      active,
      photo_url:   photoUrl,
    })

    setSaving(false)
  }

  const isValid   = name.trim() && priceInput && stock
  const price     = parseFloat(priceInput) || 0
  const mrp       = parseFloat(mrpInput) || 0
  const discount  = mrp > price && mrp > 0
    ? Math.round((1 - price / mrp) * 100)
    : 0

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border
      border-[#f0e8de] dark:border-gray-800 p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isEdit ? '✏️ Edit Product' : '✨ Add New Product'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {config.emoji} {config.label}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close form"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
            text-xl cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="space-y-5">

        {/* ── Photo Upload ── */}
        <div>
          <label className={labelCls}>
            Product Photo
            <span className="normal-case font-normal text-gray-400 ml-1">
              (recommended)
            </span>
          </label>

          {photoPreview ? (
            // Photo preview
            <div className="relative w-full h-40 rounded-xl overflow-hidden
              border border-[#f0e8de] dark:border-gray-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Product preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={removePhoto}
                aria-label="Remove photo"
                className="absolute top-2 right-2 bg-red-500 text-white
                  w-7 h-7 rounded-full text-sm font-bold
                  flex items-center justify-center hover:bg-red-600"
              >
                ✕
              </button>
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center
                  justify-center">
                  <p className="text-white text-sm font-semibold">
                    Uploading...
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Upload area
            <div
              onClick={() => fileRef.current?.click()}
              className="w-full h-40 rounded-xl border-2 border-dashed
                border-[#f0e8de] dark:border-gray-700 cursor-pointer
                hover:border-[#b5860d] transition-colors
                flex flex-col items-center justify-center gap-2"
            >
              <span className="text-3xl">📸</span>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Click to upload photo
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                JPG, PNG, WEBP · Max 5MB
              </p>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />

          {uploadError && (
            <p className="text-red-500 text-xs mt-1">{uploadError}</p>
          )}
        </div>

        {/* ── Emoji Picker (fallback) ── */}
        <div>
          <label className={labelCls}>
            Icon{' '}
            <span className="normal-case font-normal text-gray-400">
              (shown if no photo)
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={cn(
                  'w-9 h-9 rounded-lg text-lg transition-all',
                  emoji === e
                    ? 'bg-[#fdf6ef] border-2 border-[#b5860d] scale-110'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:scale-105',
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* ── Name ── */}
        <div>
          <label className={labelCls}>Product Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Oud Royale"
            className={inputCls}
          />
        </div>

        {/* ── Description ── */}
        <div>
          <label className={labelCls}>Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description shown to customers"
            className={inputCls}
          />
        </div>

        {/* ── Price + MRP ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Selling Price ₹ *</label>
            <input
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="1200"
              min="0"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>MRP ₹ (optional)</label>
            <input
              type="number"
              value={mrpInput}
              onChange={(e) => setMrpInput(e.target.value)}
              placeholder="1500"
              min="0"
              className={inputCls}
            />
            {discount > 0 && (
              <p className="text-green-500 text-xs mt-1 font-semibold">
                🎉 {discount}% discount shown to customers
              </p>
            )}
          </div>
        </div>

        {/* ── Stock + Tag ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Stock Qty *</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="10"
              min="0"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Badge</label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className={inputCls}
            >
              {TAGS.map((t) => (
                <option key={t} value={t}>
                  {t || 'None'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Variants ── */}
        <div>
          <label className={labelCls}>
            Variants{' '}
            <span className="normal-case font-normal text-gray-400">
              (sizes, ml, colours…)
            </span>
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={variantInput}
              onChange={(e) => setVariantInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addVariant()}
              placeholder="e.g. 50ml — press Enter to add"
              className={cn(inputCls, 'flex-1')}
            />
            <Button
              variant="secondary"
              size="md"
              onClick={addVariant}
              type="button"
            >
              Add
            </Button>
          </div>

          {/* Chips */}
          {variants.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {variants.map((v) => (
                <span
                  key={v}
                  className="flex items-center gap-1 bg-[#fdf6ef] dark:bg-gray-800
                    text-[#b5860d] text-xs font-semibold px-3 py-1 rounded-full"
                >
                  {v}
                  <button
                    type="button"
                    onClick={() => removeVariant(v)}
                    className="hover:text-red-500 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Quick add from business type */}
          {config.preferences.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Quick add:</p>
              <div className="flex flex-wrap gap-1">
                {config.preferences.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      if (!variants.includes(p)) {
                        setVariants((prev) => [...prev, p])
                      }
                    }}
                    className="text-xs px-2 py-0.5 rounded-full border
                      border-gray-200 dark:border-gray-700
                      text-gray-500 dark:text-gray-400
                      hover:border-[#b5860d] hover:text-[#b5860d]
                      transition-colors"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Active Toggle ── */}
        <div className="flex items-center justify-between bg-gray-50
          dark:bg-gray-800 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Visible on storefront
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Customers can see and order this product
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActive((a) => !a)}
            aria-label="Toggle product visibility"
            className={cn(
              'relative w-10 h-5 rounded-full transition-colors cursor-pointer',
              active ? 'bg-[#b5860d]' : 'bg-gray-200 dark:bg-gray-700',
            )}
          >
            <div className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
              active ? 'translate-x-5' : 'translate-x-0.5',
            )} />
          </button>
        </div>

      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3 mt-6">
        <Button variant="secondary" size="lg" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSave}
          loading={saving || uploading}
          disabled={!isValid}
          className="flex-1"
        >
          {isEdit ? '💾 Save Changes' : '✨ Add Product'}
        </Button>
      </div>

    </div>
  )
}