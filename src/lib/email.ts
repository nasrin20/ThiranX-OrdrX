// OrdrX — Email System
// Sends branded emails via Resend

import { Resend } from 'resend'

// ── Resend client ──────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY)

// ── From address ───────────────────────────────────────────
const FROM = 'OrdrX <orders@ordrx.in>'

// ── Types ──────────────────────────────────────────────────
interface OrderEmailData {
  sellerEmail:   string
  sellerName:    string
  sellerSlug:    string
  customerName:  string
  customerPhone: string
  productName:   string
  variant:       string | null
  quantity:      number
  amount:        number
  orderRef:      string
  notes:         string | null
}

// ── Format price ───────────────────────────────────────────
const fmt = (paise: number) =>
  `₹${(paise / 100).toLocaleString('en-IN')}`

// ── New Order Email (to seller) ────────────────────────────
export async function sendNewOrderEmail(data: OrderEmailData) {
  const {
    sellerEmail,
    sellerName,
    sellerSlug,
    customerName,
    customerPhone,
    productName,
    variant,
    quantity,
    amount,
    orderRef,
    notes,
  } = data

  const dashboardUrl = `https://ordrx.vercel.app/orders`
  const variantText  = variant ? ` · ${variant}` : ''
  const notesText    = notes   ? `<p style="color:#6b7280;font-size:14px;margin:8px 0 0;">Note: ${notes}</p>` : ''

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f9f5f0;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="color:#b5860d;font-size:24px;margin:0;">⚡ OrdrX</h1>
      <p style="color:#9ca3af;font-size:13px;margin:4px 0 0;">by ThiranX</p>
    </div>

    <!-- Card -->
    <div style="background:#ffffff;border-radius:16px;padding:24px;
      border:1px solid #f0e8de;">

      <!-- Title -->
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:40px;margin-bottom:8px;">🛍️</div>
        <h2 style="color:#1a1a2e;font-size:20px;margin:0;">
          New Order Received!
        </h2>
        <p style="color:#6b7280;font-size:14px;margin:8px 0 0;">
          Hi ${sellerName}, you have a new order on your store.
        </p>
      </div>

      <!-- Divider -->
      <hr style="border:none;border-top:1px solid #f0e8de;margin:20px 0;">

      <!-- Order Details -->
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#9ca3af;font-size:13px;width:40%;">
            Order Ref
          </td>
          <td style="padding:8px 0;color:#1a1a2e;font-size:13px;
            font-weight:bold;text-align:right;">
            ${orderRef}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#9ca3af;font-size:13px;
            border-top:1px solid #f9f5f0;">
            Customer
          </td>
          <td style="padding:8px 0;color:#1a1a2e;font-size:13px;
            font-weight:bold;text-align:right;border-top:1px solid #f9f5f0;">
            ${customerName}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#9ca3af;font-size:13px;
            border-top:1px solid #f9f5f0;">
            WhatsApp
          </td>
          <td style="padding:8px 0;color:#1a1a2e;font-size:13px;
            font-weight:bold;text-align:right;border-top:1px solid #f9f5f0;">
            ${customerPhone}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#9ca3af;font-size:13px;
            border-top:1px solid #f9f5f0;">
            Product
          </td>
          <td style="padding:8px 0;color:#1a1a2e;font-size:13px;
            font-weight:bold;text-align:right;border-top:1px solid #f9f5f0;">
            ${productName}${variantText} × ${quantity}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#9ca3af;font-size:13px;
            border-top:1px solid #f9f5f0;">
            Amount
          </td>
          <td style="padding:8px 0;color:#b5860d;font-size:18px;
            font-weight:bold;text-align:right;border-top:1px solid #f9f5f0;">
            ${fmt(amount)}
          </td>
        </tr>
      </table>

      ${notesText}

      <!-- Divider -->
      <hr style="border:none;border-top:1px solid #f0e8de;margin:20px 0;">

      <!-- CTA -->
      <div style="text-align:center;">
        <a href="${dashboardUrl}"
          style="display:inline-block;background:#b5860d;color:#ffffff;
          text-decoration:none;padding:12px 32px;border-radius:12px;
          font-size:14px;font-weight:bold;">
          View Order in Dashboard →
        </a>
        <p style="color:#9ca3af;font-size:12px;margin:12px 0 0;">
          Contact ${customerName} on WhatsApp: ${customerPhone}
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:20px;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        ⚡ OrdrX · Your orders. Sorted.
      </p>
      <p style="color:#9ca3af;font-size:12px;margin:4px 0 0;">
        ordrx.vercel.app/@${sellerSlug}
      </p>
    </div>

  </div>
</body>
</html>
  `

  try {
    await resend.emails.send({
      from:    FROM,
      to:      sellerEmail,
      subject: `🛍️ New order from ${customerName} — ${fmt(amount)} | OrdrX`,
      html,
    })
  } catch (err) {
    // Don't block order flow if email fails
    console.error('Email send error:', err)
  }
}

// ── Welcome Email (to new seller on signup) ────────────────
export async function sendWelcomeEmail(
  sellerEmail: string,
  sellerName:  string,
) {
  const html = `
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
        <div style="font-size:40px;margin-bottom:8px;">🎉</div>
        <h2 style="color:#1a1a2e;font-size:20px;margin:0;">
          Welcome to OrdrX!
        </h2>
        <p style="color:#6b7280;font-size:14px;margin:8px 0 0;">
          Hi ${sellerName}! Your store is ready to go.
        </p>
      </div>

      <hr style="border:none;border-top:1px solid #f0e8de;margin:20px 0;">

      <div style="space-y:12px;">
        <p style="color:#374151;font-size:14px;margin:0 0 12px;">
          Here's how to get started in 3 steps:
        </p>
        <div style="background:#fdf6ef;border-radius:12px;padding:12px;margin-bottom:8px;">
          <p style="color:#b5860d;font-size:14px;font-weight:bold;margin:0;">
            1. Add your products 🧴
          </p>
          <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">
            Add photos, prices and variants
          </p>
        </div>
        <div style="background:#fdf6ef;border-radius:12px;padding:12px;margin-bottom:8px;">
          <p style="color:#b5860d;font-size:14px;font-weight:bold;margin:0;">
            2. Copy your store link 🔗
          </p>
          <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">
            Share it on your Instagram bio
          </p>
        </div>
        <div style="background:#fdf6ef;border-radius:12px;padding:12px;">
          <p style="color:#b5860d;font-size:14px;font-weight:bold;margin:0;">
            3. Get orders! 🛍️
          </p>
          <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">
            Customers browse and order directly
          </p>
        </div>
      </div>

      <hr style="border:none;border-top:1px solid #f0e8de;margin:20px 0;">

      <div style="text-align:center;">
        <a href="https://ordrx.vercel.app/dashboard"
          style="display:inline-block;background:#b5860d;color:#ffffff;
          text-decoration:none;padding:12px 32px;border-radius:12px;
          font-size:14px;font-weight:bold;">
          Go to Dashboard →
        </a>
      </div>

    </div>

    <div style="text-align:center;margin-top:20px;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        ⚡ OrdrX · Your orders. Sorted.
      </p>
    </div>

  </div>
</body>
</html>
  `

  try {
    await resend.emails.send({
      from:    FROM,
      to:      sellerEmail,
      subject: '🎉 Welcome to OrdrX — Your store is ready!',
      html,
    })
  } catch (err) {
    console.error('Welcome email error:', err)
  }
}