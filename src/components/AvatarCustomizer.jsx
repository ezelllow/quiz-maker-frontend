import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Card from './ui/Card'
import Avatar from './ui/Avatar'
import Modal from './ui/Modal'
import SectionLabel from './ui/SectionLabel'
import CatIcon from './ui/CatIcon'
import WearablePreview from './ui/WearablePreview'
import { SKIN_COLORS } from './ui/skinColors'
import { assets as ASSET_CFG } from '../avatar-system'
import { ease } from '../motion'
import Icon from './ui/Icon'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const WEARABLE_ASSETS = ASSET_CFG.wearables || {}

// Category tabs (Duolingo-style). Order = tab order. Only categories that
// actually have items (owned OR buyable) are shown. Includes every slot the
// old Shop sold so nothing gets orphaned now that buying lives here.
const CATEGORIES = [
  { id: 'skin',      label: 'Skin tone' },
  { id: 'outfit',    label: 'Outfit' },
  { id: 'hat',       label: 'Hats' },
  { id: 'glasses',   label: 'Glasses' },
  { id: 'hands',     label: 'Hands' },
  { id: 'legs',      label: 'Legs' },
  { id: 'accessory', label: 'Accessories' },
  { id: 'backItem',  label: 'Capes' },
  { id: 'frame',     label: 'Frames' },
]

// Rarity tiers — coloured badge + ring glow on buyable items (carried over
// from the old Shop so the catalogue still reads as a collection).
const RARITY = {
  common:    { label: 'Common',    rank: 0, badge: 'bg-gray-100 text-gray-600 border-gray-300',        ring: '' },
  rare:      { label: 'Rare',      rank: 1, badge: 'bg-[#3B9EFF]/15 text-[#1E70C7] border-[#3B9EFF]/50', ring: 'shadow-[0_0_14px_rgba(59,158,255,0.25)]' },
  epic:      { label: 'Epic',      rank: 2, badge: 'bg-[#A855F7]/15 text-[#7C3AED] border-[#A855F7]/50', ring: 'shadow-[0_0_16px_rgba(168,85,247,0.30)]' },
  legendary: { label: 'Legendary', rank: 3, badge: 'bg-[#F4B100]/20 text-[#A87900] border-[#F4B100]',   ring: 'shadow-[0_0_20px_rgba(244,177,0,0.55)]' },
}
const rarityOf = (item) => RARITY[item?.rarity] || RARITY.common

/**
 * AvatarCustomizer — Duolingo-style wardrobe. A big live preview up top, a row
 * of category tabs, and every item for the selected category underneath.
 * Items you own (or free ones) equip on tap; items you don't own show a crystal
 * price and buy through a confirm modal, then become equippable — the old
 * Shop, folded straight into the wardrobe.
 */
export default function AvatarCustomizer({ user, onUserUpdate, authToken, gems, onGemsChange }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [catalogue, setCatalogue] = useState([])
  const [owned, setOwned] = useState([])
  const [equipped, setEquipped] = useState({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)
  const [error, setError] = useState(null)
  const [activeCat, setActiveCat] = useState('skin')
  const [pendingBuy, setPendingBuy] = useState(null)
  // Account-age lock — brand-new users browse but can't buy until they've been
  // around for the backend's MIN_ACCOUNT_AGE_DAYS.
  const [unlocked, setUnlocked] = useState(true)
  const [daysLeft, setDaysLeft] = useState(0)
  const [minDays, setMinDays] = useState(7)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`${API_BASE_URL}/api/shop`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load your wardrobe'))))
      .then((d) => {
        if (cancelled) return
        setCatalogue(d.catalogue || [])
        setOwned(d.owned || [])
        setEquipped(d.equipped || {})
        if (typeof d.gems === 'number' && onGemsChange) onGemsChange(d.gems)
        setUnlocked(d.shop_unlocked !== false)
        setDaysLeft(Number(d.days_until_unlock) || 0)
        setMinDays(Number(d.min_account_age_days) || 7)
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  // Wearable if owned or free (skins + free items); otherwise it's buyable.
  const isAvailable = (item) => owned.includes(item.id) || Number(item.cost || 0) === 0

  // Group ALL catalogue items by slot, owned first, then by rarity then price.
  const itemsBySlot = useMemo(() => {
    const m = {}
    for (const it of catalogue) {
      ;(m[it.slot] ||= []).push(it)
    }
    for (const k of Object.keys(m)) {
      m[k].sort((a, b) => {
        const av = isAvailable(a) ? 0 : 1
        const bv = isAvailable(b) ? 0 : 1
        return av - bv || rarityOf(a).rank - rarityOf(b).rank || (a.cost || 0) - (b.cost || 0)
      })
    }
    return m
  }, [catalogue, owned])

  // Only show category tabs that have items.
  const cats = useMemo(
    () => CATEGORIES.filter((c) => (itemsBySlot[c.id] || []).length > 0),
    [itemsBySlot],
  )
  const active = cats.some((c) => c.id === activeCat) ? activeCat : (cats[0]?.id || 'skin')
  const items = itemsBySlot[active] || []

  const toggleEquip = async (item) => {
    if (busyId) return
    const slot = item.slot
    const isSkin = slot === 'skin'
    const isEquipped = isSkin
      ? (equipped.skin || 'skin_default') === item.id
      : equipped[slot] === item.id
    if (isSkin && isEquipped) return
    setBusyId(item.id); setError(null); setToast(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/shop/equip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reward_id: isEquipped && !isSkin ? null : item.id, slot }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || 'Could not equip that')
      const next = d.equipped || { ...equipped, [slot]: isEquipped ? null : item.id }
      setEquipped(next)
      if (onUserUpdate && user) onUserUpdate({ ...user, equipped: next })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

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
      if (typeof d.gems_total === 'number' && onGemsChange) onGemsChange(d.gems_total)
      setToast({ text: `Unlocked ${item.name}! Tap it to wear it.` })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  // Decide what a tap does: equip owned gear, or start a purchase (with
  // friendly guards for the lock gate and insufficient balance).
  const handleTileClick = (item) => {
    if (busyId) return
    if (isAvailable(item)) { toggleEquip(item); return }
    if (!unlocked) {
      setError(`Wardrobe buys unlock in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — keep practising to earn Crystals!`)
      return
    }
    if ((gems ?? 0) < Number(item.cost || 0)) {
      setError(`Not enough Crystals — ${item.name} costs ${item.cost}.`)
      return
    }
    setPendingBuy(item)
  }

  const isItemEquipped = (item) =>
    item.slot === 'skin'
      ? (equipped.skin || 'skin_default') === item.id
      : equipped[item.slot] === item.id

  // Preview content for a tile: colour swatch for skins, asset art otherwise.
  const tilePreview = (item) => {
    if (item.slot === 'skin') {
      return (
        <div
          className="w-3/4 h-3/4 rounded-full border border-black/10"
          style={{
            background: SKIN_COLORS[item.id] || '#8B5A2B',
            boxShadow: 'inset 0 -5px 10px rgba(0,0,0,0.30), inset 0 5px 9px rgba(255,255,255,0.20)',
          }}
        />
      )
    }
    return <WearablePreview id={item.id} emoji={item.emoji} className="p-1" />
  }

  if (loading) {
    return <Card variant="solid" className="!p-6 text-center text-quiz-muted mb-4">Loading your wardrobe…</Card>
  }

  return (
    <div className="mb-4">
      {/* Live full-body preview */}
      <Card variant="solid" className="!p-4 mb-3 flex items-center gap-4">
        <Avatar size="hero" variant="full" equipped={equipped} bare />
        <div className="min-w-0 flex-1">
          <SectionLabel>Your Ooka</SectionLabel>
          <div className="text-sm font-black mt-0.5">
            {equipped.outfit
              ? <span className="inline-flex items-center gap-1"><Icon name="shirt" className="w-4 h-4 text-quiz-muted" /> Outfit on</span>
              : 'Pick a look'}
          </div>
          <div className="text-[10px] font-bold text-quiz-muted mt-0.5 leading-tight">
            Shown on leaderboard, home & profile. Tap gear to wear it — buy new gear right here.
          </div>
        </div>
        <span
          title={`${gems ?? 0} Crystals`}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-sm font-black
                     bg-quiz-cyan/15 border border-quiz-cyan/40 text-quiz-cyan"
        >
          <Icon name="gem" className="w-4 h-4" /> {gems ?? 0}
        </span>
      </Card>

      {/* Lock notice — account younger than MIN_ACCOUNT_AGE_DAYS can't buy yet. */}
      {!unlocked && (
        <Card variant="solid" className="!p-3 mb-3 border-2 border-quiz-yellow/50 bg-quiz-yellow/10">
          <p className="text-[11px] font-bold text-quiz-yellow leading-relaxed">
            <Icon name="lock" className="inline w-4 h-4 mr-1 align-text-bottom" /> Buying unlocks in {daysLeft} day{daysLeft === 1 ? '' : 's'}. Spend your
            first {minDays} days building the habit — you can still equip anything you own.
          </p>
        </Card>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-1 px-1">
        {cats.map((c) => {
          const on = c.id === active
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCat(c.id)}
              className={
                'shrink-0 w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ' +
                (on
                  ? 'border-quiz-blue bg-quiz-blue/15 shadow-md'
                  : 'border-quiz-border bg-[var(--quiz-card-solid)] hover:-translate-y-0.5 active:scale-95')
              }
              title={c.label}
              aria-label={c.label}
            >
              <CatIcon id={c.id} color={on ? '#5DA9FF' : '#AEB8D4'} />
            </button>
          )
        })}
      </div>

      {/* Active category label */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <SectionLabel>{(cats.find((c) => c.id === active) || {}).label || ''}</SectionLabel>
        {active === 'skin' && (
          <span className="text-[10px] font-black uppercase tracking-wider text-quiz-green">Free</span>
        )}
      </div>

      {/* Items grid for the active category */}
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => {
          const available = isAvailable(item)
          const on = isItemEquipped(item)
          const removable = item.slot !== 'skin' && on
          const r = rarityOf(item)
          const affordable = (gems ?? 0) >= Number(item.cost || 0)
          return (
            <button
              key={item.id}
              type="button"
              disabled={busyId === item.id || (item.slot === 'skin' && on)}
              onClick={() => handleTileClick(item)}
              className={
                'group relative rounded-2xl border-2 p-2 flex flex-col items-center text-center transition-all ' +
                (on
                  ? 'border-quiz-green bg-quiz-green/10 shadow-md '
                  : 'border-quiz-border qq-card-solid hover:-translate-y-0.5 active:scale-95 ') +
                (available || !item.rarity ? '' : r.ring)
              }
              title={item.desc}
            >
              {/* Rarity badge on items you don't own yet. */}
              {!available && item.rarity && (
                <div className={
                  'absolute top-1 left-1 px-1 py-0.5 rounded-md border leading-none ' +
                  'text-[7px] font-black uppercase tracking-wider ' + r.badge
                }>
                  {r.label}
                </div>
              )}
              <div
                className={'w-full aspect-square rounded-xl flex items-center justify-center mb-1 overflow-hidden p-1 ' +
                           (available ? '' : 'opacity-70')}
                style={{ background: 'radial-gradient(circle at 50% 32%, var(--quiz-bg-2), var(--quiz-bg))' }}
              >
                {tilePreview(item)}
              </div>
              <div className="font-black text-[11px] leading-tight">{item.name}</div>
              {available ? (
                <div className={'text-[9px] font-black uppercase tracking-wider mt-0.5 ' +
                                (on ? 'text-quiz-green' : 'text-quiz-muted group-hover:text-quiz-blue')}>
                  {on
                    ? (removable
                        ? <span className="inline-flex items-center gap-0.5"><Icon name="check" className="w-3 h-3" /> Worn — tap off</span>
                        : <span className="inline-flex items-center gap-0.5"><Icon name="check" className="w-3 h-3" /> Worn</span>)
                    : 'Wear'}
                </div>
              ) : (
                <div className={
                  'mt-0.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border ' +
                  'text-[9px] font-black leading-none ' +
                  (unlocked && affordable
                    ? 'text-quiz-cyan bg-quiz-cyan/15 border-quiz-cyan/40'
                    : 'text-quiz-muted bg-quiz-border/30 border-quiz-border')
                }>
                  {unlocked
                    ? <><Icon name="gem" className="w-3 h-3" /> {item.cost}</>
                    : <><Icon name="lock" className="w-3 h-3" /> {item.cost}</>}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {toast && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={ease.spring}>
          <Card variant="solid" className="!p-3 mt-3 border-2 border-quiz-green/50 bg-quiz-green/10">
            <p className="text-xs font-bold text-quiz-green inline-flex items-center gap-1"><Icon name="party" className="w-4 h-4" /> {toast.text}</p>
          </Card>
        </motion.div>
      )}
      {error && (
        <Card variant="solid" className="!p-3 mt-3 border-2 border-quiz-red/50 bg-quiz-red/10">
          <p className="text-xs font-bold text-quiz-red">{error}</p>
        </Card>
      )}

      {/* Buy confirmation */}
      <Modal
        open={pendingBuy !== null}
        onClose={() => setPendingBuy(null)}
        onConfirm={() => pendingBuy && performBuy(pendingBuy)}
        title={pendingBuy ? `Buy ${pendingBuy.name}?` : ''}
        body={
          pendingBuy
            ? `Spend ${pendingBuy.cost} \u{1F48E} to unlock ${pendingBuy.emoji || ''} ${pendingBuy.name}.\n\n` +
              `Your balance after: ${Math.max(0, (gems ?? 0) - pendingBuy.cost)} \u{1F48E}`
            : ''
        }
        confirmLabel="Buy"
        cancelLabel="Cancel"
        tone="orange"
      />
    </div>
  )
}
