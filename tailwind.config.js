/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Eyebrow label — replaces the
        //   text-[10px] font-black uppercase tracking-widest text-quiz-muted
        // chain that appears across 8 files.
        eyebrow: ['10px', { lineHeight: '1', letterSpacing: '0.12em', fontWeight: '900' }],
        micro:   ['11px', { lineHeight: '1.3' }],
        mini:    ['12px', { lineHeight: '1.4' }],
      },
      colors: {
        // QuizQuest palette — referenced as bg-quiz-green, text-quiz-cyan, etc.
        quiz: {
          green:        '#4ade80',
          'green-dark': '#22c55e',
          'green-shadow':'#16a34a',
          blue:         '#38bdf8',
          'blue-dark':  '#0ea5e9',
          red:          '#fb7185',
          'red-dark':   '#f43f5e',
          yellow:       '#fbbf24',
          purple:       '#c084fc',
          orange:       '#fb923c',
          pink:         '#f472b6',
          cyan:         '#22d3ee',
          magenta:      '#e879f9',
          lime:         '#a3e635',
          bg:           '#0a0a1f',
          'bg-2':       '#14142b',
          text:         '#e9e9ff',
          muted:        '#9d9dbf',
        },

        // ── Semantic aliases (Phase 1) ───────────────────────────────
        // Naming notes:
        //   - `surface` instead of `bg` to avoid `bg-bg-card` reading awkwardly
        //   - `line`    instead of `border` to avoid `border-border-bright`
        //   - everything maps to the literal `quiz.*` palette above so the
        //     two systems stay in sync.
        surface: {
          DEFAULT: '#0a0a1f',
          soft:    '#14142b',
          card:    '#1a1a35',
          glass:   'rgba(30,30,60,0.65)',
          glassStrong: 'rgba(30,30,60,0.85)',
        },
        line: {
          DEFAULT: 'rgba(140,140,220,0.25)',
          bright:  'rgba(180,180,255,0.45)',
          soft:    'rgba(255,255,255,0.06)',
        },
        ink: {
          DEFAULT: '#e9e9ff',
          muted:   '#9d9dbf',
          soft:    '#7c7ca0',
          onAccent:'#0B1020',
        },
        accent: {
          DEFAULT: '#38bdf8',
          hover:   '#7dd3fc',
          active:  '#0ea5e9',
        },
        ok:   { DEFAULT: '#4ade80', soft: 'rgba(74,222,128,0.18)' },
        warn: { DEFAULT: '#fbbf24', soft: 'rgba(251,191,36,0.18)' },
        bad:  { DEFAULT: '#fb7185', soft: 'rgba(251,113,133,0.18)' },
      },
      borderRadius: {
        xs:   '6px',
        sm:   '10px',
        md:   '14px',
        lg:   '20px',
        xl:   '28px',
        pill: '999px',
      },
      boxShadow: {
        // Aligned with the --shadow-* CSS tokens in src/index.css.
        xs:   '0 1px 2px rgba(0, 0, 0, 0.30)',
        sm:   '0 4px 14px rgba(0, 0, 0, 0.30)',
        md:   '0 12px 32px rgba(0, 0, 0, 0.36)',
        lg:   '0 24px 60px rgba(0, 0, 0, 0.50)',
        glow: '0 0 24px rgba(56, 189, 248, 0.45), 0 0 60px rgba(56, 189, 248, 0.15)',
      },
      transitionTimingFunction: {
        // Mirrors --ease-out in index.css — the signature curve used across motion.
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
