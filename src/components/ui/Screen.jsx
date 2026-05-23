import React from 'react'

/**
 * Screen — page wrapper.
 *
 * - Mobile-first: full-width column with comfortable horizontal padding.
 * - Desktop: widens responsively. Default max-w-3xl handles 99% of screens.
 *   Pass `wide` for Dashboard-style content (max-w-6xl) or `narrow` for
 *   auth screens (max-w-md).
 */
const WIDTH_CLASS = {
  narrow: 'max-w-md',
  default: 'max-w-3xl',
  wide: 'max-w-6xl',
}

export default function Screen({
  width = 'default',
  className = '',
  children,
}) {
  return (
    <div className={`relative z-10 w-full ${WIDTH_CLASS[width] || WIDTH_CLASS.default} mx-auto px-4 sm:px-6 py-3 sm:py-6 ${className}`.trim()}>
      {children}
    </div>
  )
}
