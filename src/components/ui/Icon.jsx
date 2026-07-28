import React from 'react'

/**
 * Icon — shared line-icon set (24×24, stroke-based). 2px rounded strokes,
 * no fills, currentColor. Inherits color + size from the parent via
 * className (e.g. "w-5 h-5 text-quiz-orange").
 *
 * This set exists to keep the whole app emoji-free: every UI glyph (nav,
 * stats, subjects, difficulty, status, shop categories, ranks) is a clean,
 * theme-aware stroke icon rather than a platform emoji. Content emojis that
 * come from backend data are mapped to these names at the call site.
 *
 * Usage: <Icon name="flame" className="w-5 h-5 text-quiz-orange" />
 */
const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const PATHS = {
  // ── Core / nav ──────────────────────────────────────────────
  pencil: (
    <>
      <path {...S} d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      <path {...S} d="M15 5l4 4" />
    </>
  ),
  chart: (
    <>
      <path {...S} d="M3 3v18h18" />
      <path {...S} d="M7 15l4-5 3 3 5-6" />
    </>
  ),
  trend: (
    <>
      <path {...S} d="M3 17l6-6 4 4 8-8" />
      <path {...S} d="M15 7h6v6" />
    </>
  ),
  bookmark: <path {...S} d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
  history: (
    <>
      <path {...S} d="M3 3v5h5" />
      <path {...S} d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path {...S} d="M12 7v5l4 2" />
    </>
  ),
  book: (
    <>
      <path {...S} d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z" />
      <path {...S} d="M4 20a2 2 0 0 1 2-2h13" />
    </>
  ),
  note: (
    <>
      <path {...S} d="M5 4h9l5 5v11H5z" />
      <path {...S} d="M14 4v5h5" />
      <path {...S} d="M8 13h7M8 16.5h5" />
    </>
  ),
  calendar: (
    <>
      <rect {...S} x="3" y="5" width="18" height="16" rx="2" />
      <path {...S} d="M3 9.5h18M8 3v4M16 3v4" />
    </>
  ),
  clock: (
    <>
      <circle {...S} cx="12" cy="12" r="9" />
      <path {...S} d="M12 7v5l3.5 2" />
    </>
  ),
  // ── Currency / stats ────────────────────────────────────────
  gem: (
    <>
      <path {...S} d="M6 3h12l4 6-10 13L2 9z" />
      <path {...S} d="M2 9h20" />
      <path {...S} d="M11 3L8 9l4 13 4-13-3-6" />
    </>
  ),
  flame: (
    <path
      {...S}
      d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"
    />
  ),
  target: (
    <>
      <circle {...S} cx="12" cy="12" r="9" />
      <circle {...S} cx="12" cy="12" r="5" />
      <circle {...S} cx="12" cy="12" r="1" />
    </>
  ),
  medal: (
    <>
      <circle {...S} cx="12" cy="9" r="6" />
      <path {...S} d="M15.4 13.9L17 22l-5-3-5 3 1.6-8.1" />
    </>
  ),
  trophy: (
    <>
      <path {...S} d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path {...S} d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5A3.5 3.5 0 0 1 16.5 11" />
      <path {...S} d="M12 14v3M8.5 21h7M9.5 21c0-1.5.8-2.5 2.5-2.5s2.5 1 2.5 2.5" />
    </>
  ),
  award: (
    <>
      <circle {...S} cx="12" cy="9" r="6" />
      <path {...S} d="M9 14.5L8 21l4-2 4 2-1-6.5" />
      <path {...S} d="M12 6.5l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L9 8.8l2-.3z" />
    </>
  ),
  snowflake: (
    <>
      <path {...S} d="M12 3v18" />
      <path {...S} d="M4.2 7.5l15.6 9" />
      <path {...S} d="M19.8 7.5l-15.6 9" />
      <path {...S} d="M12 3l-2 2.5M12 3l2 2.5M12 21l-2-2.5M12 21l2-2.5" />
    </>
  ),
  star: (
    <path {...S} d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
  ),
  sparkle: (
    <>
      <path {...S} d="M12 3l1.7 5.1L19 9.8l-5.3 1.7L12 17l-1.7-5.5L5 9.8l5.3-1.7z" />
      <path {...S} d="M18.5 15.5l.6 1.8 1.9.7-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.7z" />
    </>
  ),
  party: (
    <>
      <path {...S} d="M4 20l4.5-12 7.5 7.5z" />
      <path {...S} d="M8.5 8.2l3.3 3.3" />
      <path {...S} d="M14 3v2M19 5l-1.4 1.4M21 10h-2M17.5 3.5l.7.7" />
    </>
  ),
  rocket: (
    <>
      <path {...S} d="M9 13a12 12 0 0 1 8-9 12 12 0 0 1-1 8 3.6 3.6 0 0 1-3.8 3.8L9 13z" />
      <path {...S} d="M9 13l-3 .8L5 15l1.5 1.5L8 18l.2-2z" />
      <circle {...S} cx="15" cy="9" r="1.3" />
      <path {...S} d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2" />
    </>
  ),
  // ── Subjects / difficulty ───────────────────────────────────
  flask: (
    <>
      <path {...S} d="M9 3h6M10 3v6l-5.2 9.3A2 2 0 0 0 6.6 21h10.8a2 2 0 0 0 1.8-2.7L14 9V3" />
      <path {...S} d="M7.5 14h9" />
    </>
  ),
  atom: (
    <>
      <circle {...S} cx="12" cy="12" r="1.4" />
      <ellipse {...S} cx="12" cy="12" rx="10" ry="4" />
      <ellipse {...S} cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
      <ellipse {...S} cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
    </>
  ),
  dna: (
    <>
      <path {...S} d="M7 3c0 5 10 8 10 13M17 3c0 5-10 8-10 13" />
      <path {...S} d="M8 5.5h8M9 9h6M9 15h6M8 18.5h8" />
    </>
  ),
  magnet: (
    <>
      <path {...S} d="M6 3H3v8a9 9 0 0 0 18 0V3h-3v8a6 6 0 0 1-12 0z" />
      <path {...S} d="M3 7h3M18 7h3" />
    </>
  ),
  divide: (
    <>
      <circle {...S} cx="12" cy="6" r="1" />
      <circle {...S} cx="12" cy="18" r="1" />
      <path {...S} d="M5 12h14" />
    </>
  ),
  seedling: (
    <>
      <path {...S} d="M12 20v-7" />
      <path {...S} d="M12 13c-1-3-3.5-4-6.5-4 0 3 2 5 6.5 5" />
      <path {...S} d="M12 11c.8-2.6 2.8-3.5 5.5-3.5 0 2.6-1.8 3.9-5.5 3.9" />
    </>
  ),
  skull: (
    <>
      <path {...S} d="M5 11a7 7 0 0 1 14 0c0 2.3-1 3.8-2.3 4.8V18a1 1 0 0 1-1 1H8.3a1 1 0 0 1-1-1v-2.2C6 14.8 5 13.3 5 11z" />
      <circle {...S} cx="9.2" cy="11" r="1.4" />
      <circle {...S} cx="14.8" cy="11" r="1.4" />
      <path {...S} d="M10 19v-2M14 19v-2" />
    </>
  ),
  flag: (
    <>
      <path {...S} d="M5 21V4" />
      <path {...S} d="M5 4h13l-2.5 4L18 12H5" />
    </>
  ),
  compass: (
    <>
      <circle {...S} cx="12" cy="12" r="9" />
      <path {...S} d="M15.8 8.2l-2 5.6-5.6 2 2-5.6z" />
    </>
  ),
  bulb: (
    <>
      <path {...S} d="M12 3a6 6 0 0 0-3.8 10.7c.6.5.8 1.1.8 1.8v.5h6v-.5c0-.7.2-1.3.8-1.8A6 6 0 0 0 12 3z" />
      <path {...S} d="M9.5 19h5M10.5 21.5h3" />
    </>
  ),
  // ── Status / feedback ───────────────────────────────────────
  check: <path {...S} d="M20 6L9 17l-5-5" />,
  'check-circle': (
    <>
      <circle {...S} cx="12" cy="12" r="9" />
      <path {...S} d="M8.5 12.3l2.4 2.4 4.6-5" />
    </>
  ),
  x: <path {...S} d="M6 6l12 12M18 6L6 18" />,
  'x-circle': (
    <>
      <circle {...S} cx="12" cy="12" r="9" />
      <path {...S} d="M15 9l-6 6M9 9l6 6" />
    </>
  ),
  alert: (
    <>
      <path {...S} d="M12 3.5l9.3 16.1a1 1 0 0 1-.9 1.4H3.6a1 1 0 0 1-.9-1.4z" />
      <path {...S} d="M12 10v4.5M12 17.8v.01" />
    </>
  ),
  info: (
    <>
      <circle {...S} cx="12" cy="12" r="9" />
      <path {...S} d="M12 11v5M12 7.8v.01" />
    </>
  ),
  help: (
    <>
      <circle {...S} cx="12" cy="12" r="9" />
      <path {...S} d="M9.3 9.3a2.8 2.8 0 0 1 5.4 1c0 1.8-2.6 2.4-2.6 2.4" />
      <path {...S} d="M12 16.8v.01" />
    </>
  ),
  refresh: (
    <>
      <path {...S} d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
      <path {...S} d="M20.5 4v5h-5" />
    </>
  ),
  loader: <path {...S} d="M12 3a9 9 0 1 0 9 9" />,
  pin: (
    <>
      <path {...S} d="M9 4h6l-1 5 3 3v2H7v-2l3-3z" />
      <path {...S} d="M12 16v5" />
    </>
  ),
  inbox: (
    <>
      <path {...S} d="M3 13l3-8h12l3 8" />
      <path {...S} d="M3 13v5a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-5h-6a3 3 0 0 1-6 0z" />
    </>
  ),
  // ── Settings / appearance / account ─────────────────────────
  user: (
    <>
      <circle {...S} cx="12" cy="8" r="4" />
      <path {...S} d="M4 21c0-5 4-7 8-7s8 2 8 7" />
    </>
  ),
  gear: (
    <>
      <circle {...S} cx="12" cy="12" r="3.5" />
      <path {...S} d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
    </>
  ),
  logout: (
    <>
      <path {...S} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path {...S} d="M16 17l5-5-5-5" />
      <path {...S} d="M21 12H9" />
    </>
  ),
  login: (
    <>
      <path {...S} d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path {...S} d="M10 17l5-5-5-5" />
      <path {...S} d="M15 12H3" />
    </>
  ),
  lock: (
    <>
      <rect {...S} x="5" y="11" width="14" height="10" rx="2" />
      <path {...S} d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  unlock: (
    <>
      <rect {...S} x="5" y="11" width="14" height="10" rx="2" />
      <path {...S} d="M8 11V7a4 4 0 0 1 7.5-1.9" />
    </>
  ),
  eye: (
    <>
      <path {...S} d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle {...S} cx="12" cy="12" r="3" />
    </>
  ),
  'eye-off': (
    <>
      <path {...S} d="M9.9 5.2A9.6 9.6 0 0 1 12 5c6.4 0 10 7 10 7a13.3 13.3 0 0 1-2.8 3.4M6.5 6.6C3.7 8.3 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 3.3-.6" />
      <path {...S} d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path {...S} d="M4 4l16 16" />
    </>
  ),
  sun: (
    <>
      <circle {...S} cx="12" cy="12" r="4" />
      <path {...S} d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </>
  ),
  moon: <path {...S} d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  save: (
    <>
      <path {...S} d="M5 3h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path {...S} d="M8 3v5h7V3" />
      <rect {...S} x="8" y="13" width="8" height="6" />
    </>
  ),
  cart: (
    <>
      <circle {...S} cx="9" cy="20" r="1.3" />
      <circle {...S} cx="17" cy="20" r="1.3" />
      <path {...S} d="M3 4h2l2.4 12h10L20 8H6.5" />
    </>
  ),
  // ── Shop categories / wearables ─────────────────────────────
  shirt: <path {...S} d="M8 3l4 2.2L16 3l4 2.8-2 3.2-2-1.1V21H8V7.9L6 9 4 5.8z" />,
  hat: (
    <>
      <path {...S} d="M8 16V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9" />
      <path {...S} d="M4 16h16" />
    </>
  ),
  glasses: (
    <>
      <circle {...S} cx="6.5" cy="14.5" r="3" />
      <circle {...S} cx="17.5" cy="14.5" r="3" />
      <path {...S} d="M9.5 14.5h5" />
      <path {...S} d="M3.5 14V11l2-3M20.5 14V11l-2-3" />
    </>
  ),
  hand: (
    <>
      <path {...S} d="M8 11V5.5a1.5 1.5 0 0 1 3 0V10" />
      <path {...S} d="M11 10V4.5a1.5 1.5 0 0 1 3 0V10" />
      <path {...S} d="M14 10.5V7a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6 6 6 0 0 1-5-2.7L4.5 14a1.5 1.5 0 0 1 2.4-1.8L8 13.5" />
    </>
  ),
  boot: (
    <>
      <path {...S} d="M9 3v9c0 1.6-.5 2.4-1.5 3.2C6.4 16 6 16.8 6 18v2a1 1 0 0 0 1 1h5l6.5-1.6c1.2-.3 1.3-2 .1-2.5L14 15V3z" />
    </>
  ),
  cape: (
    <>
      <path {...S} d="M12 3l-3 3 3 3 3-3z" />
      <path {...S} d="M9 6c-3 2-5 6-5 11l8 3 8-3c0-5-2-9-5-11" />
    </>
  ),
  coin: (
    <>
      <circle {...S} cx="12" cy="12" r="9" />
      <path {...S} d="M12 7v10M9.5 9.2h3.3a1.8 1.8 0 0 1 0 3.6h-1.6a1.8 1.8 0 0 0 0 3.6H14.5" />
    </>
  ),
}

export default function Icon({ name, className = 'w-5 h-5', ...rest }) {
  const paths = PATHS[name]
  if (!paths) return null
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...rest}>
      {paths}
    </svg>
  )
}
