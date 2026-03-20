'use client'

// OrdrX — Products Page
// Admin can add, edit, delete and toggle products

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Product, Business } from '@/types'
import { PLAN_LIMITS } from '@/constants/plans'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductForm, ProductFormData } from '@/components/products/ProductForm'
import { Button } from '@/components/ui/Button'

// ── Component ──────────────────────────────────────────────
export default function ProductsPage() {
  const supabase = createClient()

  const [business,  setBusiness]  = useState<Business | null>(null)
  const [products,  setProducts]  = useState<Product[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editing,   setEditing]   = useState<Product | null>(null)
  const [search,    setSearch]    = useState('')
  const [error,     setError]     = useState<string | null>(null)

  // ── Fetch business + products ──────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get business
    const { data: biz, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (bizError || !biz) {
      setError('Business not found. Please complete onboarding.')
      setLoading(false)
      return
    }

    setBusiness(biz)

    // Get products
    const { data: prods, error: prodError } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false })

    if (prodError) {
      setError('Failed to load products.')
      setLoading(false)
      return
    }

    setProducts(prods ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Plan limit check ───────────────────────────────────
  const planLimit  = PLAN_LIMITS[business?.plan ?? 'free'].products
  const limitReached = products.length >= planLimit

  // ── Add product ────────────────────────────────────────
  const handleAdd = async (data: ProductFormData) => {
    if (!business) return

    const { error } = await supabase
      .from('products')
      .insert({
        business_id: business.id,
        ...data,
      })

    if (error) {
      setError(error.message)
      return
    }

    setShowForm(false)
    fetchData()
  }

  // ── Edit product ───────────────────────────────────────
  const handleEdit = async (data: ProductFormData) => {
    if (!editing) return

    const { error } = await supabase
      .from('products')
      .update(data)
      .eq('id', editing.id)

    if (error) {
      setError(error.message)
      return
    }

    setEditing(null)
    setShowForm(false)
    fetchData()
  }

  // ── Delete product ─────────────────────────────────────
  const handleDelete = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)

    if (error) {
      setError(error.message)
      return
    }

    fetchData()
  }

  // ── Toggle active ──────────────────────────────────────
  const handleToggle = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ active: !product.active })
      .eq('id', product.id)

    if (error) {
      setError(error.message)
      return
    }

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, active: !p.active } : p
      )
    )
  }

  // ── Open edit form ─────────────────────────────────────
  const openEdit = (product: Product) => {
    setEditing(product)
    setShowForm(true)
  }

  // ── Close form ─────────────────────────────────────────
  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
  }

  // ── Filtered products ──────────────────────────────────
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  const activeCount  = products.filter((p) => p.active).length
  const outOfStock   = products.filter((p) => p.stock === 0).length

  // ── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-[#fdf6ef] dark:bg-gray-950
        flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">🧴</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading products...
          </p>
        </div>
      </main>
    )
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#fdf6ef] dark:bg-gray-950 pb-12">
      <div className="max-w-2xl mx-auto px-4 pt-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🧴 Products
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {activeCount} live · {products.length} total ·{' '}
              {planLimit === Infinity ? 'Unlimited' : `${products.length}/${planLimit}`} used
            </p>
          </div>

          {!showForm && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (limitReached) {
                  setError(`You've reached the ${products.length} product limit on your free plan. Upgrade to add more.`)
                  return
                }
                setError(null)
                setShowForm(true)
              }}
            >
              + Add Product
            </Button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200
            dark:border-red-800 text-red-600 dark:text-red-400
            text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Plan limit warning */}
        {limitReached && (
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200
            dark:border-yellow-800 text-yellow-700 dark:text-yellow-400
            text-sm rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
            <span>
              🔒 You&apos;ve reached your free plan limit ({planLimit} products).
            </span>
            <Button variant="primary" size="sm">
              Upgrade
            </Button>
          </div>
        )}

        {/* Out of stock warning */}
        {outOfStock > 0 && (
          <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200
            dark:border-orange-800 text-orange-600 dark:text-orange-400
            text-sm rounded-xl px-4 py-3 mb-4">
            ⚠️ {outOfStock} product{outOfStock > 1 ? 's are' : ' is'} out of stock
            and hidden from customers.
          </div>
        )}

        {/* Add / Edit Form */}
        {showForm && business && (
          <div className="mb-6">
            <ProductForm
              businessType={business.type}
              initial={editing}
              onSave={editing ? handleEdit : handleAdd}
              onCancel={closeForm}
            />
          </div>
        )}

        {/* Search */}
        {products.length > 3 && !showForm && (
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2
              text-gray-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm
                outline-none transition-colors
                text-gray-900 dark:text-gray-100
                bg-white dark:bg-gray-900
                placeholder-gray-400 dark:placeholder-gray-500
                border-[#f0e8de] dark:border-gray-700
                focus:border-[#b5860d]"
            />
          </div>
        )}

        {/* Product list */}
        {!showForm && (
          <>
            {filtered.length > 0 ? (
              <div className="space-y-3">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggle}
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              // Empty state
              <div
                onClick={() => setShowForm(true)}
                className="border-2 border-dashed border-[#f0e8de] dark:border-gray-700
                  rounded-2xl p-12 text-center cursor-pointer
                  hover:border-[#b5860d] transition-colors group"
              >
                <div className="text-4xl mb-3">📦</div>
                <p className="font-semibold text-gray-700 dark:text-gray-300
                  group-hover:text-[#b5860d] transition-colors">
                  Add your first product
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Click here to get started
                </p>
              </div>
            ) : (
              // No search results
              <div className="text-center py-12">
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  No products found for &quot;{search}&quot;
                </p>
              </div>
            )}
          </>
        )}

        {/* Store link */}
        {business && products.length > 0 && !showForm && (
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border
            border-[#f0e8de] dark:border-gray-800 p-4
            flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400
                uppercase tracking-wide">
                Your store link
              </p>
              <p className="text-sm font-bold text-[#b5860d] mt-0.5">
                ordrx.in/@{business.slug}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(
                    `${window.location.origin}/${business.slug}`
                )
                }}
            >
              Copy 📋
            </Button>
          </div>
        )}

      </div>
    </main>
  )
}