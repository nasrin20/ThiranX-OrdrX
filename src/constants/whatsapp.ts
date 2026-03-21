// OrdrX — WhatsApp Invoice Templates
// Pre-filled messages for sellers to send to customers

import { BusinessType } from '@/types'

// ── Types ──────────────────────────────────────────────────
interface InvoiceData {
  orderRef:      string
  customerName:  string
  customerPhone: string
  productName:   string
  variant:       string | null
  quantity:      number
  amount:        number
  businessName:  string
  businessType:  BusinessType
  whatsapp:      string | null
  notes:         string | null
}

// ── Format price ───────────────────────────────────────────
const fmt = (paise: number) =>
  `₹${(paise / 100).toLocaleString('en-IN')}`

// ── Business type greetings ────────────────────────────────
const GREETINGS: Record<BusinessType, string> = {
  perfume:  '🌸 Thank you for your fragrance order!',
  clothing: '👗 Thank you for shopping with us!',
  bakery:   '🎂 Thank you for your sweet order!',
  jewellery:'💍 Thank you for your jewellery order!',
  food:     '🍱 Thank you for your food order!',
  candles:  '🕯️ Thank you for your candle order!',
  salon:    '💆 Thank you for booking with us!',
  digital:  '💻 Thank you for your digital order!',
  other:    '✨ Thank you for your order!',
}

// ── Payment instructions ───────────────────────────────────
const PAYMENT_NOTE = [
  '💳 *Payment Options:*',
  '• GPay / PhonePe / Paytm',
  '• NEFT / Bank Transfer',
  '• Cash on Delivery (if available)',
].join('\n')

// ── Generate invoice message ───────────────────────────────
export function generateInvoiceMessage(data: InvoiceData): string {
  const {
    orderRef,
    customerName,
    productName,
    variant,
    quantity,
    amount,
    businessName,
    businessType,
    notes,
  } = data

  const greeting = GREETINGS[businessType] ?? GREETINGS.other
  const variantLine = variant ? `\n   Variant: ${variant}` : ''
  const notesLine = notes ? `\n📝 Note: ${notes}` : ''

  const message = [
    `${greeting}`,
    ``,
    `Hi ${customerName}! 👋`,
    `Here's your order invoice from *${businessName}*`,
    ``,
    `━━━━━━━━━━━━━━━━━━━`,
    `🧾 *ORDER INVOICE*`,
    `━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📦 *Order Details*`,
    `   Ref: ${orderRef}`,
    `   Product: ${productName}${variantLine}`,
    `   Qty: ${quantity}`,
    `   Amount: *${fmt(amount)}*`,
    `${notesLine}`,
    ``,
    PAYMENT_NOTE,
    ``,
    `📲 Send payment to this number`,
    `   and share screenshot to confirm.`,
    ``,
    `━━━━━━━━━━━━━━━━━━━`,
    `⚡ Powered by OrdrX`,
    `   ordrx.in/${businessName.toLowerCase().replace(/\s+/g, '-')}`,
  ].join('\n')

  return message
}

// ── Generate WhatsApp URL ──────────────────────────────────
export function generateWhatsAppUrl(
  phone:   string,
  message: string,
): string {
  const cleaned = phone.replace(/\D/g, '')
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${cleaned}?text=${encoded}`
}

// ── Generate reminder message ──────────────────────────────
export function generateReminderMessage(data: InvoiceData): string {
  const { orderRef, customerName, amount, businessName } = data

  return [
    `Hi ${customerName}! 👋`,
    ``,
    `This is a gentle reminder from *${businessName}*.`,
    ``,
    `Your order *${orderRef}* for *${fmt(amount)}* is pending payment.`,
    ``,
    `Please complete the payment at your earliest convenience`,
    `so we can process your order! 🙏`,
    ``,
    `Reply to this message if you have any questions.`,
    ``,
    `⚡ OrdrX`,
  ].join('\n')
}

// ── Generate shipped message ───────────────────────────────
export function generateShippedMessage(data: InvoiceData): string {
  const { orderRef, customerName, productName, businessName } = data

  return [
    `Hi ${customerName}! 🎉`,
    ``,
    `Great news! Your order from *${businessName}* has been shipped!`,
    ``,
    `📦 *${productName}*`,
    `🔖 Order Ref: ${orderRef}`,
    ``,
    `You will receive it soon.`,
    `Thank you for shopping with us! 🙏`,
    ``,
    `⚡ OrdrX`,
  ].join('\n')
}