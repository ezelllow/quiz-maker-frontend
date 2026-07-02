import React from 'react'

/**
 * Icon — shared line-icon set (24×24, stroke-based), matching the bottom-nav
 * NavIcon aesthetic: 2px rounded strokes, no fills, currentColor.
 *
 * Usage: <Icon name="flame" className="w-5 h-5 text-quiz-orange" />
 *
 * Replaces the scattered UI emojis (✏️ 📊 💾 📋 💎 🔥 🎯 🏅 ⭐ 🧊 👤 ⚙️ 🚪)
 * with one consistent, theme-aware set. Content emojis (mascot, rank tiers
 * from the backend) are intentionally NOT part of this set.
 */
const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const PATHS = {
  // ✏️ practice / edit
  pencil: (
    <>
      <path {...S} d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      <path {...S} d="M15 5l4 4" />
    </>
  ),
  // 📊 dashboard / stats — trending line
  chart: (
    <>
      <path {...S} d="M3 3v18h18" />
      <path {...S} d="M7 15l4-5 3 3 5-6" />
    </>
  ),
  // 💾 saved — bookmark
  bookmark: (
    <path {...S} d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  ),
  // 📋 history — clock with rewind arrow
  history: (
    <>
      <path {...S} d="M3 3v5h5" />
      <path {...S} d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path {...S} d="M12 7v5l4 2" />
    </>
  ),
  // 💎 gems / crystals
  gem: (
    <>
      <path {...S} d="M6 3h12l4 6-10 13L2 9z" />
      <path {...S} d="M2 9h20" />
      <path {...S} d="M11 3L8 9l4 13 4-13-3-6" />
    </>
  ),
  // 🔥 streak
  flame: (
    <path
      {...S}
      d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"
    />
  ),
  // 🎯 daily challenge
  target: (
    <>
      <circle {...S} cx="12" cy="12" r="9" />
      <circle {...S} cx="12" cy="12" r="5" />
      <circle {...S} cx="12" cy="12" r="1" />
    </>
  ),
  // 🏅 daily done
  medal: (
    <>
      <circle {...S} cx="12" cy="9" r="6" />
      <path {...S} d="M15.4 13.9L17 22l-5-3-5 3 1.6-8.1" />
    </>
  ),
  // 🧊 streak freeze
  snowflake: (
    <>
      <path {...S} d="M12 3v18" />
      <path {...S} d="M4.2 7.5l15.6 9" />
      <path {...S} d="M19.8 7.5l-15.6 9" />
      <path {...S} d="M12 3l-2 2.5M12 3l2 2.5M12 21l-2-2.5M12 21l2-2.5" />
    </>
  ),
  // ⭐ level
  star: (
    <path
      {...S}
      d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"
    />
  ),
  // 👤 profile
  user: (
    <>
      <circle {...S} cx="12" cy="8" r="4" />
      <path {...S} d="M4 21c0-5 4-7 8-7s8 2 8 7" />
    </>
  ),
  // ⚙️ settings
  gear: (
    <>
      <circle {...S} cx="12" cy="12" r="3.5" />
      <path {...S} d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
    </>
  ),
  // 🚪 logout
  logout: (
    <>
      <path {...S} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path {...S} d="M16 17l5-5-5-5" />
      <path {...S} d="M21 12H9" />
    </>
  ),
  // ✓ done
  check: <path {...S} d="M20 6L9 17l-5-5" />,
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
