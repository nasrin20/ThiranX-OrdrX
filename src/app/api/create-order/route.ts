// OrdrX — Razorpay Create Order API
// Creates a Razorpay order for subscription payment

import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// ── Razorpay client ────────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

// ── Supabase admin ─────────────────────────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── Plan prices in paise ───────────────────────────────────
const PLAN_PRICES: Record<string, number> = {
  starter: 29900,   // ₹299
  growth:  79900,   // ₹799
  pro:     149900,  // ₹1499
}

// ── POST ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { plan, business_id } = await req.json()

    if (!plan || !business_id) {
      return NextResponse.json(
        { error: 'Missing plan or business_id' },
        { status: 400 }
      )
    }

    const amount = PLAN_PRICES[plan]
    if (!amount) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    // Verify business exists
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select('id, name, email, user_id')
      .eq('id', business_id)
      .single()

    if (bizError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Get seller email
    let sellerEmail = business.email
    if (!sellerEmail && business.user_id) {
      const { data: { user } } = await supabaseAdmin
        .auth.admin.getUserById(business.user_id)
      sellerEmail = user?.email ?? null
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt:  `ordrx_${plan}_${business_id.slice(0, 8)}`,
      notes: {
        business_id,
        plan,
        business_name: business.name,
      },
    })

    return NextResponse.json({
      success:    true,
      order_id:   order.id,
      amount,
      currency:   'INR',
      key_id:     process.env.RAZORPAY_KEY_ID,
      business_name: business.name,
      email:      sellerEmail ?? '',
      plan,
    })

  } catch (err) {
    console.error('Create order error:', err)
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    )
  }
}