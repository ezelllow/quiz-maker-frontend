import React from 'react'

// TopicCard — the brand-kit Topic Card primitive.
//
// Visual:  cream/white card · centered colored circle with an icon · bold
//          label · optional small hint · optional thin colored progress bar
//          with a % readout.
//
// Reused on Home (Quick Actions, Your Subjects) and inside QuizMaker for the
// Physics-level picker. Click handler optional — when omitted the card is a
// plain <div>; when provided it's a <button> with hover/tap animation.

const TONES = {
  gold:   { bg: 'rgba(201, 162, 75, 0.18)',  fg: '#C9A24B', bar: '#C9A24B' },
  green:  { bg: 'rgba(91,  185, 140, 0.18)', fg: '#3F9F73', bar: '#5BB98C' },
  blue:   { bg: 'rgba(56, 134, 200, 0.18)',  fg: '#3F8AC2', bar: '#3F8AC2' },
  purple: { bg: 'rgba(124, 78, 168, 0.18)',  fg: '#7C4EA8', bar: '#7C4EA8' },
  navy:   { bg: 'rgba(31,  42,  68, 0.18)',  fg: '#1F2A44', bar: '#1F2A44' },
  red:    { bg: 'rgba(217, 83,  79, 0.18)',  fg: '#D9534F', bar: '#D9534F' },
}

export default function TopicCard({
  icon,                 // string (img path) | string (emoji) | React node
  label,                // required: card heading
  hint,                 // optional: small sub-line under the label
  progress,             // optional: 0–100; when present renders the bar
  tone = 'gold',        // 'gold' | 'green' | 'blue' | 'purple' | 'navy' | 'red'
  onClick,              // optional: makes the card a button
  active = false,       // when true, render with a stronger ring
  className = '',
  style,                // optional inline style (e.g. fixed height)
}) {
  const t = TONES[tone] || TONES.gold
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      onClick={onClick}
      className={
        'group rounded-2xl border qq-card-solid !p-3 sm:!p-4 flex flex-col items-center text-center ' +
        'transition-all ' +
        (onClick ? 'cursor-pointer hover:-translate-y-0.5 active:scale-95 ' : '') +
        (active
          ? 'border-2 shadow-md '
          : 'border border-quiz-border ') +
        className
      }
      style={{ ...(active ? { borderColor: t.fg } : {}), ...style }}
      type={onClick ? 'button' : undefined}
    >
      {/* Icon disc */}
      <div
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-2 shrink-0"
        style={{ backgroundColor: t.bg, color: t.fg }}
      >
        {typeof icon === 'string' && icon.startsWith('/')
          ? <img src={icon} alt="" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
          : typeof icon === 'string'
          ? <span className="text-2xl sm:text-3xl leading-none">{icon}</span>
          : icon}
      </div>

      {/* Label + optional hint */}
      <div className="font-black text-sm leading-tight">{label}</div>
      {hint && (
        <div className="text-[10px] font-bold text-quiz-muted mt-0.5 leading-snug">{hint}</div>
      )}

      {/* Optional progress bar + % */}
      {progress != null && (
        <div className="w-full mt-3">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}>
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%`, backgroundColor: t.bar }}
            />
          </div>
          <div className="text-[10px] font-bold text-quiz-muted mt-1">{Math.round(progress)}%</div>
        </div>
      )}
    </Tag>
  )
}
