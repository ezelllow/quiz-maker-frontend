import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'
import Modal from './ui/Modal'
import SectionLabel from './ui/SectionLabel'
import { OUTFIT_REGISTRY } from './ui/Avatar'
import CatIcon from './ui/CatIcon'
import WearablePreview from './ui/WearablePreview'
import { Stagger, StaggerItem } from './ui/Motion'
import { assets as ASSET_CFG } from '../avatar-system'
import { ease } from '../motion'

// Every wearable's real art, keyed by id — the exact same source the equipped
// monkey renders, so shop previews always match what gets worn.
const WEARABLE_ASSETS = ASSET_CFG.wearables || {}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Shop shows acquirable cosmetics. Skin tones (free fur colours) are a
// selection, not a purchase, so they live on the Profile page, not here.
const SLOT_ORDER = [
  { id: 'outfit',    label: 'Outfits',        icon: '🧥' },
  { id: 'hat',       label: 'Hats',           icon: '🎩' },
  { id: 'glasses',   label: 'Glasses',        icon: '👓' },
  { id: 'hands',     label: 'Hands',          icon: '🤚' },
  { id: 'legs',      label: 'Legs',           icon: '🦶' },
  { id: 'accessory', label: 'Accessories',    icon: '⭐' },
  { id: 'backItem',  label: 'Capes & Wings',  icon: '🦸' },
  { id: 'frame',     label: 'Avatar Frames',  icon: '🟡' },
]

// Rarity tiers — drives the colored badge on each card AND sort order.
const RARITY = {
  common:    { label: 'Common',    rank: 0, badge: 'bg-gray-100       text-gray-600     border-gray-300',          ring: '' },
  rare:      { label: 'Rare',      rank: 1, badge: 'bg-[#3B9EFF]/15   text-[#1E70C7]    border-[#3B9EFF]/50',      ring: 'shadow-[0_0_18px_rgba(59,158,255,0.25)]' },
  epic:      { label: 'Epic',      rank: 2, badge: 'bg-[#A855F7]/15   text-[#7C3AED]    border-[#A855F7]/50',      ring: 'shadow-[0_0_22px_rgba(168,85,247,0.30)]' },
  legendary: { label: 'Legendary', rank: 3, badge: 'bg-[#F4B100]/20   text-[#A87900]    border-[#F4B100]',         ring: 'shadow-[0_0_28px_rgba(244,177,0,0.55)]' },
}
const rarityOf = (item) => RARITY[item?.rarity] || RARITY.common

/**
 * ShopPage — buy cosmetics with 💎. Equipping and skin-tone selection now
 * live on the Profile page; the shop is purely for acquiring items. Owned
 * items stay visible (marked "Owned") so the catalogue reads as a collection.
 */
export default function ShopPage({ authToken, gems, onGemsChange }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [catalogue, setCatalogue] = useState([])
  const [owned, setOwned] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)
  const [pendingBuy, setPendingBuy] = useState(null)
  // Account-age lock — brand-new users browse but can't redeem until they've
  // been around for the backend's MIN_ACCOUNT_AGE_DAYS.
  const [unlocked, setUnlocked] = useState(true)
  const [daysLeft, setDaysLeft] = useState(0)
  const [minDays, setMinDays] = useState(7)

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
      if (typeof d.gems === 'number' && onGemsChange) onGemsChange(d.gems)
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

  // Group acquirable cosmetics by slot (skins excluded — they're free,
  // selected on Profile), then sort each group by rarity then price.
  const bySlot = useMemo(() => {
    const groups = {}
    for (const s of SLOT_ORDER) groups[s.id] = []
    for (const item of catalogue) {
      if (item.slot === 'skin') continue
      if (groups[item.slot]) groups[item.slot].push(item)
    }
    for (const k of Object.keys(groups)) {
      groups[k].sort((a, b) => rarityOf(a).rank - rarityOf(b).rank || (a.cost || 0) - (b.cost || 0))
    }
    return groups
  }, [catalogue])

  const totalItems = useMemo(
    () => SLOT_ORDER.reduce((n, s) => n + (bySlot[s.id]?.length || 0), 0),
    [bySlot],
  )
  // Anything actually priced (drives the gem / lock / earn UI).
  const hasBuyables = useMemo(() => catalogue.some((it) => Number(it.cost) > 0), [catalogue])

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
      setToast({ text: `🎉 Unlocked ${item.name}! Head to Profile to equip it.` })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  // Item is in the player's collection if purchased, or it's free (cost 0).
  const isOwned = (item) => owned.includes(item.id) || Number(item.cost || 0) === 0

  const Header = () => (
    <header className="flex items-center justify-between mb-3">
      <div>
        <SectionLabel>Shop</SectionLabel>
        <h1 className="!text-2xl !font-black tracking-tight">Gear up 🛍️</h1>
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
      <Card variant="solid" className="!p-8 text-center text-quiz-muted">Loading shop…</Card>
    </Screen>
  )

  if (error && catalogue.length === 0) return (
    <Screen width="default"><Header />
      <Card variant="solid" className="!p-6 border-2 border-quiz-red/50 bg-quiz-red/10 text-quiz-red font-bold">{error}</Card>
    </Screen>
  )

  // Preview at a consistent visual size — crops to each item's content box so
  // full-canvas assets (the hoodie) aren't shrunk next to tight ones (the cap).
  const previewFor = (item) => (
    <div className="h-16 w-16 mx-auto">
      <WearablePreview id={item.id} emoji={item.emoji} />
    </div>
  )

  return (
    <Screen width="default">
      <Header />

      {/* Equip hint — customization moved to Profile. */}
      <Card variant="solid" className="!p-3 mb-3 border-2 border-quiz-green/30 bg-quiz-green/10">
        <p className="text-xs font-bold text-quiz-green leading-relaxed">
          👕 Buy items here, then head to <strong>Profile</strong> to pick your skin tone and equip your gear.
        </p>
      </Card>

      {/* Lock-screen card — account younger than MIN_ACCOUNT_AGE_DAYS. */}
      {hasBuyables && !unlocked && (
        <Card variant="solid" className="!p-4 mb-3 border-2 border-quiz-yellow/50
                                         bg-gradient-to-br from-quiz-yellow/10 to-quiz-orange/10 text-center">
          <div className="text-4xl mb-1">🔒</div>
          <div className="text-sm font-black text-quiz-yellow uppercase tracking-widest">Shop locked</div>
          <div className="text-xl font-black mt-1">Unlocks in {daysLeft} day{daysLeft === 1 ? '' : 's'}</div>
          <p className="text-[11px] font-bold text-quiz-muted mt-2 leading-relaxed">
            Spend your first {minDays} days building the habit — practice daily,
            earn 💎, and the shop opens automatically.
          </p>
        </Card>
      )}

      {/* Earn-rate banner — only relevant when there are gem purchases. */}
      {hasBuyables && (
        <Card variant="solid" className="!p-3 mb-3 border-2 border-quiz-blue/30 bg-quiz-blue/10">
          <p className="text-xs font-bold text-quiz-blue leading-relaxed">
            💡 Earn <strong>2 💎</strong> per correct answer, <strong>5 💎</strong> per quiz,
            and <strong>50 💎</strong> on a rank-up.
          </p>
        </Card>
      )}

      {toast && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={ease.spring}>
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

      {totalItems === 0 && (
        <Card variant="solid" className="!p-8 text-center mb-3">
          <div className="text-5xl mb-2">🛒</div>
          <div className="font-black text-base mb-1">New gear coming soon</div>
          <p className="text-xs font-bold text-quiz-muted leading-relaxed max-w-xs mx-auto">
            Fresh outfits and accessories are on the way. Meanwhile, set your
            skin tone and outfit over in <strong>Profile</strong>.
          </p>
        </Card>
      )}

      {/* Sections per slot — buy only. */}
      <Stagger delay={0.04} step={0.05}>
        {SLOT_ORDER.map(({ id: slotId, label, icon }) => {
          const items = bySlot[slotId] || []
          if (items.length === 0) return null
          return (
            <StaggerItem key={slotId}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <CatIcon id={slotId} color="#5DA9FF" className="w-6 h-6" />
                <SectionLabel>{label}</SectionLabel>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {items.map((item) => {
                  const ownedItem = isOwned(item)
                  const free = Number(item.cost || 0) === 0
                  const affordable = (gems ?? 0) >= item.cost
                  const r = rarityOf(item)
                  const canBuy = unlocked && affordable && !ownedItem
                  const variant = ownedItem ? 'white' : canBuy ? 'orange' : 'red'
                  const buyLabel = !unlocked ? `🔒 ${item.cost}` : `💎 ${item.cost}`

                  return (
                    <Card
                      key={item.id}
                      variant="solid"
                      interactive={canBuy}
                      className={'!p-3 text-center flex flex-col h-full relative overflow-hidden ' + r.ring}
                    >
                      {!ownedItem && (
                        <div
                          className={'absolute inset-0 bg-gradient-to-br opacity-15 ' +
                            (canBuy ? 'from-quiz-blue to-quiz-cyan' : 'from-quiz-red to-quiz-orange')}
                          aria-hidden
                        />
                      )}
                      <div className={
                        'absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md border ' +
                        'text-[9px] font-black uppercase tracking-wider leading-none ' + r.badge
                      }>
                        {r.label}
                      </div>
                      {ownedItem && (
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md border
                                        text-[9px] font-black uppercase tracking-wider leading-none
                                        bg-quiz-green/15 text-quiz-green border-quiz-green/50">
                          {free ? 'Free' : 'Owned'}
                        </div>
                      )}
                      <div className="relative flex-1 flex flex-col pt-4 justify-end">
                        <div className="flex-1 flex items-center justify-center">{previewFor(item)}</div>
                        <div className="font-black text-sm leading-tight mb-1 mt-1">{item.name}</div>
                        <div className="text-[10px] font-bold text-quiz-muted leading-tight mb-2">
                          {item.desc}
                        </div>
                        <Button3d
                          variant={variant}
                          size="sm"
                          full
                          disabled={ownedItem || !canBuy || busyId === item.id}
                          loading={busyId === item.id}
                          loadingLabel="…"
                          title={!unlocked && !ownedItem ? `Shop unlocks in ${daysLeft} day${daysLeft === 1 ? '' : 's'}` : ''}
                          onClick={() => !ownedItem && setPendingBuy(item)}
                          data-shop-state={ownedItem ? 'owned' : 'buy'}
                        >
                          {ownedItem ? '✓ Owned' : buyLabel}
                        </Button3d>
                      </div>
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
            ? `Spend ${pendingBuy.cost} \u{1F48E} to unlock ${pendingBuy.emoji} ${pendingBuy.name}.\n\n` +
              `Your balance after: ${Math.max(0, (gems ?? 0) - pendingBuy.cost)} \u{1F48E}`
            : ''
        }
        confirmLabel="Buy"
        cancelLabel="Cancel"
        tone="orange"
      />
    </Screen>
  )
}
