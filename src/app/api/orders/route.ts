// OrdrX — Secure Orders API Route
// Handles cart items, shipping calculation, delivery address

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendNewOrderEmail } from '@/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface CartItemRequest {
  product_id: string
  variant:    string | null
  quantity:   number
  price:      number
}

interface OrderRequest {
  business_id:      string
  customer_name:    string
  customer_phone:   string
  delivery_address: string | null
  items:            CartItemRequest[]
  subtotal:         number
  shipping_amount:  number
  total_amount:     number
  notes:            string | null
}

const generateRef = (): string =>
  'ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase()

export async function POST(req: NextRequest) {
  try {
    const body: OrderRequest = await req.json()

    const {
      business_id,
      customer_name,
      customer_phone,
      delivery_address,
      items,
      subtotal,
      shipping_amount,
      total_amount,
      notes,
    } = body

    if (!business_id || !customer_name || !customer_phone || !items?.length) {
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
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // ── Get seller email ───────────────────────────────────
    let sellerEmail: string | null = business.email ?? null
    if (!sellerEmail && business.user_id) {
      const { data: { user } } = await supabaseAdmin
        .auth.admin.getUserById(business.user_id)
      sellerEmail = user?.email ?? null
    }

    // ── Verify products + stock ────────────────────────────
    const productIds = items.map((i) => i.product_id)
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, stock, active, price')
      .in('id', productIds)
      .eq('active', true)

    if (!products || products.length !== items.length) {
      return NextResponse.json(
        { error: 'One or more products not found' },
        { status: 404 }
      )
    }

    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id)
      if (!product || product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Not enough stock for ${product?.name ?? 'product'}` },
          { status: 400 }
        )
      }
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
    const ref       = generateRef()
    const firstItem = items[0]

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        business_id,
        customer_id:      customer.id,
        order_ref:        ref,
        product_id:       firstItem.product_id,
        variant:          firstItem.variant || null,
        quantity:         items.reduce((s, i) => s + i.quantity, 0),
        amount:           subtotal,
        shipping_amount:  shipping_amount,
        delivery_address: delivery_address?.trim() || null,
        status:           'pending',
        notes:            notes?.trim() || null,
      })
      .select()
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // ── Save order items ───────────────────────────────────
    await supabaseAdmin
      .from('order_items')
      .insert(items.map((item) => ({
        order_id:   order.id,
        product_id: item.product_id,
        variant:    item.variant || null,
        quantity:   item.quantity,
        price:      item.price,
      })))

    // ── Reduce stock ───────────────────────────────────────
    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id)
      if (product) {
        await supabaseAdmin
          .from('products')
          .update({ stock: product.stock - item.quantity })
          .eq('id', item.product_id)
      }
    }

    // ── Send email to seller ───────────────────────────────
    if (sellerEmail) {
      const itemSummary = items
        .map((item) => {
          const p = products.find((pr) => pr.id === item.product_id)
          return `${p?.name ?? 'Product'}${item.variant ? ` (${item.variant})` : ''} ×${item.quantity}`
        })
        .join(', ')

      sendNewOrderEmail({
        sellerEmail,
        sellerName:    business.name,
        sellerSlug:    business.slug,
        customerName:  customer_name.trim(),
        customerPhone: customer_phone.trim(),
        productName:   itemSummary,
        variant:       null,
        quantity:      items.reduce((s, i) => s + i.quantity, 0),
        amount:        total_amount,
        orderRef:      ref,
        notes:         notes?.trim() || null,
      }).catch(console.error)
    }

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