// OrdrX — Custom Password Reset API
// Bypasses Supabase SMTP — uses Resend directly

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // ── Generate reset link via Supabase Admin ─────────────
    const { data, error } = await supabaseAdmin.auth.admin
      .generateLink({
        type:       'recovery',
        email:      email.trim(),
        options: {
          redirectTo: 'https://ordrx.in/reset-password',
        },
      })

    if (error || !data) {
      console.error('Generate link error:', error)
      // Don't reveal if email exists or not
      return NextResponse.json({ success: true })
    }

    const resetLink = data.properties?.action_link

    if (!resetLink) {
      return NextResponse.json({ success: true })
    }

    // ── Send email via Resend ──────────────────────────────
    await resend.emails.send({
      from:    'OrdrX <noreply@ordrx.in>',
      to:      email.trim(),
      subject: '🔐 Reset your OrdrX password',
      html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9f5f0;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:24px 16px;">

    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="color:#b5860d;font-size:24px;margin:0;">⚡ OrdrX</h1>
      <p style="color:#9ca3af;font-size:13px;margin:4px 0 0;">by ThiranX</p>
    </div>

    <div style="background:#ffffff;border-radius:16px;padding:24px;
      border:1px solid #f0e8de;">

      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:40px;margin-bottom:8px;">🔐</div>
        <h2 style="color:#1a1a2e;font-size:20px;margin:0;">
          Reset your password
        </h2>
        <p style="color:#6b7280;font-size:14px;margin:8px 0 0;">
          Click the button below to set a new password.
          This link expires in 1 hour.
        </p>
      </div>

      <hr style="border:none;border-top:1px solid #f0e8de;margin:20px 0;">

      <div style="text-align:center;">
        <a href="${resetLink}"
          style="display:inline-block;background:#b5860d;color:#ffffff;
          text-decoration:none;padding:14px 32px;border-radius:12px;
          font-size:15px;font-weight:bold;">
          Reset Password →
        </a>
      </div>

      <hr style="border:none;border-top:1px solid #f0e8de;margin:20px 0;">

      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
        If you didn't request this, you can safely ignore this email.
        Your password won't change.
      </p>

    </div>

    <div style="text-align:center;margin-top:20px;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        ⚡ OrdrX · Your orders. Sorted.
      </p>
    </div>

  </div>
</body>
</html>
      `,
    })

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json({ success: true }) // Always return success for security
  }
}