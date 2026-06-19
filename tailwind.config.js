/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Body — Nunito (kept). Display heads use Baloo 2 to match the
        // reference design's rounded, friendly title treatment.
        sans:  ['Nunito', 'system-ui', 'sans-serif'],
        head:  ['"Baloo 2"', 'Nunito', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        eyebrow: ['12px', { lineHeight: '1', letterSpacing: '0.12em', fontWeight: '700' }],
        micro:   ['11px', { lineHeight: '1.3' }],
        mini:    ['12px', { lineHeight: '1.4' }],
      },
      colors: {
        // ─────────────────────────────────────────────────────────────
        // HabitGo reference palette — warm cream + punchy orange brand
        // Primary brand: #FF6A1A (redder/warmer than the previous #F97316)
        // Background:    #FBF4EC (warm cream)
        // Card surface:  #FFFFFF (pure white — diagrams blend inside)
        // Body ink:      #2B2521 (warm near-black)
        // Borders:       #F0E5D8 (very soft warm tan)
        // ─────────────────────────────────────────────────────────────
        quiz: {
          // Brand orange family — punchier red-orange than previous
          orange:        '#C9A24B',
          'orange-dark': '#A38535',
          'orange-deep': '#7D6627',
          'orange-soft': '#F4ECD8',
          'orange-bright':'#D9B45B',
          amber:         '#C9A24B',
          peach:         '#E5C896',

          // Polychrome accents (from reference) — used for rarity badges,
          // avatar rings, gem chip, success/info distinction
          gem:           '#5BB98C',   // cyan — avatar ring + crystals
          'gem-deep':    '#3F9F73',
          violet:        '#1F2A44',   // epic rarity
          rare:          '#1F2A44',   // rare rarity
          legend:        '#C9A24B',   // legendary rarity
          common:        '#5A5547',   // common rarity

          // Legacy aliases (mapped to brand orange so existing class
          // names keep working without refactoring every component)
          green:         '#5BB98C',
          'green-dark':  '#3F9F73',
          'green-shadow':'#2A7E5C',
          blue:          '#C9A24B',
          'blue-dark':   '#A38535',
          red:           '#D9534F',
          'red-dark':    '#B33732',
          yellow:        '#C9A24B',
          purple:        '#C9A24B',
          pink:          '#D9534F',
          cyan:          '#5BB98C',
          magenta:       '#C9A24B',
          lime:          '#C9A24B',

          // Surfaces — cream backdrop, white cards
          bg:            '#F4ECD8',
          'bg-2':        '#FCF7E8',
          card:          '#FFFFFF',
          text:          '#1F2A44',
          muted:         '#5A5547',
          'muted-soft':  '#A89C90',
          line:          '#E8DEC4',
          'line-soft':   '#F4ECD8',
        },

        // ── Semantic aliases — remapped to reference neutrals ───────
        surface: {
          DEFAULT: '#FFFFFF',
          soft:    '#FFF8F0',
          card:    '#FFFFFF',
          glass:   'rgba(255,255,255,0.90)',
          glassStrong: 'rgba(255,255,255,0.96)',
        },
        line: {
          DEFAULT: '#F0E5D8',
          bright:  '#E0D2C0',
          soft:    '#F6EEE3',
        },
        ink: {
          DEFAULT: '#2B2521',
          muted:   '#6E645B',
          soft:    '#A89C90',
          onAccent:'#FFFFFF',
        },
        accent: {
          DEFAULT: '#FF6A1A',
          hover:   '#FF7A2E',
          active:  '#E8530A',
        },
        ok:   { DEFAULT: '#2FBF71', soft: 'rgba(47,191,113,0.10)' },
        warn: { DEFAULT: '#FFB020', soft: 'rgba(255,176,32,0.16)' },
        bad:  { DEFAULT: '#DC2626', soft: 'rgba(220,38,38,0.10)' },
      },
      borderRadius: {
        xs:   '6px',
        sm:   '12px',
        md:   '18px',
        lg:   '24px',
        xl:   '30px',
        pill: '999px',
      },
      boxShadow: {
        // Warm brown shadows from the reference — rgba(120,80,40,...)
        xs:   '0 2px 6px rgba(120,80,40,0.05)',
        sm:   '0 4px 12px rgba(120,80,40,0.08)',
        md:   '0 8px 22px rgba(120,80,40,0.10), 0 2px 6px rgba(120,80,40,0.05)',
        lg:   '0 18px 44px rgba(120,80,40,0.16), 0 4px 12px rgba(120,80,40,0.07)',
        glow: '0 12px 26px rgba(255,106,26,0.35)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
