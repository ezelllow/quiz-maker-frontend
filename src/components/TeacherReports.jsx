import { useCallback, useEffect, useState } from 'react'
import Card from './ui/Card'
import Icon from './ui/Icon'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * TeacherReports — faults students have reported, newest first.
 *
 * Deliberately plain: no filters, no status, no grouping. At this size the
 * workflow is read it, fix the Sheet row the UID points at, delete it —
 * so Dismiss deletes, and an empty list means nothing is outstanding.
 * If the volume ever makes that unworkable, THAT is when it earns a status
 * column, not before.
 */
export default function TeacherReports({ authToken }) {
  const [reports, setReports] = useState([])
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  // Object URLs for photos already fetched, so reopening one doesn't refetch.
  // Kept in state rather than a ref because showing one has to re-render.
  const [photos, setPhotos] = useState({})

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/teacher/reports`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!res.ok) throw new Error('Could not load reports')
      const data = await res.json()
      setReports(data.reports || [])
      setErr(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }, [authToken])

  useEffect(() => { load() }, [load])

  // Fetched with the auth header and turned into an object URL — an <img src>
  // can't carry a bearer token, and putting one in a query string would leak
  // it into logs and history.
  const viewPhoto = async (id) => {
    if (photos[id]) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/teacher/reports/${id}/image`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!res.ok) throw new Error('Could not load that photo')
      // Awaited out here: the state updater isn't async.
      const url = URL.createObjectURL(await res.blob())
      setPhotos((prev) => ({ ...prev, [id]: url }))
    } catch (e) {
      setErr(e.message)
    }
  }

  const dismiss = async (id) => {
    setBusyId(id)
    try {
      const res = await fetch(`${API_BASE_URL}/api/teacher/reports/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!res.ok) throw new Error('Could not dismiss that')
      setReports((prev) => prev.filter((r) => r.id !== id))
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return null

  return (
    <Card variant="solid" className="!p-4 mb-4">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">
            Reported by students
          </div>
          <h2 className="font-head text-lg font-extrabold text-quiz-text">
            Faults {reports.length > 0 && <span className="text-quiz-red">({reports.length})</span>}
          </h2>
        </div>
        <button
          type="button"
          onClick={load}
          className="text-[11px] font-black uppercase tracking-wider text-quiz-muted hover:text-quiz-orange"
        >
          Refresh
        </button>
      </div>

      {err && <p className="mt-2 text-xs font-bold text-quiz-red">{err}</p>}

      {reports.length === 0 ? (
        <p className="mt-3 text-sm font-semibold text-quiz-muted">
          Nothing reported.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="rounded-md border border-quiz-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* The UID first: it's the thing you act on — the Sheet row. */}
                {r.content_uid && (
                  <span className="rounded-pill bg-quiz-red/10 px-2 py-0.5 text-[11px] font-black text-quiz-red">
                    {r.content_uid}{r.content_ref ? ` · ${r.content_ref}` : ''}
                  </span>
                )}
                {r.category && (
                  <span className="rounded-pill border border-quiz-orange/40 px-2 py-0.5 text-[11px] font-black text-quiz-orange">
                    {r.category}
                  </span>
                )}
                {r.subject && (
                  <span className="text-[11px] font-black uppercase tracking-wider text-quiz-muted">
                    {r.subject}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => dismiss(r.id)}
                  disabled={busyId === r.id}
                  className="ml-auto inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-quiz-muted hover:text-quiz-red disabled:opacity-50"
                >
                  <Icon name="x" className="h-3 w-3" /> Dismiss
                </button>
              </div>

              {/* Student-authored text: rendered as text, never as markup. */}
              {r.message && (
                <p className="mt-1.5 text-sm font-semibold leading-snug text-quiz-text">
                  {r.message}
                </p>
              )}

              {r.has_image && (
                photos[r.id] ? (
                  <a href={photos[r.id]} target="_blank" rel="noreferrer">
                    <img
                      src={photos[r.id]}
                      alt={`Screenshot from ${r.student}`}
                      className="mt-2 max-h-48 rounded-md border border-quiz-border"
                    />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => viewPhoto(r.id)}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-quiz-orange hover:underline"
                  >
                    <Icon name="eye" className="h-3 w-3" /> View photo
                  </button>
                )
              )}

              <p className="mt-1 text-[11px] font-bold text-quiz-muted">
                {r.student}{r.student_class ? ` · ${r.student_class}` : ''}
                {' · '}{new Date(r.created_at).toLocaleString()}
                {r.screen ? ` · ${r.screen}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
