import React, { useState } from 'react'
import Card from './ui/Card'
import Button3d from './ui/Button3d'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// TEMPORARY dev-tools panel — exercises the StarQuest XP / Rank / Gems pipeline.
// Lives in Profile alongside StreakTestPanel; remove this file + the import in
// Settings.jsx + the 3 /api/test/* endpoints in quiz_backend.py before launch.
export default function ProgressionTestPanel({ authToken, onGemsChange, onProgressionChange }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [state, setState] = useState(null)         // {xp, level, rank, gems}
  const [log, setLog] = useState([])
  const [celebration, setCelebration] = useState(null)

  const remember = (entry) => setLog((prev) => [
    { when: new Date().toLocaleTimeString(), ...entry }, ...prev,
  ].slice(0, 20))

  const grantXp = async (amount) => {
    setBusy(true); setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/test/xp-grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || 'xp-grant failed')
      setState((s) => ({ ...(s || {}), ...d.progression, gems: s?.gems ?? null }))
      if (onProgressionChange) onProgressionChange(d.progression)
      remember({
        msg: `${amount >= 0 ? '+' : ''}${amount} XP → ${d.xp_total} (${d.new_rank?.name})` +
             (d.rank_up ? ' 🎉 RANK UP' : d.rank_down ? ' ⬇️ rank down' : ''),
      })
      if (d.rank_up) setCelebration(d.new_rank)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const grantGems = async (amount) => {
    setBusy(true); setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/test/gems-grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || 'gems-grant failed')
      setState((s) => ({ ...(s || {}), gems: d.gems_total }))
      if (onGemsChange) onGemsChange(d.gems_total)
      remember({ msg: `${amount >= 0 ? '+' : ''}${amount} 💎 → ${d.gems_total}` })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const resetAll = async () => {
    if (!window.confirm('Reset XP and gems to 0? (Streaks + rewards are NOT touched.)')) return
    setBusy(true); setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/test/progression-reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || 'reset failed')
      setState({ ...d.progression, gems: 0 })
      if (onGemsChange) onGemsChange(0)
      if (onProgressionChange) onProgressionChange(d.progression)
      setCelebration(null)
      remember({ msg: '🧹 Reset: xp=0, gems=0' })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  // XP jumps tuned to the StarQuest §03 tier thresholds.
  const xpJumps = [
    { amount: 50,   label: '+50 XP',      hint: '1 level' },
    { amount: 200,  label: '+200 → Pilot',     hint: 'tier 2' },
    { amount: 500,  label: '+500 → Navigator', hint: 'tier 3' },
    { amount: 1200, label: '+1200 → Commander',hint: 'tier 4' },
    { amount: 2500, label: '+2500 → Captain',  hint: 'tier 5' },
    { amount: 5000, label: '+5000 → Admiral',  hint: 'tier 6' },
  ]

  return (
    <>
      {celebration && (
        <div
          onClick={() => setCelebration(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm cursor-pointer"
        >
          <Card variant="solid" className="!p-8 text-center max-w-xs animate-bounce
                                          border-4 border-quiz-yellow bg-gradient-to-br from-quiz-yellow/15 to-quiz-orange/15">
            <div className="text-[10px] font-black uppercase tracking-widest text-quiz-yellow mb-2">
              Rank up!
            </div>
            <div className="text-5xl mb-2">{celebration.icon || celebration.tier_icon}</div>
            <div className="text-2xl font-black text-quiz-yellow mb-2">{celebration.name}</div>
            <p className="text-xs text-quiz-muted">
              {celebration.next_name
                ? <>Next: {celebration.next_name} at {celebration.xp_next} XP</>
                : <>Top tier — Legend status.</>}
            </p>
            <p className="text-[10px] text-quiz-muted mt-3">Tap to dismiss</p>
          </Card>
        </div>
      )}
      <Card variant="solid" className="!p-5 mb-4 border-2 border-quiz-purple/40">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🧪</span>
          <h2 className="!text-lg !font-black">Dev Tools — Rank test</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-quiz-yellow
                           bg-quiz-yellow/15 border border-quiz-yellow/40 px-2 py-0.5 rounded-full">temporary</span>
        </div>
        <p className="text-xs text-quiz-muted mb-4">
          Grants raw XP / gems to exercise the rank, level, and gem displays. Use jumps to land exactly on a tier threshold.
        </p>

        {error && (
          <div className="rounded-2xl border-2 border-quiz-red/50 bg-quiz-red/15 text-quiz-red px-3 py-2 text-xs font-bold mb-3">
            {error}
          </div>
        )}

        {state && (
          <div className="rounded-2xl bg-white/5 border border-quiz-border p-3 mb-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted mb-1.5">Current</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <Stat label="⭐ XP"    value={state.xp}    />
              <Stat label="📈 Level" value={state.level} />
              <Stat label="🏅 Rank"  value={state.rank?.name || '—'} />
              <Stat label="💎 Gems"  value={state.gems ?? '—'} />
            </div>
          </div>
        )}

        {/* XP jump grid */}
        <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted mb-2">XP jumps</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {xpJumps.map((j) => (
            <Button3d
              key={j.amount}
              variant="purple"
              size="sm"
              disabled={busy}
              onClick={() => grantXp(j.amount)}
            >
              {j.label}
            </Button3d>
          ))}
        </div>

        {/* XP fine controls */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button3d variant="white" size="sm" disabled={busy} onClick={() => grantXp(-50)}>
            −50 XP
          </Button3d>
          <Button3d variant="white" size="sm" disabled={busy} onClick={() => grantXp(-200)}>
            −200 XP
          </Button3d>
        </div>

        {/* Gem controls */}
        <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted mb-2">Gems</div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Button3d variant="blue" size="sm" disabled={busy} onClick={() => grantGems(50)}>
            +50 💎
          </Button3d>
          <Button3d variant="blue" size="sm" disabled={busy} onClick={() => grantGems(200)}>
            +200 💎
          </Button3d>
          <Button3d variant="blue" size="sm" disabled={busy} onClick={() => grantGems(1000)}>
            +1000 💎
          </Button3d>
        </div>

        <Button3d variant="red" size="md" full disabled={busy} onClick={resetAll}>
          🧹 Reset XP + Gems
        </Button3d>

        {log.length > 0 && (
          <div className="mt-3 rounded-2xl bg-black/30 border border-quiz-border p-3 max-h-56 overflow-y-auto">
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
