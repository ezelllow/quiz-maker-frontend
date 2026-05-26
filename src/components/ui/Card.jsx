import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import { ease } from '../../motion'

/**
 * Card — the QuizQuest card primitive.
 *   variant:     'glass' (default, translucent blurred) | 'solid'
 *   interactive: when true, renders a motion.div with hover lift and
 *                tap squish. Use for tappable cards like Home quick-actions.
 *
 * `as` lets you swap the tag (e.g. Card as="article"). When `interactive`
 * is set, the tag is forced to motion.div — wrap in your own button if
 * you need semantic button behaviour outside.
 */
export default function Card({
  variant = 'glass',
  as: Tag = 'div',
  interactive = false,
  className = '',
  children,
  ...rest
}) {
  const base = variant === 'solid' ? 'qq-card-solid' : 'qq-card'
  const cls = cn(base, className)

  if (interactive) {
    return (
      <motion.div
        className={cls}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
        transition={ease.spring}
        {...rest}
      >
        {children}
      </motion.div>
    )
  }
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  )
}
