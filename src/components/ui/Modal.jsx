import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { backdrop, sheet } from '../../motion'
import { cn } from '../../lib/cn'
import Button3d from './Button3d'

/**
 * Modal — animated overlay replacing window.confirm and ad-hoc dialogs.
 *
 *   open:           boolean controlled by parent
 *   onClose:        called on backdrop tap, ESC, and Cancel
 *   title:          headline (optional)
 *   body:           body text or ReactNode (optional)
 *   children:       custom content rendered below body (e.g. form fields)
 *   confirmLabel:   primary button label (default 'Confirm')
 *   cancelLabel:    secondary button label (default 'Cancel'). Pass null to hide.
 *   tone:           primary button variant (default 'blue')
 *   onConfirm:      called when primary is clicked; modal also closes after
 *   hideButtons:    set true if `children` renders its own footer
 */
export default function Modal({
  open,
  onClose,
  title,
  body,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'blue',
  onConfirm,
  hideButtons = false,
  className,
}) {
  // Lock body scroll while open and dismiss on Escape.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          variants={backdrop}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className={cn('qq-card-solid w-full max-w-sm relative', className)}
            variants={sheet}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
          >
            {title && (
              <div id="modal-title" className="text-lg font-black mb-2">
                {title}
              </div>
            )}
            {body && (
              <div className="text-sm text-quiz-muted mb-4 whitespace-pre-line leading-relaxed">
                {body}
              </div>
            )}
            {children}
            {!hideButtons && (
              <div className="flex gap-2 mt-5">
                {cancelLabel != null && (
                  <Button3d variant="white" full onClick={onClose}>
                    {cancelLabel}
                  </Button3d>
                )}
                <Button3d
                  variant={tone}
                  full
                  onClick={() => {
                    onConfirm?.()
                    onClose?.()
                  }}
                >
                  {confirmLabel}
                </Button3d>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
