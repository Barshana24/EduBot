/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cozy: {
          cream:    '#F5EDDC',
          paper:    '#FBF6EA',
          paper2:   '#F3EAD6',
          forest:   '#2F4A3D',
          forestLt: '#3F6350',
          wood:     '#8B5A2B',
          lavender: '#B4A3D6',
          sky:      '#7FADC2',
          honey:    '#E0A85C',
          clay:     '#D98F72',
          sage:     '#8FAE7D',
        },
      },
      fontFamily: {
        display: ['"Fredoka"', 'system-ui', 'sans-serif'],
        sans:    ['"Nunito"', 'system-ui', 'sans-serif'],
        hand:    ['"Caveat"', 'cursive'],
        mono:    ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      animation: {
        'drift':       'drift 10s ease-in-out infinite',
        'drift-slow':  'drift 16s ease-in-out infinite',
        'sway':        'sway 4s ease-in-out infinite',
        'bob':         'bob 3s ease-in-out infinite',
        'blink':       'blink 4.5s ease-in-out infinite',
        'pop-in':      'popIn 0.45s cubic-bezier(0.34,1.56,0.64,1)',
        'sparkle':     'sparkle 2.4s ease-in-out infinite',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%':      { transform: 'translate(3%, -4%)' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%':      { transform: 'rotate(2deg)' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        blink: {
          '0%, 96%, 100%': { transform: 'scaleY(1)' },
          '98%':           { transform: 'scaleY(0.1)' },
        },
        popIn: {
          '0%':   { transform: 'scale(0.7)', opacity: 0 },
          '70%':  { transform: 'scale(1.06)', opacity: 1 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        sparkle: {
          '0%, 100%': { opacity: 0.3, transform: 'scale(0.85)' },
          '50%':      { opacity: 1, transform: 'scale(1.1)' },
        },
      },
      boxShadow: {
        cozy:    '0 10px 28px -12px rgba(139,90,43,0.28)',
        'cozy-lg': '0 18px 40px -16px rgba(139,90,43,0.32)',
        sign:    '0 6px 0 0 rgba(0,0,0,0.15), 0 10px 20px -8px rgba(0,0,0,0.3)',
      },
      borderRadius: {
        '2xl': '1.1rem',
        '3xl': '1.6rem',
        '4xl': '2.2rem',
      },
    },
  },
  plugins: [],
}
