// OrdrX — Storefront Order API
// Creates Razorpay payment order for storefront checkout

import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

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

export async function POST(req: NextRequest) {
  try {
    const {
      business_id,
      customer_name,
      customer_phone,
      items,
      total_amount,
      notes,
    } = await req.json()

    if (!business_id || !customer_name || !customer_phone || !items?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get business
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('id, name, slug')
      .eq('id', business_id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount:   total_amount,
      currency: 'INR',
      receipt:  `ordrx_${business_id.slice(0, 8)}_${Date.now()}`,
      notes: {
        business_id,
        business_name: business.name,
        customer_name,
        customer_phone,
      },
    })

    return NextResponse.json({
      success:        true,
      razorpay_order_id: razorpayOrder.id,
      amount:         total_amount,
      currency:       'INR',
      key_id:         process.env.RAZORPAY_KEY_ID,
      business_name:  business.name,
    })

  } catch (err) {
    console.error('Storefront order error:', err)
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    )
  }
}