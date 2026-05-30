import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'
import Modal from './ui/Modal'
import SectionLabel from './ui/SectionLabel'
import Avatar from './ui/Avatar'
import { Stagger, StaggerItem } from './ui/Motion'
import { ease } from '../motion'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Display order + labels for each slot section.
const SLOT_ORDER = [
  { id: 'hat',       label: 'Hats',           icon: '🎩' },
  { id: 'glasses',   label: 'Glasses',        icon: '👓' },
  { id: 'hands',     label: 'Hands',          icon: '🤚' },
  { id: 'legs',      label: 'Legs',           icon: '🦶' },
  { id: 'accessory', label: 'Accessories',    icon: '⭐' },
  { id: 'frame',     label: 'Avatar Frames',  icon: '🟡' },
]

// Rarity tiers — drives the colored badge on each card AND sort order
// within each slot (common first, legendary last). The colors map to the
// existing quiz-* tailwind palette so it inherits the rest of the theme.
const RARITY = {
  common:    { label: 'Common',    rank: 0, badge: 'bg-white/10  text-white/80   border-white/30',           ring: '' },
  rare:      { label: 'Rare',      rank: 1, badge: 'bg-quiz-blue/20   text-quiz-blue   border-quiz-blue/50',   ring: 'shadow-[0_0_18px_rgba(96,165,250,0.25)]' },
  epic:      { label: 'Epic',      rank: 2, badge: 'bg-quiz-purple/20 text-quiz-purple border-quiz-purple/50', ring: 'shadow-[0_0_22px_rgba(167,139,250,0.35)]' },
  legendary: { label: 'Legendary', rank: 3, badge: 'bg-quiz-yellow/20 text-quiz-yellow border-quiz-yellow/50', ring: 'shadow-[0_0_28px_rgba(253,224,71,0.45)]' },
}
const rarityOf = (item) => RARITY[item?.rarity] || RARITY.common

/**
 * ShopPage — wearables shop.
 *   • Buy items with 💎
 *   • Once owned, Equip/Unequip toggles which item fills each slot
 *   • Equipped wearables show on the user's pfp everywhere (top nav,
 *     home, profile, leaderboard) via the <Avatar> primitive
 */
export default function ShopPage({ authToken, gems, onGemsChange, user, onUserUpdate }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [catalogue, setCatalogue] = useState([])
  const [owned, setOwned] = useState([])
  const [equipped, setEquipped] = useState({ hat: null, glasses: null, hands: null, legs: null, accessory: null, frame: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)
  const [pendingBuy, setPendingBuy] = useState(null)
  // Account-age lock — brand-new users see the catalogue but can't redeem
  // until they've been around for the backend's MIN_ACCOUNT_AGE_DAYS.
  const [unlocked, setUnlocked] = useState(true)
  const [daysLeft, setDaysLeft] = useState(0)
  const [minDays, setMinDays]   = useState(7)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/shop`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load shop')
      const d = await res.json()
      setCatalogue(d.catalogue || [])
      setOwned(d.owned || [])
      setEquipped(d.equipped || { hat: null, glasses: null, hands: null, legs: null, accessory: null, frame: null })
      if (typeof d.gems === 'number' && onGemsChange) onGemsChange(d.gems)
      // Default to unlocked so old backends (no shop_unlocked field) keep
      // working; only flip to locked when the backend explicitly says so.
      setUnlocked(d.shop_unlocked !== false)
      setDaysLeft(Number(d.days_until_unlock) || 0)
      setMinDays(Number(d.min_account_age_days) || 7)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token])  // eslint-disable-line react-hooks/exhaustive-deps

  // Group catalogue by slot then sort each group by rarity rank (common
  // → legendary) so cheaper starter items are visually closer to the top
  // of each section. Memoised so re-renders don't reshape.
  const bySlot = useMemo(() => {
    const groups = { hat: [], glasses: [], hands: [], legs: [], accessory: [], frame: [] }
    for (const item of catalogue) {
      if (groups[item.slot]) groups[item.slot].push(item)
    }
    for (const k of Object.keys(groups)) {
      groups[k].sort((a, b) => rarityOf(a).rank - rarityOf(b).rank || a.cost - b.cost)
    }
    return groups
  }, [catalogue])

  const performBuy = async (item) => {
    if (busyId) return
    setBusyId(item.id); setError(null); setToast(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/shop/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reward_id: item.id }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || 'Purchase failed')
      setOwned((prev) => [item.id, ...prev])
      if (onGemsChange) onGemsChange(d.gems_total)
      setToast({ text: `🎉 Unlocked ${item.name}! Tap Equip to wear it.` })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const toggleEquip = async (item) => {
    if (busyId) return
    const slot = item.slot
    const isEquipped = equipped[slot] === item.id
    setBusyId(item.id); setError(null); setToast(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/shop/equip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reward_id: isEquipped ? null : item.id, slot }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || 'Equip failed')
      const next = d.equipped || { ...equipped, [slot]: isEquipped ? null : item.id }
      setEquipped(next)
      // Propagate equipped state up so Layout/HomePage/etc. re-render the avatar.
      if (onUserUpdate && user) onUserUpdate({ ...user, equipped: next })
      setToast({ text: isEquipped ? `Unequipped ${item.name}.` : `Now wearing ${item.name}!` })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const Header = () => (
    <header className="flex items-center justify-between mb-4">
      <div>
        <SectionLabel>Wearables Shop</SectionLabel>
        <h1 className="!text-2xl !font-black tracking-tight">Dress up 💎</h1>
      </div>
      <motion.span
        className="flex items-center gap-1 px-3 py-2 rounded-2xl text-base font-black
                   bg-quiz-cyan/15 border border-quiz-cyan/40 text-quiz-cyan shadow-lg"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={ease.bouncy}
      >
        💎 {gems ?? 0}
      </motion.span>
    </header>
  )

  if (loading) return (
    <Screen width="default"><Header />
      <Card variant="solid" className="!p-8 text-center text-quiz-muted">Loading wearables…</Card>
    </Screen>
  )

  if (error && catalogue.length === 0) return (
    <Screen width="default"><Header />
      <Card variant="solid" className="!p-6 border-2 border-quiz-red/50 bg-quiz-red/10 text-quiz-red font-bold">{error}</Card>
    </Screen>
  )

  const userInitial = (user?.name || '?').trim().charAt(0).toUpperCase()

  return (
    <Screen width="default">
      <Header />

      {/* Live avatar preview — shows the user's pfp with currently-equipped wearables */}
      <Card variant="solid" className="!p-4 mb-3 flex items-center gap-4">
        <Avatar
          src={user?.avatar_url}
          initials={userInitial}
          size="xl"
          equipped={equipped}
        />
        <div className="min-w-0">
          <SectionLabel>Your look</SectionLabel>
          <div className="text-sm font-black mt-0.5">
            {Object.values(equipped).filter(Boolean).length === 0
              ? 'Nothing equipped yet'
              : `${Object.values(equipped).filter(Boolean).length} items equipped`}
          </div>
          <div className="text-[10px] font-bold text-quiz-muted mt-0.5 leading-tight">
            Visible on leaderboard + home + profile
          </div>
        </div>
      </Card>

      {/* Lock-screen card — shown when account is younger than the
          MIN_ACCOUNT_AGE_DAYS gate. Users can browse the catalogue and
          window-shop, but every Buy button stays disabled until the
          countdown reaches zero. */}
      {!unlocked && (
        <Card variant="solid" className="!p-4 mb-3 border-2 border-quiz-yellow/50
                                         bg-gradient-to-br from-quiz-yellow/10 to-quiz-orange/10
                                         text-center">
          <div className="text-4xl mb-1">🔒</div>
          <div className="text-sm font-black text-quiz-yellow uppercase tracking-widest">Shop locked</div>
          <div className="text-xl font-black mt-1">
            Unlocks in {daysLeft} day{daysLeft === 1 ? '' : 's'}
          </div>
          <p className="text-[11px] font-bold text-quiz-muted mt-2 leading-relaxed">
            Spend your first {minDays} days building the habit — practice daily,
            earn 💎, and the shop opens automatically. Browse below to see
            what you're working toward.
          </p>
        </Card>
      )}

      {/* Earn-rate banner — kept as a "how to earn" reference, especially
          useful while the shop is locked and gems are accumulating. */}
      <Card variant="solid" className="!p-3 mb-3 border-2 border-quiz-blue/30 bg-quiz-blue/10">
        <p className="text-xs font-bold text-quiz-blue leading-relaxed">
          💡 Earn <strong>2 💎</strong> per correct answer, <strong>5 💎</strong> per quiz,
          and <strong>50 💎</strong> on a rank-up.
        </p>
      </Card>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={ease.spring}
        >
          <Card variant="solid" className="!p-3 mb-3 border-2 border-quiz-green/50 bg-quiz-green/10">
            <p className="text-xs font-bold text-quiz-green">{toast.text}</p>
          </Card>
        </motion.div>
      )}
      {error && (
        <Card variant="solid" className="!p-3 mb-3 border-2 border-quiz-red/50 bg-quiz-red/10">
          <p className="text-xs font-bold text-quiz-red">{error}</p>
        </Card>
      )}

      {/* Sections per slot */}
      <Stagger delay={0.04} step={0.05}>
        {SLOT_ORDER.map(({ id: slotId, label, icon }) => {
          const items = bySlot[slotId] || []
          if (items.length === 0) return null
          const slotEquipped = equipped[slotId]
          return (
            <StaggerItem key={slotId}>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  <SectionLabel>{label}</SectionLabel>
                </div>
                {slotEquipped && (
                  <button
                    type="button"
                    onClick={() => {
                      const item = items.find((it) => it.id === slotEquipped)
                      if (item) toggleEquip(item)
                    }}
                    className="text-[10px] font-black uppercase tracking-wider text-quiz-muted hover:text-quiz-red transition-colors"
                  >
                    Unequip
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {items.map((item) => {
                  const isOwned = owned.includes(item.id)
                  const isEquipped = slotEquipped === item.id
                  const affordable = (gems ?? 0) >= item.cost
                  const r = rarityOf(item)
                  // Lock state suppresses Buy entirely. Equipping owned
                  // items is still allowed — already paid for, nothing to
                  // gate.
                  const canBuy = unlocked && affordable && !isOwned
                  const variant = isEquipped
                    ? 'green'
                    : isOwned
                      ? 'purple'
                      : canBuy ? 'blue' : 'red'
                  const buyLabel = !unlocked
                    ? `🔒 ${item.cost}`
                    : `💎 ${item.cost}`

                  return (
                    <Card
                      key={item.id}
                      variant="solid"
                      interactive={isOwned || canBuy}
                      className={'!p-3 text-center flex flex-col h-full relative overflow-hidden ' + r.ring}
                    >
                      {!isOwned && (
                        <div
                          className={'absolute inset-0 bg-gradient-to-br opacity-15 ' +
                            (canBuy ? 'from-quiz-blue to-quiz-cyan' : 'from-quiz-red to-quiz-orange')}
                          aria-hidden
                        />
                      )}
                      {/* Rarity badge — top-left corner of every tile.
                          Color-coded by tier so Common/Rare/Epic/Legendary
                          are scannable at a glance. */}
                      <div className={
                        'absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md border ' +
                        'text-[9px] font-black uppercase tracking-wider leading-none ' +
                        r.badge
                      }>
                        {r.label}
                      </div>
                      <div className="relative flex-1 flex flex-col pt-3">
                        <div className="text-4xl mb-1.5 leading-none">{item.emoji}</div>
                        <div className="font-black text-sm leading-tight mb-1">{item.name}</div>
                        <div className="text-[10px] font-bold text-quiz-muted leading-tight mb-2 flex-1">
                          {item.desc}
                        </div>
                        <Button3d
                          variant={variant}
                          size="sm"
                          full
                          disabled={(!isOwned && !canBuy) || busyId === item.id}
                          loading={busyId === item.id}
                          loadingLabel="…"
                          title={!unlocked && !isOwned ? `Shop unlocks in ${daysLeft} day${daysLeft === 1 ? '' : 's'}` : ''}
                          onClick={() => isOwned ? toggleEquip(item) : setPendingBuy(item)}
                        >
                          {isEquipped
                            ? '✓ Equipped'
                            : isOwned
                              ? '👕 Equip'
                              : buyLabel}
                        </Button3d>
                      </div>
                      {isOwned && !isEquipped && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-quiz-purple border-2 border-[#1a1a35] flex items-center justify-center text-[10px] text-white font-black">★</div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </StaggerItem>
          )
        })}
      </Stagger>

      {/* Buy confirmation */}
      <Modal
        open={pendingBuy !== null}
        onClose={() => setPendingBuy(null)}
        onConfirm={() => pendingBuy && performBuy(pendingBuy)}
        title={pendingBuy ? `Buy ${pendingBuy.name}?` : ''}
        body={
          pendingBuy
            ? `Spend ${pendingBuy.cost} 💎 to unlock ${pendingBuy.emoji} ${pendingBuy.name}.\n\n` +
              `Your balance after: ${Math.max(0, (gems ?? 0) - pendingBuy.cost)} 💎`
            : ''
        }
        confirmLabel="Buy"
        cancelLabel="Cancel"
        tone="purple"
      />
    </Screen>
  )
}
