import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'
import CountUp from './ui/CountUp'
import SectionLabel from './ui/SectionLabel'
import { Stagger, StaggerItem } from './ui/Motion'
import { ease } from '../motion'

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

// Accuracy colour band — green strong · yellow ok · red weak.
const accColor = (p) => (p >= 80 ? 'text-quiz-green' : p >= 50 ? 'text-quiz-yellow' : 'text-quiz-red')

// Settings / Profile — QuizQuest renderProfile pattern.
// Centered hero (avatar + name + rank), 3-stat grid (Streak / Longest / Accuracy),
// compact profile editor, logout. Same layout / same features as before — every
// section now staggers in, the avatar springs on tap, the rank pill bounces in,
// and the stat numbers count up from zero on first paint.
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
      <Stagger delay={0.04} step={0.08}>
        {/* ===== Hero ===== */}
        <StaggerItem>
          <div className="flex flex-col items-center text-center pt-2 pb-5">
            {/* Avatar — same big circle, same camera-icon overlay. Now responds
                to tap (squish) and hover (scale up) via Framer Motion. */}
            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group mb-3"
              title="Change photo"
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.03 }}
              transition={ease.spring}
            >
              <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-quiz-blue to-quiz-purple
                              ring-4 ring-quiz-border-bright shadow-2xl
                              flex items-center justify-center text-5xl font-black text-white">
                {avatarUrl
                  ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  : initials}
              </div>
              <motion.div
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-quiz-blue border-4 border-[#0a0a1f]
                           flex items-center justify-center text-sm shadow-lg"
                whileHover={{ scale: 1.15, rotate: -5 }}
                transition={ease.squish}
              >
                📷
              </motion.div>
            </motion.button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

            <div className="text-2xl font-black">{name || 'Student'}</div>
            {rank && (
              <motion.div
                className="flex items-center gap-2 mt-1 px-3 py-1 rounded-full
                           bg-gradient-to-r from-quiz-blue/20 to-quiz-purple/20
                           border border-quiz-blue/40 text-quiz-blue font-black shadow-glow"
                initial={{ opacity: 0, scale: 0.7, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ ...ease.bouncy, delay: 0.25 }}
              >
                <span className="text-lg">{rank.tier_icon}</span>
                <span>{rank.tier_name}</span>
              </motion.div>
            )}
            {rank?.tier_desc && (
              <p className="text-xs text-quiz-muted leading-relaxed mt-2 max-w-md">{rank.tier_desc}</p>
            )}
          </div>
        </StaggerItem>

        {/* ===== 3-stat grid — same 3 cards, same labels, same positions ===== */}
        <StaggerItem>
          <div className="grid grid-cols-3 gap-2 mb-5">
            <Card variant="solid" className="!p-3 text-center">
              <SectionLabel>Streak</SectionLabel>
              <div className="text-2xl font-black mt-1 text-quiz-orange">
                🔥 <CountUp value={currentStreak} />
              </div>
            </Card>
            <Card variant="solid" className="!p-3 text-center">
              <SectionLabel>Longest</SectionLabel>
              <div className="text-2xl font-black mt-1 text-quiz-yellow">
                🏆 <CountUp value={longestStreak} />
              </div>
            </Card>
            <Card variant="solid" className="!p-3 text-center">
              <SectionLabel>Accuracy</SectionLabel>
              <div className={'text-2xl font-black mt-1 ' + accColor(overallAccuracy)}>
                🎯 <CountUp value={overallAccuracy} />%
              </div>
            </Card>
          </div>
        </StaggerItem>

        {/* ===== Profile editor (compact) ===== */}
        <StaggerItem>
          <Card variant="solid" className="!p-5 mb-4 space-y-4">
            <SectionLabel>Edit Profile</SectionLabel>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={ease.spring}
                className="rounded-2xl border-2 border-quiz-red/50 bg-quiz-red/15 text-quiz-red px-4 py-3 text-sm font-bold"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={ease.spring}
                className="rounded-2xl border-2 border-quiz-green/50 bg-quiz-green/15 text-quiz-green px-4 py-3 text-sm font-bold"
              >
                {success}
              </motion.div>
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
              disabled={!dirty && !saving}
              loading={saving}
              loadingLabel="Saving…"
              onClick={handleSave}
            >
              {dirty ? '💾 Save changes' : '✓ Saved'}
            </Button3d>
          </Card>
        </StaggerItem>

        {/* ===== Logout ===== */}
        <StaggerItem>
          <Button3d variant="red" size="md" full onClick={(e) => { e.preventDefault(); onLogout && onLogout() }}>
            🚪 Logout
          </Button3d>
        </StaggerItem>
      </Stagger>
    </Screen>
  )
}
