// OrdrX Business Type configurations
// Each type defines how the storefront looks and behaves

import { BusinessType } from '@/types'

// ── Types ──────────────────────────────────────────────────
interface BusinessTypeConfig {
  label:            string
  emoji:            string
  color:            string
  description:      string
  productFields:    string[]
  preferences:      string[]
  badge:            string | null
  whatsappTemplate: string
  exampleProducts:  string[]
}

// ── Config ─────────────────────────────────────────────────
export const BUSINESS_TYPE_CONFIG: Record<
BusinessType, 
BusinessTypeConfig
> = {
  perfume: {
    label:            'Perfume & Attar',
    emoji:            '🧴',
    color:            '#b5860d',
    description:      'Sell attars, perfumes & fragrances',
    productFields:    ['name', 'price', 'photo', 'ml_size', 'alcohol_free'],
    preferences:      ['Woody', 'Floral', 'Musky', 'Fresh', 'Sweet', 'Spicy'],
    badge:            '🌿 Alcohol Free',
    whatsappTemplate: 'Your {product} ({size}) order is confirmed! 🌸',
    exampleProducts:  ['Oud Royale', 'Rose Musk', 'Amber Noir'],
  },
  clothing: {
    label:            'Clothing & Boutique',
    emoji:            '👗',
    color:            '#7c4dca',
    description:      'Sell clothing, suits & fashion',
    productFields:    ['name', 'price', 'photo', 'sizes', 'colors'],
    preferences:      ['Casual', 'Ethnic', 'Western', 'Party', 'Office', 'Bridal'],
    badge:            '✨ New Collection',
    whatsappTemplate: 'Your {product} ({size}/{color}) is confirmed! 👗',
    exampleProducts:  ['Anarkali Suit', 'Kurti Set', 'Palazzo Set'],
  },
  bakery: {
    label:            'Bakery & Sweets',
    emoji:            '🎂',
    color:            '#d4478a',
    description:      'Sell cakes, sweets & baked goods',
    productFields:    ['name', 'price', 'photo', 'flavour', 'serves'],
    preferences:      ['Chocolate', 'Vanilla', 'Fruit', 'Butterscotch', 'Custom'],
    badge:            '🏠 Homemade',
    whatsappTemplate: 'Your {product} ({flavour}) order is confirmed! 🎂',
    exampleProducts:  ['Custom Cake', 'Cookie Box', 'Brownie Tray'],
  },
  jewellery: {
    label:            'Jewellery & Accessories',
    emoji:            '💍',
    color:            '#1a8a6e',
    description:      'Sell jewellery & accessories',
    productFields:    ['name', 'price', 'photo', 'material', 'occasion'],
    preferences:      ['Gold', 'Silver', 'Oxidised', 'Kundan', 'Diamond', 'Casual'],
    badge:            '💎 Handcrafted',
    whatsappTemplate: 'Your {product} order is confirmed! 💍',
    exampleProducts:  ['Kundan Necklace', 'Oxidised Earrings', 'Bangles'],
  },
  food: {
    label:            'Home Food & Tiffin',
    emoji:            '🍱',
    color:            '#e05c2a',
    description:      'Sell home cooked food & tiffins',
    productFields:    ['name', 'price', 'photo', 'portion', 'spice_level'],
    preferences:      ['Veg', 'Non-Veg', 'Jain', 'Low Spice', 'High Spice', 'Diet'],
    badge:            '🏠 Home Cooked',
    whatsappTemplate: 'Your {product} order is confirmed! 🍱',
    exampleProducts:  ['Veg Thali', 'Biryani Box', 'Snack Hamper'],
  },
  candles: {
    label:            'Candles & Decor',
    emoji:            '🕯️',
    color:            '#b5860d',
    description:      'Sell candles, wax melts & decor',
    productFields:    ['name', 'price', 'photo', 'scent', 'burn_time'],
    preferences:      ['Floral', 'Woody', 'Fresh', 'Fruity', 'Unscented'],
    badge:            '🌿 Natural Soy Wax',
    whatsappTemplate: 'Your {product} ({scent}) order is confirmed! 🕯️',
    exampleProducts:  ['Soy Pillar Candle', 'Wax Melt Set', 'Gift Box'],
  },
  salon: {
    label:            'Salon & Beauty',
    emoji:            '💅',
    color:            '#c2185b',
    description:      'Sell beauty services & bookings',
    productFields:    ['name', 'price', 'photo', 'duration', 'available_slots'],
    preferences:      ['Hair', 'Skin', 'Nails', 'Makeup', 'Bridal', 'Massage'],
    badge:            '⭐ Professional',
    whatsappTemplate: 'Your {product} booking is confirmed! 💅',
    exampleProducts:  ['Bridal Package', 'Nail Art', 'Hair Spa'],
  },
  digital: {
    label:            'Digital Products',
    emoji:            '📚',
    color:            '#4e8ef7',
    description:      'Sell ebooks, courses & downloads',
    productFields:    ['name', 'price', 'photo', 'format', 'pages_or_duration'],
    preferences:      ['Ebook', 'Course', 'Template', 'Preset', 'Guide'],
    badge:            '⚡ Instant Download',
    whatsappTemplate: 'Your {product} is ready to download! 📚',
    exampleProducts:  ['Recipe Ebook', 'Instagram Course', 'Notion Template'],
  },
  other: {
    label:            'Other Business',
    emoji:            '✨',
    color:            '#455a64',
    description:      'Any other type of business',
    productFields:    ['name', 'price', 'photo'],
    preferences:      [],
    badge:            null,
    whatsappTemplate: 'Your {product} order is confirmed! ✨',
    exampleProducts:  ['Product 1', 'Product 2', 'Product 3'],
  },
}

// ── Helpers ────────────────────────────────────────────────

// Get all business types as a flat array (useful for UI loops)
export const BUSINESS_TYPES = Object.entries(BUSINESS_TYPE_CONFIG).map(
  ([key, value]) => ({
    type: key as BusinessType,
    ...value,
  })
)

// Get config for a single business type
export const getBusinessConfig = (
  type: BusinessType
): BusinessTypeConfig => {
  return BUSINESS_TYPE_CONFIG[type]
}