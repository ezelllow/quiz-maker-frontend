import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

/**
 * Avatar — pfp + wearable overlays (Mr Potato Head model).
 *
 * Props:
 *   src        — photo URL (optional). Falls back to initials.
 *   initials   — single character fallback.
 *   size       — 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero'
 *   equipped   — { hat, glasses, accessory, frame, hands, legs }, each a
 *                catalogue item id or null. Looked up in WEARABLES_REGISTRY.
 *   className  — wrapper utility classes.
 *
 * Layout (all positioned by % of circle size so it scales):
 *   hat        — above the circle, slight rotation
 *   glasses    — eye line
 *   accessory  — bottom-right corner badge
 *   frame      — CSS ring around the photo
 *   hands      — TWO emoji, one on each side (mirrored)
 *   legs       — TWO emoji at the bottom, side by side
 */
export const WEARABLES_REGISTRY = {
  // hats
  hat_grad:     { slot: 'hat',       emoji: '🎓' },
  hat_top:      { slot: 'hat',       emoji: '🎩' },
  hat_cowboy:   { slot: 'hat',       emoji: '🤠' },
  hat_crown:    { slot: 'hat',       emoji: '👑' },
  hat_helmet:   { slot: 'hat',       emoji: '🪖' },
  hat_wizard:   { slot: 'hat',       emoji: '🧙' },
  // glasses
  glasses_round:{ slot: 'glasses',   emoji: '👓' },
  glasses_sun:  { slot: 'glasses',   emoji: '🕶️' },
  glasses_mono: { slot: 'glasses',   emoji: '🧐' },
  glasses_vr:   { slot: 'glasses',   emoji: '🥽' },
  // accessories
  acc_bow:      { slot: 'accessory', emoji: '🎀' },
  acc_star:     { slot: 'accessory', emoji: '⭐' },
  acc_fire:     { slot: 'accessory', emoji: '🔥' },
  acc_medal:    { slot: 'accessory', emoji: '🎖️' },
  acc_trophy:   { slot: 'accessory', emoji: '🏆' },
  acc_diamond:  { slot: 'accessory', emoji: '💎' },
  // frames (CSS rings)
  frame_gold:    { slot: 'frame', value: 'gold' },
  frame_rainbow: { slot: 'frame', value: 'rainbow' },
  frame_fire:    { slot: 'frame', value: 'fire' },
  frame_galaxy:  { slot: 'frame', value: 'galaxy' },
  // hands (twin emoji on each side)
  hands_wave:   { slot: 'hands',     emoji: '👋' },
  hands_peace:  { slot: 'hands',     emoji: '✌️' },
  hands_glove:  { slot: 'hands',     emoji: '🧤' },
  hands_fist:   { slot: 'hands',     emoji: '✊' },
  hands_muscle: { slot: 'hands',     emoji: '💪' },
  hands_clap:   { slot: 'hands',     emoji: '👏' },
  hands_rock:   { slot: 'hands',     emoji: '🤘' },
  hands_magic:  { slot: 'hands',     emoji: '✨' },
  // legs (twin emoji at bottom)
  legs_sneaker: { slot: 'legs',      emoji: '👟' },
  legs_boot:    { slot: 'legs',      emoji: '🥾' },
  legs_dress:   { slot: 'legs',      emoji: '👞' },
  legs_cowboy:  { slot: 'legs',      emoji: '👢' },
  legs_ballet:  { slot: 'legs',      emoji: '🩰' },
  legs_skate:   { slot: 'legs',      emoji: '🛹' },
  legs_rocket:  { slot: 'legs',      emoji: '🚀' },
}

const SIZE = {
  xs:   { circle: 28,  hat: 18, glasses: 14, accessory: 14, hands: 14, legs: 12, font: 11 },
  sm:   { circle: 36,  hat: 22, glasses: 16, accessory: 16, hands: 16, legs: 14, font: 14 },
  md:   { circle: 48,  hat: 28, glasses: 20, accessory: 20, hands: 22, legs: 18, font: 18 },
  lg:   { circle: 72,  hat: 40, glasses: 28, accessory: 24, hands: 32, legs: 28, font: 26 },
  xl:   { circle: 96,  hat: 54, glasses: 36, accessory: 30, hands: 42, legs: 36, font: 36 },
  hero: { circle: 128, hat: 72, glasses: 48, accessory: 40, hands: 56, legs: 48, font: 48 },
}

const FRAME_STYLE = {
  default: () => ({ boxShadow: '0 0 0 2px rgba(180,180,255,0.45)' }),
  gold:    () => ({ boxShadow: '0 0 0 3px #fbbf24, 0 0 18px rgba(251,191,36,0.6), 0 0 32px rgba(251,191,36,0.3)' }),
  rainbow: () => ({
    background: 'conic-gradient(from 0deg, #fb7185, #fbbf24, #4ade80, #22d3ee, #38bdf8, #c084fc, #fb7185)',
    padding: 3,
  }),
  fire:    () => ({ boxShadow: '0 0 0 3px #fb923c, 0 0 22px rgba(251,146,60,0.8), 0 0 40px rgba(244,63,94,0.5)' }),
  galaxy:  () => ({
    background: 'conic-gradient(from 90deg, #1e1b4b, #6d28d9, #2563eb, #0c0a26, #1e1b4b)',
    boxShadow: '0 0 0 1px #4338ca, 0 0 25px rgba(99,102,241,0.7), 0 0 50px rgba(99,102,241,0.4)',
    padding: 3,
  }),
}

export default function Avatar({
  src,
  initials = '?',
  size = 'md',
  equipped,
  className,
  ...rest
}) {
  const s = SIZE[size] || SIZE.md
  const eq = equipped || {}
  const hat = eq.hat && WEARABLES_REGISTRY[eq.hat]
  const glasses = eq.glasses && WEARABLES_REGISTRY[eq.glasses]
  const acc = eq.accessory && WEARABLES_REGISTRY[eq.accessory]
  const hands = eq.hands && WEARABLES_REGISTRY[eq.hands]
  const legs = eq.legs && WEARABLES_REGISTRY[eq.legs]
  const frameEntry = eq.frame && WEARABLES_REGISTRY[eq.frame]
  const frameKey = frameEntry?.value || 'default'
  const wrapperStyle = (FRAME_STYLE[frameKey] || FRAME_STYLE.default)()

  return (
    <div
      className={cn('relative inline-block rounded-full shrink-0', className)}
      style={{ width: s.circle, height: s.circle, ...wrapperStyle }}
      {...rest}
    >
      {/* Base photo / initials circle */}
      <div
        className="relative rounded-full overflow-hidden bg-gradient-to-br from-quiz-blue to-quiz-purple
                   flex items-center justify-center font-black text-white w-full h-full"
        style={{ fontSize: s.font }}
      >
        {src
          ? <img src={src} alt="" className="w-full h-full object-cover" />
          : initials}
      </div>

      {/* Hands — TWO emoji, one on each side (mirrored), poking out the
          edges of the circle like Mr Potato Head arms. */}
      {hands && (
        <>
          <span
            className="absolute pointer-events-none select-none"
            style={{
              left: -s.hands * 0.45,
              top:  '50%',
              transform: 'translateY(-50%) scaleX(-1) rotate(-15deg)',
              fontSize: s.hands,
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
              lineHeight: 1,
            }}
          >
            {hands.emoji}
          </span>
          <span
            className="absolute pointer-events-none select-none"
            style={{
              right: -s.hands * 0.45,
              top:   '50%',
              transform: 'translateY(-50%) rotate(15deg)',
              fontSize: s.hands,
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
              lineHeight: 1,
            }}
          >
            {hands.emoji}
          </span>
        </>
      )}

      {/* Legs — TWO emoji at the bottom, side by side. Both face the same
          direction (the emoji's natural orientation); previously the right
          shoe was mirrored with scaleX(-1) so they faced each other, which
          looked wrong. */}
      {legs && (
        <>
          <span
            className="absolute pointer-events-none select-none"
            style={{
              bottom: -s.legs * 0.7,
              left:   '32%',
              transform: 'translateX(-50%)',
              fontSize: s.legs,
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
              lineHeight: 1,
            }}
          >
            {legs.emoji}
          </span>
          <span
            className="absolute pointer-events-none select-none"
            style={{
              bottom: -s.legs * 0.7,
              left:   '68%',
              transform: 'translateX(-50%)',
              fontSize: s.legs,
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
              lineHeight: 1,
            }}
          >
            {legs.emoji}
          </span>
        </>
      )}

      {/* Glasses on the eye line */}
      {glasses && (
        <span
          className="absolute pointer-events-none select-none"
          style={{
            top:  s.circle * 0.30,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: s.glasses,
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
            lineHeight: 1,
          }}
        >
          {glasses.emoji}
        </span>
      )}

      {/* Hat sitting above the circle */}
      {hat && (
        <span
          className="absolute pointer-events-none select-none"
          style={{
            top: -s.hat * 0.55,
            left: '50%',
            transform: 'translateX(-50%) rotate(-8deg)',
            fontSize: s.hat,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
            lineHeight: 1,
          }}
        >
          {hat.emoji}
        </span>
      )}

      {/* Accessory in bottom-right corner */}
      {acc && (
        <motion.span
          className="absolute pointer-events-none select-none"
          style={{
            bottom: -s.accessory * 0.15,
            right:  -s.accessory * 0.15,
            fontSize: s.accessory,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            lineHeight: 1,
          }}
          animate={{ rotate: [0, -6, 6, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {acc.emoji}
        </motion.span>
      )}
    </div>
  )
}
