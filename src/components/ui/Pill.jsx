import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import { ease } from '../../motion'
import Badge from './Badge'

/**
 * Pill — stat chip like "💎 12" used in the top navbar and Home cards.
 * Optionally tappable (renders as a motion.button), otherwise a static
 * <Badge>.
 *
 *   tone:    accent | ok | warn | bad | purple | cyan | orange | yellow | muted
 *   size:    sm | md
 *   icon:    leading icon (emoji or element)
 *   value:   the right-hand value (string | number)
 *   label:   optional aria-label / title
 *   onClick: when provided, becomes a motion.button with tap feedback
 */
export default function Pill({
  tone = 'muted',
  size = 'sm',
  icon,
  value,
  label,
  onClick,
  className,
  ...rest
}) {
  if (onClick) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={label}
        whileTap={{ scale: 0.95 }}
        whileHover={{ y: -1 }}
        transition={ease.spring}
        className={cn('inline-flex', className)}
        {...rest}
      >
        <Badge tone={tone} size={size} icon={icon}>
          {value}
        </Badge>
      </motion.button>
    )
  }
  return (
    <Badge tone={tone} size={size} icon={icon} title={label} aria-label={label} className={className} {...rest}>
      {value}
    </Badge>
  )
}
