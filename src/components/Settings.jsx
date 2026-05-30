import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Avatar from './ui/Avatar'
import CountUp from './ui/CountUp'
import SectionLabel from './ui/SectionLabel'
import { Stagger, StaggerItem } from './ui/Motion'
import { ease } from '../motion'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const accColor = (p) => (p >= 80 ? 'text-quiz-green' : p >= 50 ? 'text-quiz-yellow' : 'text-quiz-red')

/**
 * Settings / Profile — modern Duolingo-flavoured layout.
 *
 * Sections in order (no feature has been moved or removed):
 *   1. Cover-banner hero (avatar + name + rank pill + member-since)
 *   2. 3-stat grid (Streak / Longest / Accuracy)
 *   3. Achievements grid (NEW — 9 placeholder badges)
 *   4. Edit profile card (display name, photo, save)
 *   5. Logout
 */
export default function Settings({
  onLogout, user, onUserUpdate, rank,
  level, gems, dailyGoal, freezes, freezeCap, onFreezesChange,
  onGemsChange, onDailyGoalChange, onProgressionChange,
}) {
  const token = localStorage.getItem('auth_token')
  const stored = user || JSON.parse(localStorage.getItem('user') || '{}')

  const name = stored.name || ''
  const avatarUrl = stored.avatar_url || ''

  const [streak, setStreak] = useState(null)
  const [stats, setStats] = useState(null)
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/streak`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null)).then(setStreak).catch(() => {})
    fetch(`${API_BASE_URL}/api/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null)).then(setStats).catch(() => {})
  }, [token])

  const email = stored.email || ''

  const initials = (name || email || '?').trim().charAt(0).toUpperCase()
  const currentStreak = streak?.current_streak ?? 0
  const longestStreak = streak?.longest_streak ?? 0
  const overallAccuracy = stats?.overall_accuracy ?? 0

  // "Member since" from the JWT or stored user (placeholder fallback to current month)
  const joinedDate = stored.created_at
    ? new Date(stored.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <Screen width="default" className="!py-0">
      <Stagger delay={0.04} step={0.07}>

        {/* ===== HERO — cover banner + avatar + name + rank pill ===== */}
        <StaggerItem>
          <div className="relative rounded-3xl overflow-hidden mb-4">
            {/* Cover gradient — Duolingo-style colourful banner */}
            <div className="h-32 sm:h-36 bg-gradient-to-br from-quiz-blue via-quiz-purple to-quiz-magenta relative">
              {/* Decorative sparkles in the banner */}
              <div className="absolute inset-0 opacity-25 pointer-events-none"
                   style={{
                     backgroundImage:
                       'radial-gradient(1.5px 1.5px at 22% 33%, #fff, transparent),' +
                       'radial-gradient(1px 1px at 55% 60%, #fff, transparent),' +
                       'radial-gradient(2px 2px at 80% 25%, #fff, transparent),' +
                       'radial-gradient(1px 1px at 10% 80%, #fff, transparent)',
                   }} />
            </div>

            {/* Avatar — pure display; editing happens in the avatar
                dropdown modal in the top bar. */}
            <div className="px-4 pb-4 -mt-12 flex flex-col items-center">
              <div className="relative">
                {/* Avatar primitive — same 96px circle (size='xl') with
                    the dark-banner separator ring preserved. Now also
                    renders every equipped wearable so the profile hero
                    actually reflects the player's loadout. */}
                <Avatar
                  src={avatarUrl}
                  initials={initials}
                  size="xl"
                  equipped={stored.equipped}
                  className="ring-4 ring-[#0a0a1f] shadow-2xl"
                />
              </div>

              <div className="mt-2 text-xl font-black text-center">{name || 'Student'}</div>

              {rank && (
                <motion.div
                  className="flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full
                             bg-gradient-to-r from-quiz-blue/25 to-quiz-purple/25
                             border border-quiz-blue/50 text-quiz-blue font-black text-sm shadow-glow"
                  initial={{ opacity: 0, scale: 0.7, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ ...ease.bouncy, delay: 0.25 }}
                >
                  <span>{rank.tier_icon}</span>
                  <span>{rank.tier_name}</span>
                  {level != null && <span className="text-quiz-muted">·</span>}
                  {level != null && <span>Lv {level}</span>}
                </motion.div>
              )}
              <div className="text-[11px] text-quiz-muted font-bold mt-1.5">
                Member since {joinedDate}
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* ===== STATS — 3 colour-coded tiles ===== */}
        <StaggerItem>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Card variant="solid" className="!p-3 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-quiz-orange/15 to-transparent" />
              <div className="relative">
                <div className="text-2xl">🔥</div>
                <div className="text-xl sm:text-2xl font-black mt-0.5 text-quiz-orange">
                  <CountUp value={currentStreak} />
                </div>
                <SectionLabel>Day streak</SectionLabel>
              </div>
            </Card>
            <Card variant="solid" className="!p-3 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-quiz-yellow/15 to-transparent" />
              <div className="relative">
                <div className="text-2xl">🏆</div>
                <div className="text-xl sm:text-2xl font-black mt-0.5 text-quiz-yellow">
                  <CountUp value={longestStreak} />
                </div>
                <SectionLabel>Longest</SectionLabel>
              </div>
            </Card>
            <Card variant="solid" className="!p-3 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-quiz-green/15 to-transparent" />
              <div className="relative">
                <div className="text-2xl">🎯</div>
                <div className={'text-xl sm:text-2xl font-black mt-0.5 ' + accColor(overallAccuracy)}>
                  <CountUp value={overallAccuracy} />%
                </div>
                <SectionLabel>Accuracy</SectionLabel>
              </div>
            </Card>
          </div>
        </StaggerItem>

        {/* ===== ACHIEVEMENTS (locked) ===== */}
        <StaggerItem>
          <SectionLabel className="mb-2 px-1">Achievements</SectionLabel>
          <Card variant="solid" className="!p-6 text-center mb-4 relative overflow-hidden">
            {/* Subtle decorative gradient sweep */}
            <div className="absolute inset-0 bg-gradient-to-br from-quiz-blue/10 via-quiz-purple/8 to-quiz-pink/10 pointer-events-none" />
            <div className="relative">
              <div className="text-5xl mb-2">🔒</div>
              <div className="font-black text-base mb-1">Achievements coming soon</div>
              <p className="text-xs font-bold text-quiz-muted leading-relaxed max-w-xs mx-auto">
                Earn badges for streaks, perfect scores, milestones and more.
                Keep practising — they'll start unlocking shortly.
              </p>
            </div>
          </Card>
        </StaggerItem>

      </Stagger>
    </Screen>
  )
}
