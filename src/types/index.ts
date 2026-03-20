// OrdrX — Central Type Definitions

// ── Business Types ─────────────────────────────────────────
export type BusinessType =
  | 'perfume'
  | 'clothing'
  | 'bakery'
  | 'jewellery'
  | 'food'
  | 'candles'
  | 'salon'
  | 'digital'
  | 'other'

// ── Plan Types ─────────────────────────────────────────────
export type PlanType =
  | 'free'
  | 'starter'
  | 'growth'
  | 'pro'

// ── Order Status ───────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'cancelled'
  | 'overdue'

// ── Database Models ────────────────────────────────────────
export interface Business {
  id:          string
  user_id:     string
  name:        string
  slug:        string
  type:        BusinessType
  theme_color: string
  logo_url:    string | null
  whatsapp:    string | null
  email:       string | null
  bio:         string | null
  plan:        PlanType
  created_at:  string
}

export interface Product {
  id:          string
  business_id: string
  name:        string
  description: string | null
  price:       number
  mrp:         number | null
  stock:       number
  emoji:       string
  tag:         string | null
  variants:    string[]
  active:      boolean
  photo_url:   string | null  // ← ADD THIS LINE
  created_at:  string
}

export interface Customer {
  id:               string
  business_id:      string
  name:             string
  phone:            string | null
  email:            string | null
  instagram_handle: string | null
  notes:            string | null
  created_at:       string
}

export interface Order {
  id:            string
  business_id:   string
  customer_id:   string
  order_ref:     string
  product_id:    string
  variant:       string | null
  quantity:      number
  amount:        number
  status:        OrderStatus
  payment_id:    string | null
  whatsapp_sent: boolean
  notes:         string | null
  created_at:    string
}
// Extended order type with joined data
export interface OrderWithDetails extends Order {
  customers?: { name: string; phone: string } | null
  products?:  { name: string } | null
}