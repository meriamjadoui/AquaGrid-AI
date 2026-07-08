/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Modern minimalist palette
        primary: {
          50:  '#EEF2FE',
          100: '#DDE5FD',
          200: '#BBC9FB',
          300: '#93A8F8',
          400: '#6B8EF5',
          500: '#4F7DF3',
          600: '#3B6DE8',
          700: '#2D5CD6',
          800: '#1E4ABB',
          900: '#163A9A',
        },
        // Semantic surface tokens
        surface: {
          bg:      'var(--color-surface-bg)',
          card:    'var(--color-surface-card)',
          border:  'var(--color-surface-border)',
          hover:   'var(--color-surface-hover)',
          offset:  'var(--color-surface-offset)',
        },
        // Data colors
        water:   '#56A7F5',
        solar:   '#F59E0B',
        battery: '#10B981',
        pump:    '#8B5CF6',
        danger:  '#EF4444',
        warn:    '#F97316',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      textColor: {
        DEFAULT:  'var(--color-text)',
        muted:    'var(--color-text-muted)',
        faint:    'var(--color-text-faint)',
        inverse:  'var(--color-text-inverse)',
      },
      borderRadius: {
        'sm-custom': '10px',
        'md-custom': '16px',
        'lg-custom': '20px',
        'xl-custom': '24px',
      },
      boxShadow: {
        'card':    '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
        'card-lg': '0 10px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        'soft':    '0 2px 12px rgba(0,0,0,0.04)',
        'glow':    '0 0 30px rgba(79,125,243,0.15)',
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':   'spin 8s linear infinite',
        'fade-in':     'fadeIn 0.5s ease-out forwards',
        'slide-up':    'slideUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
        'scale-in':    'scaleIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards',
        'float':       'float 3s ease-in-out infinite',
        'shimmer':     'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 },                                      to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(16px)' },       to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn:  { from: { opacity: 0, transform: 'scale(0.95)' },            to: { opacity: 1, transform: 'scale(1)' } },
        float:    { '0%,100%': { transform: 'translateY(0)' },                 '50%': { transform: 'translateY(-6px)' } },
      },
    },
  },
  plugins: [],
}
