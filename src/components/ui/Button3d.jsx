import React from 'react'

/**
 * Button3d — the QuizQuest signature "3D" button.
 * Variants: green | blue | red | yellow | purple | white | disabled
 * Sizes: sm | md | lg
 *
 * Tailwind utility classes layer on top of the .btn-3d / .btn-<color>
 * classes defined in src/index.css.
 */
const VARIANT_CLASS = {
  green:    'btn-3d btn-green',
  blue:     'btn-3d btn-blue',
  red:      'btn-3d btn-red',
  yellow:   'btn-3d btn-yellow',
  purple:   'btn-3d btn-purple',
  white:    'btn-3d btn-white',
  orange:   'btn-3d btn-orange',
  disabled: 'btn-3d btn-disabled',
}

const SIZE_CLASS = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-5 py-3 text-base',
  lg: 'px-6 py-4 text-lg',
}

export default function Button3d({
  variant = 'green',
  size = 'md',
  full = false,
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  const effectiveVariant = disabled ? 'disabled' : variant
  const cls = [
    VARIANT_CLASS[effectiveVariant] || VARIANT_CLASS.green,
    SIZE_CLASS[size] || SIZE_CLASS.md,
    full ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ')
  return (
    <button className={cls} disabled={disabled} {...rest}>
      {children}
    </button>
  )
}
