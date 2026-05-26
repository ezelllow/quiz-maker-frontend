import { cn } from '../../lib/cn'
import Card from './Card'

/**
 * EmptyState — big emoji + heading + body + optional CTA, wrapped in a
 * solid card. Replaces the bespoke "no quizzes / no attempts / shop
 * coming soon" placeholders scattered across the app.
 *
 *   icon:   emoji or element shown at top
 *   title:  bold heading
 *   body:   muted descriptive text (string or ReactNode)
 *   action: optional ReactNode (e.g. <Button3d>) shown beneath body
 *   tone:   default (solid card) | warn | bad — adds a tinted border
 */
const TONES = {
  default: '',
  warn:    'border-2 border-quiz-yellow/50 bg-quiz-yellow/10',
  bad:     'border-2 border-quiz-red/50    bg-quiz-red/10',
}

export default function EmptyState({
  icon = '📭',
  title,
  body,
  action,
  tone = 'default',
  className,
  ...rest
}) {
  return (
    <Card variant="solid" className={cn('!p-8 sm:!p-10 text-center', TONES[tone], className)} {...rest}>
      {icon && <div className="text-5xl sm:text-6xl mb-3">{icon}</div>}
      {title && <div className="font-black text-lg mb-2">{title}</div>}
      {body && (
        <p className="text-sm font-bold text-quiz-muted leading-relaxed mb-0">
          {body}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </Card>
  )
}
