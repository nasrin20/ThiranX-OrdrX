// OrdrX -- Central Type Definitions

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

export type PlanType =
  | 'free'
  | 'starter'
  | 'growth'
  | 'pro'

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'cancelled'
  | 'overdue'

export interface PrefQuestion {
  id:       string
  question: string
  options:  string[]
}

export interface Business {
  id:             string
  user_id:        string
  name:           string
  slug:           string
  type:           BusinessType
  theme_color:    string
  theme_bg:       string
  logo_url:       string | null
  whatsapp:       string | null
  email:          string | null
  upi_id:         string | null
  bio:            string | null
  about_us:       string | null
  address:        string | null
  plan:           PlanType
  badges:         string[]
  active:         boolean
  pref_questions: PrefQuestion[]
  banner_images:  string[]
  created_at:     string
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
  photo_url:   string | null
  photo_url_2: string | null
  pref_tags:   string[]
  created_at:  string
}

export interface CartItem {
  product:  Product
  variant:  string
  quantity: number
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

export interface OrderItem {
  id:         string
  order_id:   string
  product_id: string
  variant:    string | null
  quantity:   number
  price:      number
  created_at: string
}

export interface OrderWithDetails extends Order {
  customers?: { name: string; phone: string } | null
  products?:  { name: string } | null
}