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
          orange:        '#FF6A1A',
          'orange-dark': '#E8530A',
          'orange-deep': '#C7440A',
          'orange-soft': '#FFE7D3',
          'orange-bright':'#FF7A2E',
          amber:         '#FFB020',
          peach:         '#FFC59B',

          // Polychrome accents (from reference) — used for rarity badges,
          // avatar rings, gem chip, success/info distinction
          gem:           '#34B6F0',   // cyan — avatar ring + crystals
          'gem-deep':    '#1E93D6',
          violet:        '#A855F7',   // epic rarity
          rare:          '#3B9EFF',   // rare rarity
          legend:        '#F4B100',   // legendary rarity
          common:        '#9AA3AD',   // common rarity

          // Legacy aliases (mapped to brand orange so existing class
          // names keep working without refactoring every component)
          green:         '#2FBF71',
          'green-dark':  '#1FA85E',
          'green-shadow':'#168B4A',
          blue:          '#FF6A1A',
          'blue-dark':   '#E8530A',
          red:           '#DC2626',
          'red-dark':    '#991B1B',
          yellow:        '#FFB020',
          purple:        '#C7440A',
          pink:          '#FF5C8A',
          cyan:          '#34B6F0',
          magenta:       '#C7440A',
          lime:          '#FFB020',

          // Surfaces — cream backdrop, white cards
          bg:            '#FBF4EC',
          'bg-2':        '#FFF8F0',
          card:          '#FFFFFF',
          text:          '#2B2521',
          muted:         '#6E645B',
          'muted-soft':  '#A89C90',
          line:          '#F0E5D8',
          'line-soft':   '#F6EEE3',
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
