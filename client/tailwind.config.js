/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // ── Primary: Cobalt Blue (professional, modern, AI-native) ────────────
        blue: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8f',
          950: '#172554',
        },
        // ── Surfaces (light & dark aware) ────────────────────────────────────
        canvas: {
          light: '#fafaf9',   // warm off-white (light mode background)
          DEFAULT: '#0f172a', // near-black (dark mode background)
        },
        surface: {
          light: '#ffffff',   // pure white cards (light mode)
          DEFAULT: '#1e293b', // slate-800 (dark mode cards)
          hover: {
            light: '#f1f5f9',
            DEFAULT: '#334155',
          },
          elevated: {
            light: '#f8fafc',
            DEFAULT: '#0f172a',
          },
        },
        // ── Semantic accents ──────────────────────────────────────────────────
        accent: {
          DEFAULT: '#2563eb',
          hover:   '#1d4ed8',
          muted:   '#dbeafe',
        },
      },
      // CSS variable-based semantic tokens used in components
      backgroundColor: {
        'app': 'var(--bg)',
        'card': 'var(--surface)',
        'card-hover': 'var(--surface-hover)',
        'card-elevated': 'var(--surface-elevated)',
      },
      borderColor: {
        'default': 'var(--border)',
        'subtle': 'var(--border-subtle)',
      },
      textColor: {
        'primary': 'var(--text-primary)',
        'secondary': 'var(--text-secondary)',
        'muted': 'var(--text-muted)',
        'accent': 'var(--accent)',
      },
      animation: {
        'fade-in':     'fadeIn 0.3s ease-out',
        'slide-up':    'slideUp 0.35s ease-out',
        'slide-in':    'slideIn 0.25s ease-out',
        shimmer:       'shimmer 1.6s infinite',
        'pulse-soft':  'pulseSoft 2s ease-in-out infinite',
        'scale-in':    'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 },                          to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn:   { from: { opacity: 0, transform: 'translateX(-8px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        scaleIn:   { from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'scale(1)' } },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 1 },
          '50%':      { opacity: 0.6 },
        },
      },
      boxShadow: {
        'card':        '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        'card-md':     '0 4px 12px -2px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
        'card-hover':  '0 8px 24px -4px rgb(0 0 0 / 0.12), 0 4px 8px -2px rgb(0 0 0 / 0.08)',
        'blue-glow':   '0 0 0 3px rgb(37 99 235 / 0.15)',
        'blue-strong': '0 4px 14px 0 rgb(37 99 235 / 0.3)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
