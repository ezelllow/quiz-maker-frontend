import { useState } from 'react'
import Modal from './ui/Modal'
import Button3d from './ui/Button3d'
import Icon from './ui/Icon'
import { cn } from '../lib/cn'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const MAX_CHARS = 1000

/**
 * ReportButton — "something's wrong with this question".
 *
 * The student writes one sentence; everything needed to FIND the fault is
 * attached by the app. That split is the whole design: which question they
 * meant is the half of a bug report people always leave out, and it's the
 * half we can't reconstruct afterwards. `uid` is the Sheet's UID, so a
 * report leads straight to the row to edit.
 *
 * Props
 *   subject     'Physics' | 'English' | …
 *   uid         Sheet UID of the question or passage
 *   contentRef  which part of it — 'Q4', 'line 7'
 *   attemptId   so their answer can be looked at alongside the report
 *   screen      'quiz' | 'review' — where they were when they hit it
 *   label       show the word "Report" next to the flag
 */
export default function ReportButton({
  subject,
  uid,
  contentRef,
  attemptId,
  screen,
  label = false,
  className,
}) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const close = () => {
    setOpen(false)
    // Reset only after the modal has animated out, so the text doesn't
    // visibly clear while it's still on screen.
    setTimeout(() => { setMessage(''); setSent(false); setError(null) }, 250)
  }

  const send = async () => {
    const text = message.trim()
    if (!text || sending) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          message: text,
          subject,
          content_uid: uid,
          content_ref: contentRef,
          attempt_id: attemptId,
          screen,
        }),
      })
      if (!res.ok) {
        throw new Error((await res.json().catch(() => ({}))).detail || 'Could not send that')
      }
      setSent(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  const where = [uid, contentRef].filter(Boolean).join(' · ')

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Report a problem with this question"
        title="Report a problem"
        className={cn(
          'inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-quiz-muted-soft transition-colors hover:text-quiz-red',
          className,
        )}
      >
        <Icon name="flag" className="h-3.5 w-3.5" />
        {label && <span>Report</span>}
      </button>

      <Modal open={open} onClose={close} hideButtons className="max-w-sm">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-quiz-green/15 text-quiz-green">
              <Icon name="check" className="h-6 w-6" />
            </div>
            <h2 className="font-head text-xl font-extrabold">Thanks — got it.</h2>
            <p className="mt-1 text-sm font-semibold text-quiz-muted">
              We&rsquo;ll take a look. Carry on for now.
            </p>
            <Button3d full variant="green" className="mt-4" onClick={close}>Close</Button3d>
          </div>
        ) : (
          <>
            <h2 className="font-head text-xl font-extrabold">Something wrong here?</h2>
            <p className="mt-1 text-sm font-semibold text-quiz-muted">
              Tell us what looks off. A wrong answer, a typo, a missing picture
              — anything.
            </p>

            {/* Shown so they can see we already know which question they mean,
                and don't waste their sentence describing it. */}
            {where && (
              <p className="mt-3 rounded-md bg-quiz-bg-2 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-quiz-muted">
                {where}
              </p>
            )}

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
              rows={4}
              autoFocus
              disabled={sending}
              placeholder="e.g. the answer says 'colonies' but 'colony' looks right to me"
              className="mt-3 w-full rounded-md border-2 border-quiz-line bg-white p-3 text-sm font-semibold text-quiz-text outline-none transition-colors focus:border-quiz-orange"
            />

            {error && (
              <p className="mt-2 text-xs font-bold text-quiz-red">{error}</p>
            )}

            <div className="mt-4 flex items-center gap-2">
              <Button3d variant="white" className="flex-1" onClick={close} disabled={sending}>
                Cancel
              </Button3d>
              <Button3d
                variant="orange"
                className="flex-1"
                onClick={send}
                loading={sending}
                loadingLabel="Sending…"
                disabled={!message.trim()}
              >
                Send
              </Button3d>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
