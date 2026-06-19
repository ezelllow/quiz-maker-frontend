import { motion } from 'framer-motion'
import { stagger as staggerVariants, item as itemVariants, fadeInUp } from '../../motion'

/**
 * Shared motion helpers for Ooka.
 *
 * Thin React wrappers over the variants in src/motion/index.js so the
 * call sites stay declarative:
 *   <Stagger><StaggerItem>…</StaggerItem></Stagger>
 *
 * Accessibility: <MotionConfig reducedMotion="user"> in main.jsx makes
 * every animation here respect the OS "reduce motion" setting.
 */

/**
 * Stagger — container that animates its <StaggerItem> children in one
 * after another. Drop sections inside it and wrap each in <StaggerItem>.
 */
export function Stagger({ children, className = '', delay = 0.04, step = 0.06, ...rest }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={staggerVariants(delay, step)}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/**
 * StaggerItem — one child of <Stagger>; fades and rises into place.
 * Extra props (style, onClick, etc.) pass straight through to the element.
 */
export function StaggerItem({ children, className = '', ...rest }) {
  return (
    <motion.div className={className} variants={itemVariants} {...rest}>
      {children}
    </motion.div>
  )
}

/**
 * FadeInUp — single element fade-in-up, for things not inside a <Stagger>.
 */
export function FadeInUp({ children, className = '', delay = 0 }) {
  const v = fadeInUp(delay)
  return (
    <motion.div className={className} initial={v.initial} animate={v.animate}>
      {children}
    </motion.div>
  )
}
