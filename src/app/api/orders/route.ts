// OrdrX — Secure Orders API Route
// Uses service role + sends email notification to seller

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendNewOrderEmail } from '@/lib/email'

// ── Service role client ────────────────────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── Types ──────────────────────────────────────────────────
interface OrderRequest {
  business_id:    string
  customer_name:  string
  customer_phone: string
  product_id:     string
  variant:        string | null
  quantity:       number
  amount:         number
  notes:          string | null
}

// ── Generate order ref ─────────────────────────────────────
const generateRef = (): string =>
  'ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase()

// ── POST ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: OrderRequest = await req.json()

    const {
      business_id,
      customer_name,
      customer_phone,
      product_id,
      variant,
      quantity,
      amount,
      notes,
    } = body

    // ── Validate ───────────────────────────────────────────
    if (!business_id || !customer_name || !customer_phone || !product_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // ── Get business ───────────────────────────────────────
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select('id, name, slug, email, whatsapp, type, active, user_id')
      .eq('id', business_id)
      .eq('active', true)
      .single()

    if (bizError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // ── Get seller email ───────────────────────────────────
    // Priority 1: email set in settings
    // Priority 2: email used to sign up
    let sellerEmail: string | null = business.email ?? null

    if (!sellerEmail && business.user_id) {
      const { data: { user } } = await supabaseAdmin
        .auth.admin.getUserById(business.user_id)
      sellerEmail = user?.email ?? null
    }

    console.log('Sending order email to:', sellerEmail)

    // ── Verify product ─────────────────────────────────────
    const { data: product, error: prodError } = await supabaseAdmin
      .from('products')
      .select('id, name, stock, active')
      .eq('id', product_id)
      .eq('active', true)
      .single()

    if (prodError || !product) {
      return NextResponse.json(
        { error: 'Product not found or unavailable' },
        { status: 404 }
      )
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: 'Not enough stock' },
        { status: 400 }
      )
    }

    // ── Upsert customer ────────────────────────────────────
    const { data: customer, error: custError } = await supabaseAdmin
      .from('customers')
      .upsert(
        {
          business_id,
          name:  customer_name.trim(),
          phone: customer_phone.trim(),
        },
        { onConflict: 'business_id,phone' }
      )
      .select()
      .single()

    if (custError || !customer) {
      return NextResponse.json(
        { error: 'Failed to save customer' },
        { status: 500 }
      )
    }

    // ── Create order ───────────────────────────────────────
    const ref = generateRef()

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        business_id,
        customer_id: customer.id,
        order_ref:   ref,
        product_id,
        variant:     variant || null,
        quantity,
        amount,
        status:      'pending',
        notes:       notes?.trim() || null,
      })
      .select()
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // ── Reduce stock ───────────────────────────────────────
    await supabaseAdmin
      .from('products')
      .update({ stock: product.stock - quantity })
      .eq('id', product_id)

    // ── Send email to seller ───────────────────────────────
    if (sellerEmail) {
      sendNewOrderEmail({
        sellerEmail,
        sellerName:    business.name,
        sellerSlug:    business.slug,
        customerName:  customer_name.trim(),
        customerPhone: customer_phone.trim(),
        productName:   product.name,
        variant:       variant || null,
        quantity,
        amount,
        orderRef:      ref,
        notes:         notes?.trim() || null,
      }).catch(console.error)
    }

    // ── Return success ─────────────────────────────────────
    return NextResponse.json({
      success:   true,
      order_ref: ref,
      order_id:  order.id,
    })

  } catch (err) {
    console.error('Orders API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}