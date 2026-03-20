// OrdrX — Public Storefront
// This is what customers see when they click the bio link
// Route: ordrx.in/@[slug]

import { createServerSupabaseClient } from '@/lib/supabase.server'
import { notFound } from 'next/navigation'
import { StorefrontClient } from './StorefrontClient'

// ── Types ──────────────────────────────────────────────────
interface PageProps {
  params: Promise<{ slug: string }>
}

// ── Page (Server Component) ────────────────────────────────
// Fetches data on the server — fast + SEO friendly
export default async function StorefrontPage({ params }: PageProps) {
  const { slug }  = await params
  const supabase  = await createServerSupabaseClient()

  // Clean slug — remove @ if present
  const cleanSlug = slug.replace(/^@/, '')

  // Fetch business
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', cleanSlug)
    .eq('active', true)
    .single()

  // 404 if not found
  if (bizError || !business) {
    notFound()
  }

  // Fetch active products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', business.id)
    .eq('active', true)
    .gt('stock', 0)
    .order('created_at', { ascending: false })

  return (
    <StorefrontClient
      business={business}
      products={products ?? []}
    />
  )
}

// ── Metadata for SEO ───────────────────────────────────────
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const cleanSlug = slug.replace(/^@/, '')

  const { data: business } = await supabase
    .from('businesses')
    .select('name, bio')
    .eq('slug', cleanSlug)
    .single()

  if (!business) {
    return { title: 'Store not found — OrdrX' }
  }

  return {
    title:       `${business.name} — OrdrX`,
    description: business.bio ?? `Shop from ${business.name} on OrdrX`,
  }
}