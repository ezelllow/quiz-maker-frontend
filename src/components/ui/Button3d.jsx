import { forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/cn'
import { ease, dur } from '../../motion'

/**
 * Button3d — the QuizQuest signature "3D" button.
 *   Variants:     green | blue | red | yellow | purple | white | orange | gem | disabled
 *   Sizes:        sm | md | lg
 *   Loading:      swap children for a spinner; disable interaction
 *   loadingLabel: custom text shown while loading (defaults to "Loading…")
 *
 * Tailwind utilities layer on top of the .btn-3d / .btn-color classes
 * defined in src/index.css. The motion props add the press / hover spring
 * the CSS-only :active translateY couldn't.
 */
const VARIANT_CLASS = {
  green:    'btn-3d btn-green',
  blue:     'btn-3d btn-blue',
  red:      'btn-3d btn-red',
  yellow:   'btn-3d btn-yellow',
  purple:   'btn-3d btn-purple',
  white:    'btn-3d btn-white',
  orange:   'btn-3d btn-orange',
  gem:      'btn-3d btn-gem',
  disabled: 'btn-3d btn-disabled',
}

const SIZE_CLASS = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-5 py-3 text-base',
  lg: 'px-6 py-4 text-lg',
}

const Button3d = forwardRef(function Button3d(
  {
    variant = 'green',
    size = 'md',
    full = false,
    disabled = false,
    loading = false,
    loadingLabel = 'Loading…',
    type = 'button',
    className = '',
    children,
    ...rest
  },
  ref,
) {
  const inactive = disabled || loading
  const effectiveVariant = inactive ? 'disabled' : variant
  const cls = cn(
    VARIANT_CLASS[effectiveVariant] || VARIANT_CLASS.green,
    SIZE_CLASS[size] || SIZE_CLASS.md,
    full && 'w-full',
    className,
  )

  return (
    <motion.button
      ref={ref}
      type={type}
      className={cls}
      disabled={inactive}
      whileTap={inactive ? undefined : { scale: 0.95, y: 2 }}
      whileHover={inactive ? undefined : { y: -1 }}
      transition={ease.squish}
      {...rest}
    >
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.span
            key="loading"
            className="inline-flex items-center gap-2"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0, transition: { duration: dur.sm, ease: ease.out } }}
            exit={{ opacity: 0, y: -4, transition: { duration: dur.xs, ease: ease.out } }}
          >
            <span className="inline-block animate-spin">⏳</span>
            {loadingLabel}
          </motion.span>
        ) : (
          <motion.span
            key="label"
            className="inline-flex items-center gap-2"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0, transition: { duration: dur.sm, ease: ease.out } }}
            exit={{ opacity: 0, y: -4, transition: { duration: dur.xs, ease: ease.out } }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
})

export default Button3d
