// OrdrX — Preference System
// Smart product recommendations based on customer preferences

import { BusinessType } from '@/types'

// ── Types ──────────────────────────────────────────────────
export interface PrefQuestion {
  id:       string
  question: string
  options:  string[]
}

export interface PrefAnswer {
  questionId: string
  answer:     string
}

// ── Default questions per business type ───────────────────
// Sellers can use these as starting points
export const DEFAULT_QUESTIONS: Record<BusinessType, PrefQuestion[]> = {
  perfume: [
    {
      id:       'scent',
      question: 'What scent family do you prefer?',
      options:  ['Musky', 'Fresh', 'Floral', 'Woody', 'Sweet', 'Spicy'],
    },
    {
      id:       'strength',
      question: 'How strong do you like it?',
      options:  ['Light', 'Medium', 'Strong'],
    },
    {
      id:       'occasion',
      question: 'Who is it for?',
      options:  ['Myself', 'Gift for someone', 'Both'],
    },
  ],
  clothing: [
    {
      id:       'style',
      question: 'What is your style preference?',
      options:  ['Casual', 'Ethnic', 'Western', 'Party', 'Office', 'Bridal'],
    },
    {
      id:       'color',
      question: 'What colors do you prefer?',
      options:  ['Bright & Bold', 'Pastels', 'Neutrals', 'Dark & Rich'],
    },
    {
      id:       'occasion',
      question: 'What is the occasion?',
      options:  ['Daily wear', 'Festival', 'Wedding', 'Work', 'Party'],
    },
  ],
  bakery: [
    {
      id:       'flavor',
      question: 'What flavor do you love?',
      options:  ['Chocolate', 'Vanilla', 'Fruit', 'Caramel', 'Mixed'],
    },
    {
      id:       'diet',
      question: 'Any dietary preference?',
      options:  ['Regular', 'Eggless', 'Sugar-free', 'Vegan'],
    },
    {
      id:       'occasion',
      question: 'What is the occasion?',
      options:  ['Birthday', 'Anniversary', 'Daily treat', 'Gifting'],
    },
  ],
  jewellery: [
    {
      id:       'metal',
      question: 'What metal do you prefer?',
      options:  ['Gold', 'Silver', 'Rose Gold', 'Oxidised'],
    },
    {
      id:       'style',
      question: 'What is your jewellery style?',
      options:  ['Minimal', 'Statement', 'Traditional', 'Modern'],
    },
    {
      id:       'occasion',
      question: 'What is the occasion?',
      options:  ['Daily wear', 'Wedding', 'Festival', 'Gifting'],
    },
  ],
  food: [
    {
      id:       'taste',
      question: 'What taste do you prefer?',
      options:  ['Spicy', 'Mild', 'Sweet', 'Tangy', 'Savory'],
    },
    {
      id:       'diet',
      question: 'Your diet preference?',
      options:  ['Veg', 'Non-veg', 'Vegan', 'No preference'],
    },
    {
      id:       'meal',
      question: 'What meal is this for?',
      options:  ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'],
    },
  ],
  candles: [
    {
      id:       'scent',
      question: 'What scent do you prefer?',
      options:  ['Floral', 'Woody', 'Fresh', 'Fruity', 'Unscented'],
    },
    {
      id:       'mood',
      question: 'What mood are you setting?',
      options:  ['Relaxing', 'Romantic', 'Energizing', 'Festive'],
    },
    {
      id:       'occasion',
      question: 'What is the occasion?',
      options:  ['Home decor', 'Gifting', 'Meditation', 'Special event'],
    },
  ],
  salon: [
    {
      id:       'service',
      question: 'What service are you looking for?',
      options:  ['Hair', 'Skin', 'Nails', 'Full package'],
    },
    {
      id:       'concern',
      question: 'Your main concern?',
      options:  ['Damage repair', 'Growth', 'Styling', 'Coloring', 'Glow'],
    },
    {
      id:       'budget',
      question: 'Your budget range?',
      options:  ['Basic', 'Standard', 'Premium'],
    },
  ],
  digital: [
    {
      id:       'type',
      question: 'What type of product?',
      options:  ['Template', 'Course', 'Ebook', 'Preset', 'Tool'],
    },
    {
      id:       'skill',
      question: 'Your skill level?',
      options:  ['Beginner', 'Intermediate', 'Advanced'],
    },
    {
      id:       'goal',
      question: 'Your main goal?',
      options:  ['Learn something', 'Save time', 'Make money', 'Create content'],
    },
  ],
  other: [
    {
      id:       'preference',
      question: 'What are you looking for?',
      options:  ['Best value', 'Premium quality', 'Gift idea', 'For myself'],
    },
    {
      id:       'budget',
      question: 'Your budget?',
      options:  ['Under ₹500', '₹500-₹1000', '₹1000-₹2000', '₹2000+'],
    },
  ],
}

// ── Match products to answers ──────────────────────────────
export function matchProducts<T extends { pref_tags?: string[]; variants?: string[]; name?: string }>(
  products: T[],
  answers:  PrefAnswer[],
): T[] {
  if (!answers.length) return products

  const answerValues = answers.map((a) => a.answer.toLowerCase())

  // Score each product
  const scored = products.map((product) => {
    const tags     = (product.pref_tags ?? []).map((t) => t.toLowerCase())
    const variants = (product.variants   ?? []).map((v) => v.toLowerCase())
    const combined = [...tags, ...variants]

    // Count how many answers match
    const matches = answerValues.filter((answer) =>
      combined.some((tag) => tag.includes(answer) || answer.includes(tag))
    ).length

    return { product, matches }
  })

  // Sort by match count
  const sorted = scored.sort((a, b) => b.matches - a.matches)

  // Return products with at least 1 match first, then rest
  const matched   = sorted.filter((s) => s.matches > 0).map((s) => s.product)
  const unmatched = sorted.filter((s) => s.matches === 0).map((s) => s.product)

  return [...matched, ...unmatched]
}