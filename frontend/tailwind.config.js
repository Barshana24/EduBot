/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        card: 'var(--card)',
        ink: { DEFAULT: 'var(--ink)', soft: 'var(--ink-soft)', faint: 'var(--ink-faint)' },
        line: { DEFAULT: 'var(--line)', strong: 'var(--line-strong)' },
        brand: { DEFAULT: 'var(--brand)', dark: 'var(--brand-dark)', soft: 'var(--brand-soft)' },
        mint: { DEFAULT: 'var(--mint)', dark: 'var(--mint-dark)', soft: 'var(--mint-soft)' },
        coral: { DEFAULT: 'var(--coral)', dark: 'var(--coral-dark)', soft: 'var(--coral-soft)' },
        sun: { DEFAULT: 'var(--sun)', dark: 'var(--sun-dark)', soft: 'var(--sun-soft)' },
        sky: { DEFAULT: 'var(--sky)', dark: 'var(--sky-dark)', soft: 'var(--sky-soft)' },
      },
      fontFamily: {
        display: ['Fredoka', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--r-sm)', md: 'var(--r-md)', lg: 'var(--r-lg)', xl: 'var(--r-xl)',
      },
    },
  },
  plugins: [],
}
