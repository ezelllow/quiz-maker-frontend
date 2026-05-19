import React, { useEffect, useMemo } from 'react'

// Full-screen celebration overlay — two variants:
//   fire (default): "Streak +1" — orange/red, 🔥, sparkles in warm colours
//   freeze (when freezeUsed=true): "Streak saved!" — cyan/blue, ❄️, cool sparkles
//
// The freeze variant is used when the day's streak was preserved by a freeze
// covering a missed day. It tells the user clearly: streak survived, but
// you're out of freezes for this week.
export default function StreakCelebration({
  streak, longest, freezeUsed = false, onDismiss,
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Variant palette
  const v = freezeUsed
    ? {
        icon: '❄️',
        accent: '#38bdf8',                            // cyan-blue
        glow:   '0 0 24px rgba(56, 189, 248, 0.55), 0 0 60px rgba(34, 211, 238, 0.25)',
        glowStrong: '0 0 48px rgba(56, 189, 248, 0.95), 0 0 100px rgba(34, 211, 238, 0.55)',
        sparkleColors: ['#38bdf8','#22d3ee','#a5f3fc','#67e8f9','#c084fc'],
        badge:  '🧊 0',
        buttonClass: 'btn-3d btn-blue',
        title:  streak === 1 ? 'Day 1 streak!' : `Day ${streak} streak!`,
        subtitle: '❄️ Freeze used — covered the day you missed. 0 freezes left this week.',
      }
    : {
        icon: '🔥',
        accent: '#fb923c',                            // orange
        glow:   '0 0 24px rgba(251, 146, 60, 0.55), 0 0 60px rgba(244, 63, 94, 0.25)',
        glowStrong: '0 0 48px rgba(251, 146, 60, 0.95), 0 0 100px rgba(244, 63, 94, 0.55)',
        sparkleColors: ['#fbbf24','#fb923c','#fb7185','#c084fc','#22d3ee'],
        badge:  '+1 🔥',
        buttonClass: 'btn-3d btn-orange',
        title:  streak === 1 ? 'Streak started!' : `Day ${streak} streak!`,
        subtitle: streak === 1
          ? 'First day on the board. Come back tomorrow to extend it.'
          : 'Come back tomorrow to keep it alive.',
      }

  const sparkles = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    id: i,
    left: 10 + Math.random() * 80,
    top:  20 + Math.random() * 50,
    delay: Math.random() * 0.8,
    size: 12 + Math.random() * 18,
    color: v.sparkleColors[i % v.sparkleColors.length],
  })), [freezeUsed])  // eslint-disable-line react-hooks/exhaustive-deps

  const isNewBest = longest != null && streak === longest && streak > 1 && !freezeUsed

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      style={{ animation: 'backdropFade 250ms ease-out forwards' }}
    >
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="pointer-events-none absolute"
          style={{
            left: `${s.left}%`, top: `${s.top}%`,
            fontSize: s.size, color: s.color,
            animation: `sparkle 1.6s ${s.delay}s ease-in-out infinite`,
            textShadow: `0 0 12px ${s.color}`,
          }}
        >✦</span>
      ))}

      <div onClick={(e) => e.stopPropagation()} className="relative text-center px-6">
        {/* Floating badge */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-6 font-black text-lg pointer-events-none"
          style={{
            color: v.accent,
            animation: 'floatUpFade 1.6s 0.5s ease-out forwards',
            opacity: 0,
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          {v.badge}
        </div>

        {/* Icon */}
        <div
          className="text-9xl mb-3 select-none"
          style={{
            animation: 'streakBurst 800ms cubic-bezier(.22, 1.5, .36, 1) forwards',
            filter: `drop-shadow(0 8px 32px ${v.accent}99)`,
          }}
        >
          {v.icon}
        </div>

        {/* Big streak number with glow */}
        <div
          className="font-black text-white leading-none mb-2"
          style={{
            fontSize: '5.5rem',
            color: v.accent,
            animation: 'streakBurst 800ms 200ms cubic-bezier(.22, 1.5, .36, 1) backwards',
            textShadow: v.glow,
          }}
        >
          {streak}
        </div>

        <div className="text-2xl font-black text-white drop-shadow-lg mb-1">
          {v.title}
        </div>

        {isNewBest && (
          <div className="text-sm font-black text-quiz-yellow mb-1 tracking-widest uppercase">
            🏆 New personal best
          </div>
        )}

        <p className="text-sm text-white/70 mb-6 max-w-xs mx-auto leading-relaxed">
          {v.subtitle}
        </p>

        <button onClick={onDismiss} className={`${v.buttonClass} px-8 py-3 text-base`}>
          Continue
        </button>
      </div>
    </div>
  )
}
