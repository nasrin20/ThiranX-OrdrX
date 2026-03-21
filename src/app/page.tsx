// OrdrX — Landing Page
// The public face of OrdrX at ordrx.in

import Link from 'next/link'

// ── Metadata ───────────────────────────────────────────────
export const metadata = {
  title:       'OrdrX — Your Instagram Store. Sorted.',
  description: 'Turn your Instagram DMs into a real store. Get orders, track payments, and grow your business — all in one place.',
}

// ── Page ───────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50
        border-b border-white/5 backdrop-blur-xl"
        style={{ background: 'rgba(10,10,15,0.8)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="text-lg font-bold tracking-tight">OrdrX</span>
            <span className="text-xs text-white/30 font-medium ml-1">by ThiranX</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How it works', 'Pricing'].map((item) => (
              <a key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="text-sm text-white/50 hover:text-white transition-colors">
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm text-white/60 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/signup"
              className="text-sm font-bold px-4 py-2 rounded-xl
                bg-[#b5860d] hover:bg-[#9a7209] transition-colors">
              Start Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">

        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2
          w-[600px] h-[600px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #b5860d, transparent)' }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(181,134,13,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(181,134,13,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />

        <div className="relative max-w-4xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10
            rounded-full px-4 py-1.5 text-xs text-white/60 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Now live — Used by Instagram sellers across India
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
            <span className="block text-white">Your Instagram</span>
            <span className="block" style={{
              background: 'linear-gradient(135deg, #b5860d, #f5c842, #b5860d)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Store. Sorted.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop managing orders in DMs. Give your customers a real store link,
            collect orders automatically, and grow your business — all for free.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl
                font-bold text-base transition-all
                hover:scale-105 hover:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #b5860d, #d4a017)',
                boxShadow: '0 0 40px rgba(181,134,13,0.3)',
              }}>
              Start Free — No credit card
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            
            <Link href="/signup"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl
                font-bold text-base border border-white/10
                text-white/70 hover:text-white hover:border-white/20
                transition-all">
              📖 How it works ↓
            </Link>
          </div>

          {/* Social proof */}
          <p className="text-xs text-white/30 mt-6">
            Free forever · No commission · Setup in 2 minutes
          </p>

          {/* Store URL preview */}
          <div className="mt-16 max-w-sm mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3
              flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-[#b5860d]/20 flex items-center
                justify-center text-sm flex-shrink-0">⚡</div>
              <div className="min-w-0">
                <p className="text-xs text-white/30">Your store link</p>
                <p className="text-sm font-bold text-white/80 truncate">
                  ordrx.in/<span className="text-[#b5860d]">@yourinstagram</span>
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0
                animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGOS / SOCIAL PROOF ── */}
      <section className="py-12 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs text-white/20 uppercase tracking-widest mb-8">
            Perfect for Instagram sellers
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              '🧴 Perfumes & Attars',
              '👗 Clothing Boutiques',
              '🎂 Bakeries',
              '💍 Jewellery',
              '🍱 Home Food',
              '🕯️ Candles',
              '💆 Salons',
              '💻 Digital Products',
            ].map((item) => (
              <span key={item}
                className="text-sm text-white/40 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-[#b5860d] uppercase tracking-widest mb-3 font-bold">
              How it works
            </p>
            <h2 className="text-4xl font-black text-white">
              From DMs to orders<br />in 2 minutes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step:  '01',
                icon:  '🏪',
                title: 'Create your store',
                desc:  'Sign up with your Instagram handle. Your store is instantly live at ordrx.in/@yourhandle',
              },
              {
                step:  '02',
                icon:  '🧴',
                title: 'Add your products',
                desc:  'Upload photos, set prices, add variants. Takes less than 5 minutes for your full catalogue.',
              },
              {
                step:  '03',
                icon:  '🛍️',
                title: 'Get orders!',
                desc:  'Share your link in your Instagram bio. Customers browse, order, and you get notified instantly.',
              },
            ].map((item) => (
              <div key={item.step}
                className="relative bg-white/3 border border-white/8 rounded-2xl p-6
                  hover:border-[#b5860d]/40 transition-colors group">
                <div className="text-xs font-black text-[#b5860d]/40 mb-4 font-mono">
                  {item.step}
                </div>
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                <div className="absolute top-6 right-6 w-2 h-2 rounded-full
                  bg-[#b5860d]/20 group-hover:bg-[#b5860d]/60 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 relative">
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, #b5860d 0%, transparent 60%)',
          }} />

        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-16">
            <p className="text-xs text-[#b5860d] uppercase tracking-widest mb-3 font-bold">
              Features
            </p>
            <h2 className="text-4xl font-black text-white">
              Everything you need.<br />
              <span className="text-white/30">Nothing you don&apos;t.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon:  '📸',
                title: 'Beautiful storefront',
                desc:  'Your own store link with your branding, colors, and logo. Looks like a real app.',
              },
              {
                icon:  '📦',
                title: 'Order management',
                desc:  'Track every order — pending, paid, shipped. Never lose an order again.',
              },
              {
                icon:  '💬',
                title: 'WhatsApp invoices',
                desc:  'Send professional invoices to customers with one tap. Remind overdue orders.',
              },
              {
                icon:  '🛒',
                title: 'Cart system',
                desc:  'Customers add multiple products in one order. Just like shopping online.',
              },
              {
                icon:  '📊',
                title: 'Revenue dashboard',
                desc:  'See your revenue, pending payments, and top customers at a glance.',
              },
              {
                icon:  '🔔',
                title: 'Instant notifications',
                desc:  'Get email + dashboard alerts the moment a new order comes in.',
              },
              {
                icon:  '🎨',
                title: 'Custom branding',
                desc:  'Choose your brand color, upload your logo, add custom badges.',
              },
              {
                icon:  '🌟',
                title: 'Preference picker',
                desc:  'Help customers choose the right product with a smart quiz. Coming soon.',
              },
            ].map((f) => (
              <div key={f.title}
                className="flex items-start gap-4 bg-white/3 border border-white/8
                  rounded-2xl p-5 hover:border-[#b5860d]/30 transition-colors">
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-[#b5860d] uppercase tracking-widest mb-3 font-bold">
              Pricing
            </p>
            <h2 className="text-4xl font-black text-white mb-4">
              Start free. Scale as you grow.
            </h2>
            <p className="text-white/40 text-base">
              No hidden fees. No commission on orders. Ever.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                name:     'Free',
                price:    '₹0',
                period:   'forever',
                color:    'border-white/8',
                badge:    null,
                features: ['5 products', '20 orders/mo', 'WhatsApp invoices', 'Basic analytics'],
              },
              {
                name:     'Starter',
                price:    '₹299',
                period:   '/month',
                color:    'border-white/8',
                badge:    null,
                features: ['25 products', '100 orders/mo', 'Email notifications', 'Custom badges'],
              },
              {
                name:     'Growth',
                price:    '₹799',
                period:   '/month',
                color:    'border-[#b5860d]/60',
                badge:    '⭐ Popular',
                features: ['100 products', '500 orders/mo', 'Priority support', 'Revenue reports'],
              },
              {
                name:     'Pro',
                price:    '₹1,499',
                period:   '/month',
                color:    'border-white/8',
                badge:    null,
                features: ['Unlimited products', 'Unlimited orders', 'Custom domain', 'API access'],
              },
            ].map((plan) => (
              <div key={plan.name}
                className={`relative bg-white/3 border ${plan.color} rounded-2xl p-5
                  ${plan.badge ? 'ring-1 ring-[#b5860d]/30' : ''}`}
                style={plan.badge ? { background: 'rgba(181,134,13,0.05)' } : {}}>

                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2
                    bg-[#b5860d] text-white text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}

                <h3 className="text-sm font-bold text-white/60 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  <span className="text-sm text-white/30">{plan.period}</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-white/50">
                      <span className="text-[#b5860d]">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href="/signup"
                  className={`block w-full text-center py-2.5 rounded-xl text-xs font-bold
                    transition-colors ${plan.badge
                      ? 'bg-[#b5860d] text-white hover:bg-[#9a7209]'
                      : 'border border-white/10 text-white/60 hover:text-white hover:border-white/20'
                    }`}>
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative bg-white/3 border border-[#b5860d]/20 rounded-3xl p-12
            overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at center, #b5860d, transparent 70%)',
              }} />
            <div className="relative">
              <h2 className="text-4xl font-black text-white mb-4">
                Ready to grow your<br />Instagram business?
              </h2>
              <p className="text-white/40 mb-8">
                Join hundreds of sellers already using OrdrX.
                Free forever. No credit card needed.
              </p>
              <Link href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl
                  font-bold text-base text-white transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #b5860d, #d4a017)',
                  boxShadow: '0 0 40px rgba(181,134,13,0.4)',
                }}>
                Create your free store →
              </Link>
              <p className="text-xs text-white/20 mt-4">
                Setup takes 2 minutes · No commission · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">⚡</span>
                <span className="text-lg font-bold">OrdrX</span>
              </div>
              <p className="text-sm text-white/30 max-w-xs">
                Turn your Instagram DMs into a real store.
                Built for Indian small businesses.
              </p>
              <p className="text-xs text-white/20 mt-2">by ThiranX</p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                  Product
                </p>
                <ul className="space-y-2">
                  {['Features', 'Pricing', 'How it works'].map((l) => (
                    <li key={l}>
                      <a href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                        className="text-sm text-white/30 hover:text-white transition-colors">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                  Company
                </p>
                <ul className="space-y-2">
                  {[
                    { label: 'Sign up',   href: '/signup'    },
                    { label: 'Sign in',   href: '/login'     },
                  ].map((l) => (
                    <li key={l.label}>
                      <Link href={l.href}
                        className="text-sm text-white/30 hover:text-white transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row
            justify-between items-center gap-4">
            <p className="text-xs text-white/20">
              © 2026 OrdrX by ThiranX. All rights reserved.
            </p>
            <p className="text-xs text-white/20">
              Made with ❤️ For Indian sellers
            </p>
          </div>
        </div>
      </footer>

    </main>
  )
}