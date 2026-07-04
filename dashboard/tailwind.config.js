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
          500: '#01696f',  // main teal
          600: '#0c4e54',
          700: '#0f3638',
          800: '#0a2628',
          900: '#061618',
        },
        surface: {
          bg:      '#0e1117',
          card:    '#161b22',
          border:  '#21262d',
          hover:   '#1c2128',
        },
        water: '#2fb4b8',
        solar: '#f59e0b',
        battery: '#10b981',
        pump:   '#8b5cf6',
        danger: '#ef4444',
        warn:   '#f97316',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'count-up': 'countup 1s ease-out forwards',
      },
    },
  },
  plugins: [],
}
