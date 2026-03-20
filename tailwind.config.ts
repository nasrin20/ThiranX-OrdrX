import type { Config } from 'tailwindcss'

const config: Config = {
  // Automatically follows system dark/light preference
  darkMode: 'media',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // OrdrX brand colors
      colors: {
        brand: {
          DEFAULT: '#b5860d',
          dark:    '#9a7209',
          light:   '#fdf6ef',
        },
      },
    },
  },
  plugins: [],
}

export default config