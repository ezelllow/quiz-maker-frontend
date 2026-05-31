import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import { ease } from '../../motion'

/**
 * Skeleton — pulsing placeholder, used while data is loading.
 *
 *   shape:    line (default, single-line text) | block (small block) | card (full card-sized) | circle
 *   width:    Tailwind width class (default 'w-full')
 *   height:   Tailwind height class (overrides shape default)
 *   rounded:  Tailwind rounded class (overrides shape default)
 *
 * The pulse is opacity-only so the underlying bg colour stays visible
 * even when reduce-motion is on (the user still sees *something* shaped
 * like the content).
 */
const SHAPES = {
  line:   { height: 'h-3',  rounded: 'rounded-md' },
  block:  { height: 'h-12', rounded: 'rounded-xl' },
  card:   { height: 'h-32', rounded: 'rounded-3xl' },
  circle: { height: 'h-10 w-10', rounded: 'rounded-full' },
}

export default function Skeleton({
  shape = 'line',
  width = 'w-full',
  height,
  rounded,
  className,
}) {
  const s = SHAPES[shape] || SHAPES.line
  return (
    <motion.div
      className={cn('bg-gray-100', height || s.height, rounded || s.rounded, width, className)}
      animate={{ opacity: [0.45, 0.85, 0.45] }}
      transition={{ duration: 1.4, ease: ease.inOut, repeat: Infinity }}
      aria-hidden="true"
    />
  )
}
