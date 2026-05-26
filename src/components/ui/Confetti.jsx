import { useMemo } from 'react'
import { motion } from 'framer-motion'

/**
 * Confetti — celebratory falling-paper effect. Renders N motion.divs
 * raining from above the visible area, each with random colour, size,
 * delay, drift, and rotation.
 *
 *   count:    number of pieces (default 60)
 *   colors:   array of CSS colour strings (rotated through the pieces)
 *   duration: seconds per piece to fall (default 3.5)
 *   shape:    'rect' (default) | 'circle' | 'star'
 *   className: optional override for the container
 *
 * Designed to be dropped inside an absolutely-positioned overlay
 * (e.g. fixed inset-0). The container fills its parent.
 */
const DEFAULT_COLORS = ['#fbbf24', '#fb923c', '#4ade80', '#38bdf8', '#c084fc', '#f472b6', '#22d3ee', '#a3e635']

export default function Confetti({
  count = 60,
  colors = DEFAULT_COLORS,
  duration = 3.5,
  shape = 'rect',
  className = '',
}) {
  const pieces = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left:     Math.random() * 100,       // %
      drift:    (Math.random() - 0.5) * 220, // px sideways drift over fall
      size:     6 + Math.random() * 10,    // px
      delay:    Math.random() * 1.2,       // s
      duration: duration + Math.random() * 1.5,
      color:    colors[i % colors.length],
      rotate:   Math.random() * 720 - 360, // total rotation
      shape,
    }))
  }, [count, duration, shape, colors])

  return (
    <div className={'absolute inset-0 overflow-hidden pointer-events-none ' + className}>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute top-0"
          style={{
            left: `${p.left}%`,
            width: p.shape === 'circle' ? p.size : p.size,
            height: p.shape === 'rect' ? p.size * 1.4 : p.size,
            background: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'star' ? '0' : '2px',
            // Star = clip-path with 5-point star; cheap and looks nice.
            clipPath: p.shape === 'star'
              ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
              : undefined,
          }}
          initial={{ y: '-20vh', opacity: 0, rotate: 0 }}
          animate={{
            y:       '110vh',
            x:       p.drift,
            opacity: [0, 1, 1, 1, 0],
            rotate:  p.rotate,
            transition: {
              duration: p.duration,
              delay:    p.delay,
              ease:     'linear',
            },
          }}
        />
      ))}
    </div>
  )
}
