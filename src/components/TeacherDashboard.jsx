import React, { useEffect, useState } from 'react'
import Card from './ui/Card'
import { Stagger, StaggerItem } from './ui/Motion'
import TeacherStudentDrillIn from './TeacherStudentDrillIn'

// TeacherDashboard — read-only overview rendered when the JWT carries
// is_teacher = true. Four sections, in order of decision-value:
//   1. Week-at-a-glance tiles (sanity check before a parent meeting)
//   2. Weakest topics this week (drives the lesson plan; click to expand the
//      list of students under 60%)
//   3. Inactive students (WhatsApp shortlist — silent 5+ days or never active)
//   4. Student consistency (attendance + effort per student, last 7 days)
// One backend round-trip: GET /api/teacher/overview.
//
// No bottom-nav, no student routes — teachers don't navigate inside the app
// in v1. Refresh + Logout live in the header.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function TeacherDashboard({ authToken, user, onLogout, onViewAsStudent, onOpenAttempt }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [data, setData]         = useState(null)
  const [err, setErr]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState({})        // { topic: bool }
  const [refreshKey, setRefreshKey] = useState(0)
  // 'all' | 'daily' | 'practice' — narrows every stat below to one slice of
  // the quiz_attempts table. Re-fetches on change (one round-trip per toggle).
  const [quizFilter, setQuizFilter] = useState('all')
  // When set, the StudentDrillIn modal opens for that student. Cleared by
  // the modal's close (Esc, backdrop, or the X button).
  const [viewingStudentId, setViewingStudentId] = useState(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setLoading(true); setErr(null)
    const url = `${API_BASE_URL}/api/teacher/overview` +
                (quizFilter !== 'all' ? `?quiz_type=${quizFilter}` : '')
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.text().catch(() => '')
          throw new Error(`HTTP ${r.status}${body ? ` — ${body.slice(0, 120)}` : ''}`)
        }
        return r.json()
      })
      .then((d) => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch((e) => { if (!cancelled) { setErr(String(e.message || e)); setLoading(false) } })
    return () => { cancelled = true }
  }, [token, refreshKey, quizFilter])

  const teacherName = (user?.name || 'Teacher').trim()

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== Top bar (no student-style nav — teachers don't navigate) ===== */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl border-b"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--quiz-bg-2) 85%, transparent)',
          borderBottomColor: 'var(--quiz-border)',
        }}
      >
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center gap-2 font-black text-lg tracking-tight">
            <img src="/brand/ooka/logos/ooka_logo_2_sm.webp" alt="Ooka" className="w-7 h-7 rounded-lg" />
            <span className="bg-gradient-to-r from-quiz-blue to-quiz-purple bg-clip-text text-transparent">
              Ooka
            </span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest
                             bg-quiz-purple/20 border border-quiz-purple/40 text-quiz-purple">
              Teacher
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-quiz-muted hidden sm:inline">{teacherName}</span>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              title="Refresh"
              className="px-3 py-1.5 rounded-full text-xs font-black border border-quiz-border
                         hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              ↻
            </button>
            {onViewAsStudent && (
              <button
                onClick={onViewAsStudent}
                title="See Ooka through a student's eyes — your teacher view is one tap away"
                className="px-3 py-1.5 rounded-full text-xs font-black text-quiz-purple
                           border border-quiz-purple/40 hover:bg-quiz-purple/10 transition-colors"
              >
                👁️ View as student
              </button>
            )}
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-full text-xs font-black text-quiz-red
                         border border-quiz-red/40 hover:bg-quiz-red/10 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ===== Main ===== */}
      <main className="max-w-5xl mx-auto w-full flex-1 px-4 py-5 sm:py-6">
        {/* Header line above the always-on class-pulse tiles. Roster size is
            a property of the class, not of any quiz_type, so it sits up here
            with the tiles instead of in the filter row below. */}
        <div className="text-xs font-bold text-quiz-muted mb-3">
          {data ? (
            <>
              <span className="text-quiz-text font-black text-sm">
                {data.week_at_a_glance.total_students}
              </span>{' '}
              students enrolled · last 7 days
            </>
          ) : (
            <span className="opacity-50">— students · last 7 days</span>
          )}
        </div>

        {loading && (
          <div className="text-center py-24 text-quiz-muted font-bold">⏳ Loading overview…</div>
        )}

        {err && !loading && (
          <Card variant="solid" className="!p-4 mb-4 border-quiz-red/40">
            <div className="text-quiz-red font-bold">Couldn't load overview: {err}</div>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="mt-2 text-quiz-blue underline text-sm font-bold"
            >
              Retry
            </button>
          </Card>
        )}

        {data && !loading && !err && (
          <Stagger>
            {/* 1. Week at a glance */}
            <StaggerItem className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
              <StatTile
                label="Active"
                value={data.week_at_a_glance.active_students}
                hint={`of ${data.week_at_a_glance.total_students} enrolled`}
              />
              <StatTile
                label="Per student"
                value={fmtNum1(data.week_at_a_glance.avg_quizzes_per_active)}
                hint="quizzes / active student"
              />
              <StatTile
                label="Pass rate"
                value={fmtPct(data.week_at_a_glance.pass_rate_pct)}
                hint="attempts ≥ 60%"
              />
              <StatTile
                label="Inactive"
                value={data.week_at_a_glance.inactive_count}
                tone={data.week_at_a_glance.inactive_count > 0 ? 'warn' : undefined}
              />
            </StaggerItem>

            {/* Filter — narrows ONLY the three sections below. Tiles above
                stay put. */}
            <StaggerItem className="flex flex-wrap items-center gap-3 mb-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">
                Narrow sections below:
              </div>
              <div className="flex items-center gap-1 p-1 rounded-full bg-black/5 border border-quiz-border">
                {[
                  { k: 'all',      label: 'All' },
                  { k: 'daily',    label: 'Daily' },
                  { k: 'practice', label: 'Practice' },
                ].map(({ k, label }) => (
                  <button
                    key={k}
                    onClick={() => setQuizFilter(k)}
                    className={
                      'px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest transition-colors ' +
                      (quizFilter === k
                        ? 'bg-gradient-to-r from-quiz-blue to-quiz-purple text-white shadow-sm'
                        : 'text-quiz-muted hover:text-quiz-text')
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </StaggerItem>

            {/* 2. Weakest topics */}
            <StaggerItem>
              <Card variant="solid" className="!p-4 mb-4">
                <SectionHeader
                  eyebrow="Teaching priority"
                  title="Class struggled most with — last 7 days"
                  hint="Click a topic to see which students are under 60%"
                />
                {data.weakest_topics.length === 0 ? (
                  <EmptyState text="No weak topics this week. Class is on top of it ✓" />
                ) : (
                  <div className="space-y-1.5 mt-2">
                    {data.weakest_topics.map((t) => (
                      <WeakTopicRow
                        key={t.topic}
                        topic={t}
                        open={!!expanded[t.topic]}
                        onToggle={() =>
                          setExpanded((e) => ({ ...e, [t.topic]: !e[t.topic] }))
                        }
                      />
                    ))}
                  </div>
                )}
              </Card>
            </StaggerItem>

            {/* 3. Inactive students — pure inactivity bucket */}
            <StaggerItem>
              <Card variant="solid" className="!p-4 mb-4">
                <SectionHeader
                  eyebrow="WhatsApp shortlist"
                  title={`Inactive students (${data.inactive_students.length})${quizFilter !== 'all' ? ` · ${quizFilter}` : ''}`}
                  hint="Silent 5+ days or never active"
                />
                {data.inactive_students.length === 0 ? (
                  <EmptyState text="Everyone's been active this week. Nice ✓" />
                ) : (
                  <div className="space-y-1.5 mt-2">
                    {data.inactive_students.map((s) => (
                      <InactiveRow key={s.id} s={s} onPick={() => setViewingStudentId(s.id)} />
                    ))}
                  </div>
                )}
              </Card>
            </StaggerItem>

            {/* 4. Student consistency — attendance + effort per student */}
            <StaggerItem>
              <Card variant="solid" className="!p-4 mb-4">
                <SectionHeader
                  eyebrow="Attendance + effort"
                  title="Student consistency — last 7 days"
                  hint={
                    data.consistency_summary
                      ? `avg ${data.consistency_summary.avg_days_active}/7 days · ${data.consistency_summary.students_with_streak_3plus} on a streak ≥3`
                      : null
                  }
                />
                <div className="text-[10px] font-bold text-quiz-muted mt-1 italic">
                  Streak (🔥) is all-time and doesn't change with the filter.
                </div>
                {(!data.consistency || data.consistency.length === 0) ? (
                  <EmptyState text="No students yet." />
                ) : (
                  <div className="space-y-1.5 mt-2">
                    {data.consistency.map((s) => (
                      <ConsistencyRow key={s.id} s={s} onPick={() => setViewingStudentId(s.id)} />
                    ))}
                  </div>
                )}
              </Card>
            </StaggerItem>

            <div className="text-center text-quiz-muted text-[11px] font-bold mt-4">
              Updated {new Date(data.generated_at).toLocaleString()} · window: last {data.window_days} days
            </div>
          </Stagger>
        )}
      </main>

      {/* Drill-in modal — opens when a student row is clicked anywhere above. */}
      {viewingStudentId != null && (
        <TeacherStudentDrillIn
          studentId={viewingStudentId}
          authToken={token}
          onClose={() => setViewingStudentId(null)}
          onOpenAttempt={(id) => {
            // Close the modal first so the dashboard isn't covered when we
            // route back from the review page.
            setViewingStudentId(null)
            onOpenAttempt && onOpenAttempt(id)
          }}
        />
      )}
    </div>
  )
}

// ===== helpers ===============================================================

function fmtPct(v) {
  if (v == null) return '—'
  return Math.round(v) + '%'
}

function fmtNum1(v) {
  // One-decimal display ("3.4"), trimming a trailing .0 so whole numbers look
  // clean ("3" not "3.0"). Used for per-student averages.
  if (v == null) return '—'
  const n = Number(v)
  if (!isFinite(n)) return '—'
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

function SectionHeader({ eyebrow, title, hint }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">
            {eyebrow}
          </div>
        )}
        <div className="font-black truncate">{title}</div>
      </div>
      {hint && <div className="text-[11px] font-bold text-quiz-muted shrink-0 hidden sm:block">{hint}</div>}
    </div>
  )
}

function EmptyState({ text }) {
  return <div className="text-center py-6 text-quiz-muted font-bold text-sm">{text}</div>
}

function StatTile({ label, value, hint, tone }) {
  const toneRing = tone === 'warn' ? 'ring-1 ring-quiz-orange/40' : ''
  return (
    <Card variant="solid" className={`!p-3 sm:!p-4 ${toneRing}`}>
      <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">{label}</div>
      <div className="text-2xl sm:text-3xl font-black mt-0.5">{value}</div>
      {hint && <div className="text-[11px] text-quiz-muted mt-1 font-bold truncate">{hint}</div>}
    </Card>
  )
}

function WeakTopicRow({ topic, open, onToggle, onPickStudent }) {
  const sharePct =
    topic.students_attempted > 0
      ? Math.round((topic.struggling_count / topic.students_attempted) * 100)
      : 0
  return (
    <div className="rounded-xl border border-quiz-border bg-black/5">
      <button
        onClick={onToggle}
        className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-black/10 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <div className="font-black text-sm truncate">{topic.topic}</div>
          <div className="text-[11px] text-quiz-muted font-bold mt-0.5">
            {topic.struggling_count}/{topic.students_attempted} students under 60%
            {' · '}{topic.attempts} attempts
            {' · '}avg {fmtPct(topic.avg_pct)}
          </div>
        </div>
        <span className="shrink-0 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                         bg-quiz-orange/20 border border-quiz-orange/40 text-quiz-orange">
          {sharePct}% struggling
        </span>
        <span className="text-quiz-muted text-sm">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-2 border-t border-quiz-border bg-black/10">
          {topic.struggling_students.length === 0 ? (
            <div className="text-[11px] text-quiz-muted font-bold py-1">
              No specific students below 60% — average just dragged the topic down.
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {topic.struggling_students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onPickStudent && onPickStudent(s.id)}
                  title={`See ${s.name}'s recent quizzes`}
                  className="px-2 py-1 rounded-full text-[11px] font-bold
                             bg-quiz-red/15 border border-quiz-red/40 text-quiz-red
                             hover:bg-quiz-red/25 transition-colors cursor-pointer"
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ConsistencyRow({ s, onPick }) {
  // Render the 7-day attendance as a row of dots — filled = day active.
  // Most-consistent students float to the top of this list (server-sorted),
  // so a long row of green dots near the top is the "doing fine" signal,
  // and faded dots toward the bottom flag drift before it becomes silence.
  const dots = Array.from({ length: 7 }, (_, i) => i < s.days_active_7d)
  const longHint = s.longest_streak > 0 ? `longest · ${s.longest_streak}d` : 'no streak yet'
  return (
    <div
      onClick={onPick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick && onPick() } }}
      className="rounded-xl border border-quiz-border bg-black/5 px-3 py-2 flex items-center gap-3 cursor-pointer hover:bg-black/10 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <div className="font-black text-sm truncate">{s.name}</div>
        <div className="flex items-center gap-1 mt-1">
          {dots.map((on, i) => (
            <span
              key={i}
              className={'inline-block w-2 h-2 rounded-full ' + (on ? 'bg-quiz-green' : 'bg-white/15')}
            />
          ))}
          <span className="text-[11px] font-bold text-quiz-muted ml-1">
            {s.days_active_7d}/7 days
          </span>
        </div>
      </div>
      <span className="shrink-0 px-2 py-1 rounded-full text-[11px] font-bold
                       bg-black/5 border border-quiz-border text-quiz-text">
        {s.quizzes_7d} {s.quizzes_7d === 1 ? 'quiz' : 'quizzes'}
      </span>
      <span
        title={longHint}
        className="shrink-0 px-2 py-1 rounded-full text-[11px] font-black
                   bg-quiz-orange/15 border border-quiz-orange/40 text-quiz-orange"
      >
        🔥 {s.current_streak}
      </span>
    </div>
  )
}

function InactiveRow({ s, onPick }) {
  const never = s.last_active === null
  const dayLabel = never
    ? 'Never active'
    : s.days_since === 0
    ? 'Today'
    : s.days_since === 1
    ? 'Yesterday'
    : `${s.days_since}d ago`
  // Red for silent ≥7 days or never active; orange for the rest of the at-risk set.
  const tone =
    never || (typeof s.days_since === 'number' && s.days_since >= 7)
      ? 'text-quiz-red border-quiz-red/40 bg-quiz-red/10'
      : 'text-quiz-orange border-quiz-orange/40 bg-quiz-orange/10'
  return (
    <div
      onClick={onPick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick && onPick() } }}
      className="rounded-xl border border-quiz-border bg-black/5 px-3 py-2 flex items-center gap-3 cursor-pointer hover:bg-black/10 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <div className="font-black text-sm truncate">{s.name}</div>
        <div className="text-[11px] text-quiz-muted font-bold mt-0.5 truncate">
          {s.email || '—'}
          {s.recent_attempts > 0 && (
            <> · {s.recent_attempts} attempts (14d) · avg {fmtPct(s.recent_avg_pct)}</>
          )}
        </div>
      </div>
      <span
        className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${tone}`}
      >
        {dayLabel}
      </span>
      <span aria-hidden="true" className="shrink-0 text-quiz-muted text-base leading-none">›</span>
    </div>
  )
}
