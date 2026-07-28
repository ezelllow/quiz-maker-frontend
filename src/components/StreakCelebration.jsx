import { useEffect, useMemo } from 'react'
import { AnimatePresence, motion, useMotionValue, useTransform, animate as fmAnimate } from 'framer-motion'
import { burst, backdrop, ease, dur } from '../motion'
import Confetti from './ui/Confetti'
import Icon from './ui/Icon'

// ── Milestone tiers ─────────────────────────────────────────────────────
// Drives confetti/particle counts, ring counts, flash intensity, buildup
// delay, and the badge label. Tier scales with how exceptional the streak
// is. Freezes always render at tier 0 — they don't celebrate a milestone.
function streakTier(streak, freezeUsed) {
  if (freezeUsed) return 0
  if (streak >= 365 && streak % 365 === 0) return 4   // annual
  if (streak >= 100 && streak % 100 === 0) return 3   // century
  if (streak >= 30  && streak % 30  === 0) return 2   // monthly
  if (streak > 1    && streak % 7   === 0) return 1   // weekly
  return 0
}

const TIER = {
  0: { confetti: 0,   particles: 14, rings: 3, flashMax: 1.4, buildup: 0.0, badgeIcon: '',       badgeLabel: '' },
  1: { confetti: 70,  particles: 22, rings: 3, flashMax: 1.7, buildup: 0.0, badgeIcon: 'star',   badgeLabel: 'milestone' },
  2: { confetti: 120, particles: 34, rings: 4, flashMax: 2.0, buildup: 0.35, badgeIcon: 'gem',   badgeLabel: 'major milestone' },
  3: { confetti: 180, particles: 46, rings: 5, flashMax: 2.3, buildup: 0.65, badgeIcon: 'trophy', badgeLabel: 'legendary streak' },
  4: { confetti: 260, particles: 62, rings: 6, flashMax: 2.7, buildup: 1.0,  badgeIcon: 'award',  badgeLabel: 'year mark' },
}

/**
 * Full-screen celebration overlay.
 *   fire (default):   "Streak +N" — orange/red, animated flame, tier-scaled drama
 *   freeze (saved):   "Streak saved!" — cyan/blue, slowly-rotating snowflake
 */
export default function StreakCelebration({
  streak, longest, freezeUsed = false, onDismiss,
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const tier = streakTier(streak, freezeUsed)
  const cfg  = TIER[tier]
  const isNewBest = longest != null && streak === longest && streak > 1 && !freezeUsed

  // ── Variant palette ────────────────────────────────────────────────
  const v = freezeUsed
    ? {
        icon: 'snowflake',
        accent: '#38bdf8',
        ringColor: 'rgba(34, 211, 238, 0.45)',
        flashColor: 'rgba(34, 211, 238, 0.4)',
        glow:   '0 0 24px rgba(56, 189, 248, 0.55), 0 0 70px rgba(34, 211, 238, 0.35)',
        sparkleColors: ['#38bdf8','#22d3ee','#a5f3fc','#67e8f9','#c084fc'],
        sparkleGlyph: 'snowflake',
        confettiColors: ['#38bdf8', '#22d3ee', '#a5f3fc', '#bae6fd', '#c4b5fd'],
        badge:  (<><Icon name="snowflake" className="inline-block w-[1em] h-[1em] align-[-0.15em]" /> 0</>),
        buttonClass: 'btn-3d btn-blue',
        title:  streak === 1 ? 'Day 1 streak!' : `Day ${streak} streak!`,
        subtitle: (<><Icon name="snowflake" className="inline-block w-[1em] h-[1em] align-[-0.15em]" /> Freeze used — covered the day you missed. 0 freezes left this week.</>),
        stampLabel: 'Streak frozen',
        // Snowflake idle: stay in place. Just a slow subtle scale pulse so
        // it feels alive without rolling/drifting off its mark.
        idle: {
          scale: [1, 1.05, 1],
        },
        idleTransition: {
          duration: 2.6, ease: 'easeInOut', repeat: Infinity, delay: 0.85,
        },
      }
    : {
        icon: 'flame',
        accent: '#fb923c',
        ringColor: 'rgba(251, 146, 60, 0.55)',
        flashColor: 'rgba(251, 146, 60, 0.45)',
        glow:   '0 0 28px rgba(251, 146, 60, 0.65), 0 0 80px rgba(244, 63, 94, 0.35)',
        sparkleColors: ['#fbbf24','#fb923c','#fb7185','#c084fc','#22d3ee'],
        sparkleGlyph: 'sparkle',
        confettiColors: ['#fbbf24', '#fb923c', '#fb7185', '#c084fc', '#22d3ee', '#a3e635'],
        badge:  (<>+1 <Icon name="flame" className="inline-block w-[1em] h-[1em] align-[-0.15em]" /></>),
        buttonClass: 'btn-3d btn-orange',
        title:  streak === 1 ? 'Streak started!' : `Day ${streak} streak!`,
        subtitle: streak === 1
          ? 'First day on the board. Come back tomorrow to extend it.'
          : 'Come back tomorrow to keep it alive.',
        stampLabel: null,
        // Flame idle: small flicker only — the entrance already did the
        // dramatic motion, so this should just keep the fire alive without
        // pulling the eye away from the rest of the content.
        idle: {
          scale:  [1, 1.04, 0.98, 1.03, 1],
          rotate: [0, -2, 1, -1, 0],
        },
        idleTransition: {
          duration: 1.8, ease: 'easeInOut', repeat: Infinity, delay: 1.05,
        },
      }

  // ── Particle field ─────────────────────────────────────────────────
  const particles = useMemo(() => Array.from({ length: cfg.particles }, (_, i) => ({
    id: i,
    left: 8 + Math.random() * 84,
    top:  8 + Math.random() * 64,
    delay: cfg.buildup + Math.random() * 0.7,
    duration: 1.4 + Math.random() * 1.2,
    size: freezeUsed ? 16 + Math.random() * 14 : 14 + Math.random() * 20,
    color: v.sparkleColors[i % v.sparkleColors.length],
    drift: (Math.random() - 0.5) * (freezeUsed ? 60 : 80),
    rise:  freezeUsed ? 60 + Math.random() * 80 : 30 + Math.random() * 40,
    glyph: v.sparkleGlyph,
  })), [cfg.particles, cfg.buildup, freezeUsed, v.sparkleColors, v.sparkleGlyph])

  // ── Count-up for the big streak number (fire only) ─────────────────
  const numberMv = useMotionValue(freezeUsed ? streak : 0)
  const displayedNumber = useTransform(numberMv, (val) => Math.round(val).toString())
  useEffect(() => {
    if (freezeUsed) return
    const controls = fmAnimate(numberMv, streak, {
      // Higher tiers get a slower count-up so the number lingers dramatically.
      duration: dur.xl + tier * 0.25,
      ease: ease.out,
      delay: cfg.buildup + 0.35,
    })
    return () => controls.stop()
  }, [streak, freezeUsed, numberMv, tier, cfg.buildup])

  return (
    <AnimatePresence>
      <motion.div
        key="streak-overlay"
        onClick={onDismiss}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm overflow-hidden"
        variants={backdrop}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Background flash — scales bigger with higher tiers */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(circle at center, ${v.flashColor} 0%, transparent 55%)` }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{
            opacity: [0, 1, 0.6, 0.3],
            scale:   [0.6, cfg.flashMax * 0.75, cfg.flashMax, cfg.flashMax * 1.1],
            transition: { duration: 1.4 + tier * 0.15, ease: ease.out, delay: 0.05 },
          }}
        />

        {/* All rings (anticipation pre-ring + main ripples) live inside a
            single centering flex layer. Locks their origin to the screen
            centre so they can't drift from absolute-position quirks. */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Anticipation pre-ring for tier ≥ 2 — single faint ring that
              expands during buildup before the main rings hit. */}
          {tier >= 2 && (
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 60, height: 60,
                border: `2px solid ${v.ringColor}`,
                boxShadow: `0 0 50px ${v.ringColor}`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale:   [0, 12],
                opacity: [0, 0.6, 0],
                transition: { duration: cfg.buildup + 0.4, ease: ease.out },
              }}
            />
          )}

          {/* Concentric ripple rings — count + delay scale with tier */}
          {Array.from({ length: cfg.rings }, (_, i) => (
            <motion.div
              key={`ring-${i}`}
              className="absolute rounded-full"
              style={{
                width: 80, height: 80,
                border: `3px solid ${v.ringColor}`,
                boxShadow: `0 0 30px ${v.ringColor}`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale:   [0, 6, 9],
                opacity: [0, 0.85, 0],
                transition: { duration: 1.8 + tier * 0.1, ease: ease.out, delay: cfg.buildup + 0.1 + i * 0.22 },
              }}
            />
          ))}
        </div>

        {/* Tier badge for big milestones — appears DURING buildup as an
            anticipatory "incoming" cue, BEFORE the icon lands. */}
        {cfg.badgeLabel && cfg.buildup > 0 && (
          <motion.div
            className="absolute top-[18vh] font-black uppercase tracking-[0.35em] pointer-events-none select-none"
            style={{
              color: v.accent,
              fontSize: 14 + tier * 2,
              textShadow: `0 0 14px ${v.accent}, 0 2px 8px rgba(0,0,0,0.5)`,
            }}
            initial={{ opacity: 0, y: -20, scale: 0.5 }}
            animate={{
              opacity: [0, 1, 1],
              y:       [-20, 0, 0],
              scale:   [0.5, 1, 1],
              transition: { duration: 0.6, ease: ease.out, delay: 0.1 },
            }}
          >
            {cfg.badgeIcon && <Icon name={cfg.badgeIcon} className="inline-block w-[1em] h-[1em] align-[-0.15em]" />} {streak}-day {cfg.badgeLabel}
          </motion.div>
        )}

        {/* Milestone confetti (count scales with tier) */}
        {cfg.confetti > 0 && (
          <Confetti
            count={cfg.confetti}
            colors={v.confettiColors}
            duration={3.5 + tier * 0.4}
            shape="rect"
          />
        )}

        {/* Snowflake fall — freeze only, calmer than confetti */}
        {freezeUsed && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 14 }, (_, i) => {
              const left = Math.random() * 100
              const delay = Math.random() * 1.2
              const dur2 = 4 + Math.random() * 3
              const size = 14 + Math.random() * 16
              return (
                <motion.span
                  key={`snow-${i}`}
                  className="absolute text-white/85 select-none"
                  style={{ left: `${left}%`, top: '-10vh', fontSize: size }}
                  initial={{ y: 0, opacity: 0, rotate: 0 }}
                  animate={{
                    y:       '110vh',
                    opacity: [0, 0.9, 0.9, 0],
                    rotate:  [0, 360],
                    x:       (Math.random() - 0.5) * 60,
                    transition: { duration: dur2, delay, ease: 'linear' },
                  }}
                ><Icon name="snowflake" style={{ width: size, height: size }} /></motion.span>
              )
            })}
          </div>
        )}

        {/* Particle flurry around the icon */}
        {particles.map((p) => (
          <motion.span
            key={`pt-${p.id}`}
            className="pointer-events-none absolute select-none"
            style={{
              left: `${p.left}%`,
              top:  `${p.top}%`,
              fontSize: p.size,
              color: p.color,
              textShadow: `0 0 12px ${p.color}`,
            }}
            initial={{ opacity: 0, scale: 0, rotate: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale:   [0, 1, 0.85, 0],
              rotate:  [0, 180, 360],
              x:       [0, p.drift],
              y:       [0, -p.rise],
              transition: {
                duration: p.duration,
                delay:    p.delay,
                ease:     ease.loop,
                repeat:   Infinity,
                repeatDelay: 0.5,
              },
            }}
          ><Icon name={p.glyph} style={{ width: p.size, height: p.size }} /></motion.span>
        ))}

        {/* Inner content cascade — delayed by tier buildup */}
        <motion.div
          onClick={(e) => e.stopPropagation()}
          className="relative text-center px-6 z-10"
          initial="hidden"
          animate="show"
          exit="exit"
          variants={{
            hidden: {},
            show:   { transition: { staggerChildren: 0.06, delayChildren: 0.25 + cfg.buildup } },
            exit:   { opacity: 0, scale: 0.95, y: 8, transition: { duration: dur.sm, ease: ease.out } },
          }}
        >
          {/* Floating +1 badge (fire only) */}
          {!freezeUsed && (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 -top-6 font-black text-lg pointer-events-none"
              style={{ color: v.accent, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0, y: 20, scale: 0.6 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y:       [20, 0, -60, -90],
                scale:   [0.6, 1, 1.1, 1.2],
                transition: { duration: 1.6, delay: cfg.buildup + 0.55, ease: ease.out },
              }}
            >
              {v.badge}
            </motion.div>
          )}

          {/* Frost stamp — freeze only */}
          {v.stampLabel && (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 -top-10 font-black text-[10px] tracking-[0.35em] uppercase pointer-events-none"
              style={{
                color: '#e0f2fe',
                textShadow: '0 0 10px rgba(34, 211, 238, 0.9)',
                padding: '4px 12px',
                border: '2px solid rgba(165, 243, 252, 0.7)',
                borderRadius: 999,
                backdropFilter: 'blur(4px)',
              }}
              initial={{ opacity: 0, scale: 0, rotate: -8 }}
              animate={{
                opacity: 1, scale: 1, rotate: -8,
                transition: { ...ease.bouncy, delay: 0.6 },
              }}
            >
              {v.stampLabel}
            </motion.div>
          )}

          {/* Hero icon entrance — TWO different choreographies:
              · fire   → "jumps into frame": drops from above, lands with
                         a squash, then continuous flicker
              · freeze → standard burst, then a still scale pulse so the
                         snowflake holds its position
              The outer motion.div does the ENTRANCE only; the inner span
              runs the idle loop. */}
          <motion.div
            className="mb-3"
            // Fire jumps in from above; freeze uses the standard burst.
            initial={freezeUsed
              ? burst.initial
              : { y: -180, scale: 0.4, rotate: -18, opacity: 0 }}
            animate={freezeUsed ? burst.animate : {
              y:       [-180, 24, -8, 4, 0],        // drop, overshoot, settle
              scale:   [0.4, 1.18, 0.92, 1.05, 1],  // squash on landing
              rotate:  [-18, 6, -3, 2, 0],
              opacity: [0, 1, 1, 1, 1],
              transition: {
                duration: 0.85,
                ease: ease.out,
                times: [0, 0.45, 0.7, 0.88, 1],
                delay: cfg.buildup,
              },
            }}
          >
            <motion.div
              className="text-9xl select-none inline-block"
              style={{ filter: `drop-shadow(0 8px 32px ${v.accent}aa)`, transformOrigin: 'center bottom' }}
              animate={v.idle}
              transition={v.idleTransition}
            >
              <Icon name={v.icon} className="w-32 h-32 inline-block" style={{ color: v.accent }} />
            </motion.div>
          </motion.div>

          {/* Streak number with glow + count-up */}
          <motion.div
            className="font-black text-white leading-none mb-2"
            style={{ fontSize: '5.5rem', color: v.accent, textShadow: v.glow }}
            variants={burst}
          >
            <motion.span>{displayedNumber}</motion.span>
          </motion.div>

          <motion.div
            className="text-2xl font-black text-white drop-shadow-lg mb-1"
            variants={{
              hidden: { opacity: 0, y: 10 },
              show:   { opacity: 1, y: 0, transition: { duration: dur.md, ease: ease.out } },
            }}
          >
            {v.title}
          </motion.div>

          {cfg.badgeLabel && (
            <motion.div
              className="text-sm font-black mb-1 tracking-widest uppercase"
              style={{ color: tier >= 3 ? '#fbbf24' : v.accent }}
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                show:   { opacity: 1, scale: 1, transition: ease.bouncy },
              }}
            >
              {cfg.badgeIcon && <Icon name={cfg.badgeIcon} className="inline-block w-[1em] h-[1em] align-[-0.15em]" />} {streak}-day {cfg.badgeLabel}
            </motion.div>
          )}

          {isNewBest && (
            <motion.div
              className="text-sm font-black text-quiz-yellow mb-1 tracking-widest uppercase"
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                show:   { opacity: 1, scale: 1, transition: ease.bouncy },
              }}
            >
              <Icon name="trophy" className="inline-block w-[1em] h-[1em] align-[-0.15em]" /> New personal best
            </motion.div>
          )}

          <motion.p
            className="text-sm text-white/70 mb-6 max-w-xs mx-auto leading-relaxed"
            variants={{
              hidden: { opacity: 0 },
              show:   { opacity: 1, transition: { duration: dur.md, ease: ease.out } },
            }}
          >
            {v.subtitle}
          </motion.p>

          <motion.button
            onClick={onDismiss}
            className={`${v.buttonClass} px-8 py-3 text-base`}
            whileTap={{ scale: 0.95, y: 2 }}
            whileHover={{ y: -1 }}
            transition={ease.squish}
            variants={{
              hidden: { opacity: 0, y: 12 },
              show:   { opacity: 1, y: 0, transition: ease.bouncy },
            }}
          >
            Continue
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
