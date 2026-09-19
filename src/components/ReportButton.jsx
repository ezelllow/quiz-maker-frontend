import { useCallback, useRef, useState } from 'react'
import Modal from './ui/Modal'
import Button3d from './ui/Button3d'
import Icon from './ui/Icon'
import { cn } from '../lib/cn'
import downscaleImage from '../lib/downscaleImage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const MAX_CHARS = 1000

// Shown until the backend's list arrives, and as the fallback if it can't be
// reached — a student mid-report shouldn't lose the chips to a failed GET.
const FALLBACK_CATEGORIES = [
  'Wrong answer', 'Question unclear', 'Typo', 'Picture missing', "Won't load", 'Other',
]

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
 *   compact     icon only, for somewhere already tight (the line sheet).
 *               Everywhere else it's a labelled pill — a lone grey flag in a
 *               bar full of crystals and ranks reads as decoration, and an
 *               unnoticed report button is the same as no report button.
 */
export default function ReportButton({
  subject,
  uid,
  contentRef,
  attemptId,
  screen,
  compact = false,
  className,
}) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState(null)
  const [image, setImage] = useState(null)          // {dataUrl, bytes}
  const [preparing, setPreparing] = useState(false)
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  // Fetched rather than hardcoded so the chips can't drift from what the
  // POST will accept. Only once, and only once someone opens the form.
  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/categories`)
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.categories) && data.categories.length) {
        setCategories(data.categories)
      }
    } catch {
      /* the fallback list is already on screen */
    }
  }, [])

  const close = () => {
    setOpen(false)
    // Reset only after the modal has animated out, so it doesn't visibly
    // empty itself while still on screen.
    setTimeout(() => {
      setMessage(''); setCategory(null); setImage(null)
      setSent(false); setError(null); setPreparing(false)
    }, 250)
  }

  const pickImage = async (file) => {
    if (!file) return
    setPreparing(true)
    setError(null)
    try {
      setImage(await downscaleImage(file))
    } catch (e) {
      setError(e.message)
    } finally {
      setPreparing(false)
      // Clear the input so picking the SAME file again still fires onChange.
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // A chosen issue or a photo is a complete report on its own: "Picture
  // missing" plus a screenshot says everything a sentence would.
  const canSend = !!(message.trim() || category || image) && !sending && !preparing

  const send = async () => {
    if (!canSend) return
    const text = message.trim()
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
          category,
          image: image?.dataUrl || null,
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
        onClick={() => { setOpen(true); loadCategories() }}
        aria-label="Report a problem"
        title="Report a problem"
        className={cn(
          'inline-flex shrink-0 items-center gap-1 font-black uppercase tracking-wider transition-colors',
          compact
            ? 'text-[11px] text-quiz-muted-soft hover:text-quiz-red'
            : 'rounded-pill border border-quiz-red/40 bg-quiz-red/10 px-2 py-1 text-[11px] text-quiz-red hover:bg-quiz-red/20',
          className,
        )}
      >
        <Icon name="flag" className="h-3.5 w-3.5" />
        <span className={compact ? 'sr-only' : undefined}>Report</span>
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

            {/* Pick the closest thing first. Most reports are one of these,
                and a chip is far less work than a sentence on a phone. */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {categories.map((c) => {
                const on = category === c
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={sending}
                    onClick={() => setCategory(on ? null : c)}
                    aria-pressed={on}
                    className={cn(
                      'rounded-pill border px-2.5 py-1 text-[12px] font-black transition-colors',
                      on
                        ? 'border-quiz-orange bg-quiz-orange/15 text-quiz-orange'
                        : 'border-quiz-line text-quiz-muted hover:border-quiz-orange/50',
                    )}
                  >
                    {c}
                  </button>
                )
              })}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
              rows={3}
              disabled={sending}
              placeholder={category === 'Other' || !category
                ? "What's wrong? e.g. the answer says 'colonies' but 'colony' looks right"
                : 'Anything to add? (optional)'}
              className="mt-2 w-full rounded-md border-2 border-quiz-line bg-white p-3 text-sm font-semibold text-quiz-text outline-none transition-colors focus:border-quiz-orange"
            />

            {/* A photo is often the fastest way to show a broken diagram. */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => pickImage(e.target.files?.[0])}
            />

            {image ? (
              <div className="mt-2 flex items-center gap-2 rounded-md border border-quiz-line p-2">
                <img
                  src={image.dataUrl}
                  alt="Attached screenshot"
                  className="h-12 w-12 flex-none rounded object-cover"
                />
                <span className="text-[11px] font-bold text-quiz-muted">
                  Photo attached · {Math.round(image.bytes / 1024)} KB
                </span>
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  disabled={sending}
                  className="ml-auto text-[11px] font-black uppercase tracking-wider text-quiz-muted hover:text-quiz-red"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={sending || preparing}
                className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-black uppercase tracking-wider text-quiz-muted transition-colors hover:text-quiz-orange disabled:opacity-60"
              >
                <Icon name="pin" className="h-3.5 w-3.5" />
                {preparing ? 'Preparing…' : 'Add a photo'}
              </button>
            )}

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
                disabled={!canSend}
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
