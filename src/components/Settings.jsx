import React, { useEffect, useRef, useState } from 'react'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'
import StreakTestPanel from './StreakTestPanel'
import ProgressionTestPanel from './ProgressionTestPanel'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function resizeImageToDataUrl(file, size = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the image file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not a valid image'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size; canvas.height = size
        const ctx = canvas.getContext('2d')
        const min = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// Settings / Profile — QuizQuest renderProfile pattern.
// Centered hero (avatar + name + rank), 3-stat grid (Streak / Longest / Accuracy),
// compact profile editor, logout.
export default function Settings({
  onLogout, user, onUserUpdate, rank,
  level, gems, dailyGoal, freezes, freezeCap, onFreezesChange,
  onGemsChange, onDailyGoalChange, onProgressionChange,
}) {
  const token = localStorage.getItem('auth_token')
  const stored = user || JSON.parse(localStorage.getItem('user') || '{}')

  const [name, setName] = useState(stored.name || '')
  const [avatarUrl, setAvatarUrl] = useState(stored.avatar_url || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const fileInputRef = useRef(null)

  // Live stats for the 3-stat grid
  const [streak, setStreak] = useState(null)
  const [stats, setStats] = useState(null)
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/streak`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null)).then(setStreak).catch(() => {})
    fetch(`${API_BASE_URL}/api/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null)).then(setStats).catch(() => {})
  }, [token])

  const email = stored.email || ''
  const dirty = name.trim() !== (stored.name || '') || avatarUrl !== (stored.avatar_url || '')

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setError(null); setSuccess(null)
    if (!file.type.startsWith('image/')) { setError('Please choose an image file'); return }
    if (file.size > 8 * 1024 * 1024)     { setError('That image is too large (max 8MB)'); return }
    try { setAvatarUrl(await resizeImageToDataUrl(file)) }
    catch (err) { setError(err.message || 'Could not process that image') }
    e.target.value = ''
  }

  const handleSave = async () => {
    setError(null); setSuccess(null)
    if (!name.trim()) { setError('Display name cannot be empty'); return }
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), avatar_url: avatarUrl || '' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to save profile')
      localStorage.setItem('user', JSON.stringify(data.user))
      if (onUserUpdate) onUserUpdate(data.user)
      setSuccess('Profile updated!')
    } catch (err) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const initials = (name || email || '?').trim().charAt(0).toUpperCase()
  const currentStreak = streak?.current_streak ?? 0
  const longestStreak = streak?.longest_streak ?? 0
  const overallAccuracy = stats?.overall_accuracy ?? 0

  const inputCls =
    'w-full rounded-2xl bg-[#1a1a35] border-2 border-quiz-border px-4 py-3 text-base ' +
    'text-quiz-text placeholder:text-quiz-muted focus:outline-none focus:border-quiz-blue ' +
    'focus:ring-2 focus:ring-quiz-blue/40 transition-colors disabled:opacity-60'

  return (
    <Screen width="default">
      {/* ===== Hero ===== */}
      <div className="flex flex-col items-center text-center pt-2 pb-5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative group mb-3"
          title="Change photo"
        >
          <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-quiz-blue to-quiz-purple
                          ring-4 ring-quiz-border-bright shadow-2xl
                          flex items-center justify-center text-5xl font-black text-white">
            {avatarUrl
              ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-quiz-blue border-4 border-[#0a0a1f]
                          flex items-center justify-center text-sm shadow-lg group-hover:scale-110 transition-transform">
            📷
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

        <div className="text-2xl font-black">{name || 'Student'}</div>
        {rank && (
          <div className="flex items-center gap-2 mt-1 px-3 py-1 rounded-full
                          bg-gradient-to-r from-quiz-blue/20 to-quiz-purple/20
                          border border-quiz-blue/40 text-quiz-blue font-black">
            <span className="text-lg">{rank.tier_icon}</span>
            <span>{rank.tier_name}</span>
          </div>
        )}
        {rank?.tier_desc && (
          <p className="text-xs text-quiz-muted leading-relaxed mt-2 max-w-md">{rank.tier_desc}</p>
        )}
      </div>

      {/* ===== 3-stat grid ===== */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <Card variant="solid" className="!p-3 text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">Streak</div>
          <div className="text-2xl font-black mt-1">🔥 {currentStreak}</div>
        </Card>
        <Card variant="solid" className="!p-3 text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">Longest</div>
          <div className="text-2xl font-black mt-1">🏆 {longestStreak}</div>
        </Card>
        <Card variant="solid" className="!p-3 text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">Accuracy</div>
          <div className="text-2xl font-black mt-1">🎯 {overallAccuracy}%</div>
        </Card>
      </div>

      {/* ===== Profile editor (compact) ===== */}
      <Card variant="solid" className="!p-5 mb-4 space-y-4">
        <div className="text-xs font-black uppercase tracking-widest text-quiz-muted">Edit Profile</div>

        {error && (
          <div className="rounded-2xl border-2 border-quiz-red/50 bg-quiz-red/15 text-quiz-red px-4 py-3 text-sm font-bold">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-2xl border-2 border-quiz-green/50 bg-quiz-green/15 text-quiz-green px-4 py-3 text-sm font-bold">
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-quiz-muted mb-1.5">Display Name</label>
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Your name" maxLength={120} className={inputCls}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button3d size="sm" variant="blue" onClick={() => fileInputRef.current?.click()}>
            {avatarUrl ? '🖼️ Change photo' : '📷 Upload photo'}
          </Button3d>
          {avatarUrl && (
            <Button3d size="sm" variant="red" onClick={() => setAvatarUrl('')}>
              Remove photo
            </Button3d>
          )}
        </div>

        <Button3d
          variant={dirty ? 'green' : 'white'}
          size="md"
          full
          disabled={saving || !dirty}
          onClick={handleSave}
        >
          {saving ? 'Saving…' : dirty ? '💾 Save changes' : '✓ Saved'}
        </Button3d>
      </Card>

      {/* ===== StarQuest — daily goal + freeze shop ===== */}
      <StarQuestPanel
        token={token}
        gems={gems}
        dailyGoal={dailyGoal}
        freezes={freezes}
        freezeCap={freezeCap}
        onFreezesChange={onFreezesChange}
        onGemsChange={onGemsChange}
        onDailyGoalChange={onDailyGoalChange}
      />

      {/* ===== Dev Tools — rank/XP/gems tester ===== */}
      <ProgressionTestPanel
        authToken={token}
        onGemsChange={onGemsChange}
        onProgressionChange={onProgressionChange}
      />

      {/* ===== Dev Tools — temporary streak tester ===== */}
      <StreakTestPanel authToken={token} />

      {/* ===== Logout ===== */}
      <Button3d variant="red" size="md" full onClick={(e) => { e.preventDefault(); onLogout && onLogout() }}>
        🚪 Logout
      </Button3d>
    </Screen>
  )
}


// StarQuestPanel — daily-goal picker + buy-streak-freeze button.
// Reads gems / dailyGoal from props (controlled by App). Saves via API and
// notifies parent via onGemsChange / onDailyGoalChange so the navbar reflects
// the new totals instantly without a refetch round-trip.
function StarQuestPanel({ token, gems, dailyGoal, freezes, freezeCap, onFreezesChange, onGemsChange, onDailyGoalChange }) {
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [success, setSuccess] = React.useState(null)
  const FREEZE_COST = 30

  const setGoal = async (goal) => {
    if (goal === dailyGoal) return
    setBusy(true); setError(null); setSuccess(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile/daily-goal`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ goal }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || 'Failed to save')
      if (onDailyGoalChange) onDailyGoalChange(d.daily_goal)
      setSuccess(`Daily goal set to ${d.daily_goal}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const buyFreeze = async () => {
    setBusy(true); setError(null); setSuccess(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/freeze/purchase`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || 'Purchase failed')
      if (onGemsChange) onGemsChange(d.gems_total)
      if (onFreezesChange) onFreezesChange(d.freezes_available)
      setSuccess(`Bought a freeze! ${d.freezes_available}/${d.freeze_cap} held.`)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const canAfford = (gems ?? 0) >= FREEZE_COST
  const opts = [10, 15, 20]

  return (
    <Card variant="solid" className="!p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="!text-lg !font-black">⭐ StarQuest</h2>
        <span className="text-xs font-bold text-quiz-cyan">💎 {gems ?? 0}</span>
      </div>

      {/* Daily goal picker */}
      <div className="mb-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted mb-2">
          Daily goal
        </div>
        <div className="grid grid-cols-3 gap-2">
          {opts.map((n) => {
            const active = n === dailyGoal
            return (
              <button
                key={n}
                disabled={busy}
                onClick={() => setGoal(n)}
                className={[
                  'py-2.5 rounded-xl text-sm font-black border-2 transition-all',
                  active
                    ? 'bg-gradient-to-r from-quiz-blue/30 to-quiz-purple/30 border-quiz-blue text-white'
                    : 'bg-white/5 border-quiz-border text-quiz-muted hover:text-white',
                ].join(' ')}
              >
                {n} Qs
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-quiz-muted mt-2 leading-relaxed">
          Cumulative correct answers needed each day to keep your streak.
        </p>
      </div>

      {/* Buy streak freeze */}
      <div className="border-t border-quiz-border/60 pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">
            Streak shop
          </div>
          <div className="text-[10px] font-black text-quiz-blue">
            🧊 {freezes ?? 0} / {freezeCap ?? 2} held
          </div>
        </div>
        <Button3d
          variant="blue"
          size="md"
          full
          disabled={busy || !canAfford}
          onClick={buyFreeze}
        >
          🧊 Buy Streak Freeze ({FREEZE_COST} 💎)
        </Button3d>
        <p className="text-[11px] text-quiz-muted mt-2 leading-relaxed">
          Auto-fires to bridge one missed day. Cap of 2 held at once.
        </p>
      </div>

      {error && (
        <div className="mt-3 rounded-2xl border-2 border-quiz-red/50 bg-quiz-red/15 text-quiz-red px-3 py-2 text-xs font-bold">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 rounded-2xl border-2 border-quiz-green/50 bg-quiz-green/15 text-quiz-green px-3 py-2 text-xs font-bold">
          {success}
        </div>
      )}
    </Card>
  )
}
