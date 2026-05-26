import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import { ease } from '../../motion'

/**
 * IconButton — square button used for back / close / refresh actions.
 *
 *   size:    sm (32px) | md (40px) | lg (44px)
 *   tone:    glass (default) | ghost | accent
 *   label:   required for accessibility (sets aria-label + title)
 */
const SIZES = {
  sm: 'w-8 h-8 text-base',
  md: 'w-10 h-10 text-lg',
  lg: 'w-11 h-11 text-xl',
}
const TONES = {
  glass:  'qq-card-solid !p-0 hover:border-quiz-blue/40',
  ghost:  'bg-transparent border border-transparent hover:bg-white/5',
  accent: 'bg-quiz-blue/20 border border-quiz-blue/40 text-quiz-blue hover:bg-quiz-blue/30',
}

const IconButton = forwardRef(function IconButton(
  { size = 'md', tone = 'glass', label, disabled = false, className, children, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      whileHover={disabled ? undefined : { y: -1 }}
      transition={ease.spring}
      className={cn(
        'inline-flex items-center justify-center rounded-2xl transition-colors',
        SIZES[size] || SIZES.md,
        TONES[tone] || TONES.glass,
        disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  )
})

export default IconButton
