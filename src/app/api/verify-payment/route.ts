// OrdrX — Razorpay Verify Payment API
// Verifies payment signature and upgrades plan

import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// ── Supabase admin ─────────────────────────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── POST ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      business_id,
      plan,
    } = await req.json()

    // ── Verify signature ───────────────────────────────────
    const body      = `${razorpay_order_id}|${razorpay_payment_id}`
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // ── Upgrade business plan ──────────────────────────────
    const { error: updateError } = await supabaseAdmin
      .from('businesses')
      .update({
        plan,
        // Store payment details
        payment_id:    razorpay_payment_id,
        plan_expires:  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', business_id)

    if (updateError) {
      console.error('Plan upgrade error:', updateError)
      return NextResponse.json(
        { error: 'Payment verified but plan upgrade failed. Contact support.' },
        { status: 500 }
      )
    }

    console.log(`✅ Plan upgraded: ${business_id} → ${plan}`)

    return NextResponse.json({
      success: true,
      plan,
      message: `Successfully upgraded to ${plan} plan!`,
    })

  } catch (err) {
    console.error('Verify payment error:', err)
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    )
  }
}