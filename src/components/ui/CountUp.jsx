import { useEffect } from 'react'
import { useMotionValue, useTransform, animate, useReducedMotion, motion } from 'framer-motion'
import { countUpTransition } from '../../motion'

/**
 * CountUp — number that animates from its previous value to its current
 * `value` prop. Use anywhere a stat increments (XP, gems, streak).
 *
 *   value:    target number
 *   duration: override the default tween duration (seconds)
 *   format:   (n: number) => string  — defaults to integer formatting
 *
 * Implemented with framer-motion's motion-value pipeline (no React state)
 * to avoid setState-in-effect cascades. Respects the OS reduce-motion
 * setting via useReducedMotion(): when enabled, the value snaps with no
 * tween.
 */
export default function CountUp({ value, duration, format = (n) => Math.round(n).toString(), className, ...rest }) {
  const target = Number(value) || 0
  const mv = useMotionValue(target)
  const display = useTransform(mv, (latest) => format(latest))
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) {
      mv.set(target)
      return
    }
    const controls = animate(mv, target, {
      ...countUpTransition,
      ...(duration ? { duration } : null),
    })
    return () => controls.stop()
  }, [target, duration, reduce, mv])

  return (
    <motion.span className={className} {...rest}>
      {display}
    </motion.span>
  )
}
