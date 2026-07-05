/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // AquaGrid brand palette
        primary: {
          50:  '#f0fafa',
          100: '#d0f0f0',
          200: '#a0e0e2',
          300: '#5ec9cc',
          400: '#2fb4b8',
          500: '#01696f',
          600: '#0c4e54',
          700: '#0f3638',
          800: '#0a2628',
          900: '#061618',
        },
        // Semantic surface tokens — driven by CSS variables so they flip with theme
        surface: {
          bg:      'var(--color-surface-bg)',
          card:    'var(--color-surface-card)',
          border:  'var(--color-surface-border)',
          hover:   'var(--color-surface-hover)',
          offset:  'var(--color-surface-offset)',
        },
        water:   '#2fb4b8',
        solar:   '#f59e0b',
        battery: '#10b981',
        pump:    '#8b5cf6',
        danger:  '#ef4444',
        warn:    '#f97316',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      textColor: {
        // Semantic text tokens
        DEFAULT:  'var(--color-text)',
        muted:    'var(--color-text-muted)',
        faint:    'var(--color-text-faint)',
        inverse:  'var(--color-text-inverse)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':  'spin 8s linear infinite',
        'count-up':   'countup 1s ease-out forwards',
      },
    },
  },
  plugins: [],
}
