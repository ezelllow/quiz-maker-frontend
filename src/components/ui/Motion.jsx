import { motion } from 'framer-motion'

/**
 * Shared motion helpers for HabitGo.
 *
 * Keep durations in the 150–300ms range (UI/UX best practice). Accessibility
 * is handled globally — <MotionConfig reducedMotion="user"> in main.jsx makes
 * every animation here respect the OS "reduce motion" setting automatically.
 */

// Gentle ease-out curve used across the app.
const EASE = [0.22, 1, 0.36, 1]

/**
 * Stagger — container that animates its <StaggerItem> children in one after
 * another. Drop sections inside it and wrap each in <StaggerItem>.
 */
export function Stagger({ children, className = '', delay = 0.04, step = 0.07 }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { delayChildren: delay, staggerChildren: step } },
      }}
    >
      {children}
    </motion.div>
  )
}

/** StaggerItem — one child of <Stagger>; fades and rises into place.
 *  Extra props (style, onClick, etc.) pass straight through to the element. */
export function StaggerItem({ children, className = '', ...rest }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16 },
        show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/** FadeInUp — single element fade-in-up, for things not inside a <Stagger>. */
export function FadeInUp({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}
