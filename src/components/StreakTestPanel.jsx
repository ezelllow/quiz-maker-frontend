import React, { useState } from 'react'
import Card from './ui/Card'
import Button3d from './ui/Button3d'
import StreakCelebration from './StreakCelebration'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// TEMPORARY dev-tools panel — STATELESS. Each click asks the backend to credit
// "the day after your last_qualified" so it survives navigation/remounts.
// Tests: streak growth, 1-freeze-per-week cap, freeze regen across a 7-day gap.
// Remove this file + the import in Settings.jsx + the 2 endpoints in
// quiz_backend.py before production.
export default function StreakTestPanel({ authToken }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [state, setState] = useState(null)
  const [log, setLog] = useState([])
  const [celebration, setCelebration] = useState(null)

  const call = async (body) => {
    setBusy(true); setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/test/streak-credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ correct: 10, ...body }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || 'streak-credit failed')
      setState(d)
      const freezeNote = d.streak_awarded && d.freeze_used ? ' · 🧊 freeze used'
                      : (!d.streak_awarded && !d.passed_today) ? ' · ⚠ no freeze — streak reset'
                      : ''
      setLog((prev) => [{
        when: new Date().toLocaleTimeString(),
        msg: `${body.mode === 'freeze' ? '🧊 ' : '🔥 '}${d.simulated_day}: ${d.passed_today ? '✅ pass' : '⏳'}${d.streak_awarded ? ` · streak ${d.current_streak}` : ''}${freezeNote}`,
      }, ...prev])
      if (d.streak_awarded) setCelebration({
        streak: d.current_streak,
        longest: d.longest_streak,
        freezeUsed: d.freeze_used === true,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const resetAll = async () => {
    if (!confirm('Wipe ALL your daily_challenges + streaks rows for testing? (Does not touch quiz_attempts or rank.)')) return
    setBusy(true); setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/test/streak-reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || 'reset failed')
      setState(null); setCelebration(null)
      setLog((prev) => [{
        when: new Date().toLocaleTimeString(),
        msg: `🧹 Reset: deleted ${d.deleted_daily_rows} daily + ${d.deleted_streak_rows} streak row(s)`,
      }, ...prev])
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {celebration && (
        <StreakCelebration
          streak={celebration.streak}
          longest={celebration.longest}
          freezeUsed={celebration.freezeUsed}
          onDismiss={() => setCelebration(null)}
        />
      )}
      <Card variant="solid" className="!p-5 mb-4 border-2 border-quiz-yellow/40">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🧪</span>
          <h2 className="!text-lg !font-black">Dev Tools — Streak test</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-quiz-yellow bg-quiz-yellow/15 border border-quiz-yellow/40 px-2 py-0.5 rounded-full">temporary</span>
        </div>
        <p className="text-xs text-quiz-muted mb-4">
          Each click fast-forwards one day past your last qualified day. Stateless —
          no matter how many times you navigate away, the next click always advances.
        </p>

        {error && (
          <div className="rounded-2xl border-2 border-quiz-red/50 bg-quiz-red/15 text-quiz-red px-3 py-2 text-xs font-bold mb-3">
            {error}
          </div>
        )}

        <div className="space-y-2 mb-4">
          <Button3d variant="orange" size="lg" full disabled={busy} onClick={() => call({ mode: 'next' })}>
            🔥 +1 Streak
          </Button3d>
          <Button3d variant="blue" size="lg" full disabled={busy} onClick={() => call({ mode: 'freeze' })}>
            🧊 +1 Streak via Freeze
          </Button3d>
          <Button3d variant="red" size="md" full disabled={busy} onClick={resetAll}>
            🧹 Reset Streak
          </Button3d>
        </div>

        {state && (
          <div className="rounded-2xl bg-white/5 border border-quiz-border p-3 mb-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted mb-1.5">Current state</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <Stat label="🔥 Streak"  value={state.current_streak} />
              <Stat label="🏆 Longest" value={state.longest_streak} />
              <Stat label="🧊 Freezes" value={state.freezes_available} />
              <Stat label="✅ Last"    value={state.last_qualified_date || '—'} />
            </div>
          </div>
        )}

        {log.length > 0 && (
          <div className="rounded-2xl bg-black/30 border border-quiz-border p-3 max-h-56 overflow-y-auto">
            <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted mb-2">Log</div>
            <ul className="space-y-1.5 text-xs">
              {log.map((entry, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-quiz-muted shrink-0">{entry.when}</span>
                  <span className="text-quiz-text">{entry.msg}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-[#1a1a35] rounded-xl border border-quiz-border px-2 py-1.5">
      <div className="text-[9px] font-black uppercase tracking-widest text-quiz-muted">{label}</div>
      <div className="text-sm font-black mt-0.5 truncate">{value}</div>
    </div>
  )
}
