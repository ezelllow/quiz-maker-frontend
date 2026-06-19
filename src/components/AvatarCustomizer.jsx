import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Card from './ui/Card'
import Avatar from './ui/Avatar'
import SectionLabel from './ui/SectionLabel'
import CatIcon from './ui/CatIcon'
import WearablePreview from './ui/WearablePreview'
import { SKIN_COLORS } from './ui/skinColors'
import { assets as ASSET_CFG } from '../avatar-system'
import { ease } from '../motion'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const WEARABLE_ASSETS = ASSET_CFG.wearables || {}

// Category tabs (Duolingo-style). Order = tab order. Only categories that
// actually have available items are shown.
const CATEGORIES = [
  { id: 'skin',      label: 'Skin tone' },
  { id: 'outfit',    label: 'Outfit' },
  { id: 'hat',       label: 'Hats' },
  { id: 'glasses',   label: 'Glasses' },
  { id: 'accessory', label: 'Accessories' },
  { id: 'backItem',  label: 'Capes' },
]

/**
 * AvatarCustomizer — Duolingo-style wardrobe. A big live preview up top, a row
 * of category tabs, and the items you own (or free) for the selected category
 * underneath. Tapping an item equips it instantly.
 */
export default function AvatarCustomizer({ user, onUserUpdate }) {
  const token = localStorage.getItem('auth_token')
  const [catalogue, setCatalogue] = useState([])
  const [owned, setOwned] = useState([])
  const [equipped, setEquipped] = useState({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)
  const [error, setError] = useState(null)
  const [activeCat, setActiveCat] = useState('skin')

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
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [token])

  // Worn if owned, or free (skins + free items).
  const isAvailable = (item) => owned.includes(item.id) || Number(item.cost || 0) === 0

  // Group available items by slot.
  const itemsBySlot = useMemo(() => {
    const m = {}
    for (const it of catalogue) {
      if (!isAvailable(it)) continue
      ;(m[it.slot] ||= []).push(it)
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
        <div className="min-w-0">
          <SectionLabel>Your Ooka</SectionLabel>
          <div className="text-sm font-black mt-0.5">
            {equipped.outfit ? '🧥 Outfit on' : 'Pick a look'}
          </div>
          <div className="text-[10px] font-bold text-quiz-muted mt-0.5 leading-tight">
            Shown on leaderboard, home & profile. Buy more in the Shop.
          </div>
        </div>
      </Card>

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
          const on = isItemEquipped(item)
          const removable = item.slot !== 'skin' && on
          return (
            <button
              key={item.id}
              type="button"
              disabled={busyId === item.id || (item.slot === 'skin' && on)}
              onClick={() => toggleEquip(item)}
              className={
                'group rounded-2xl border-2 p-2 flex flex-col items-center text-center transition-all ' +
                (on
                  ? 'border-quiz-green bg-quiz-green/10 shadow-md'
                  : 'border-quiz-border qq-card-solid hover:-translate-y-0.5 active:scale-95')
              }
              title={item.desc}
            >
              <div
                className="w-full aspect-square rounded-xl flex items-center justify-center mb-1 overflow-hidden p-1"
                style={{ background: 'radial-gradient(circle at 50% 32%, var(--quiz-bg-2), var(--quiz-bg))' }}
              >
                {tilePreview(item)}
              </div>
              <div className="font-black text-[11px] leading-tight">{item.name}</div>
              <div className={'text-[9px] font-black uppercase tracking-wider mt-0.5 ' +
                              (on ? 'text-quiz-green' : 'text-quiz-muted group-hover:text-quiz-blue')}>
                {on ? (removable ? '✓ Worn — tap off' : '✓ Worn') : 'Wear'}
              </div>
            </button>
          )
        })}
      </div>

      {toast && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={ease.spring}>
          <Card variant="solid" className="!p-3 mt-3 border-2 border-quiz-green/50 bg-quiz-green/10">
            <p className="text-xs font-bold text-quiz-green">{toast.text}</p>
          </Card>
        </motion.div>
      )}
      {error && (
        <Card variant="solid" className="!p-3 mt-3 border-2 border-quiz-red/50 bg-quiz-red/10">
          <p className="text-xs font-bold text-quiz-red">{error}</p>
        </Card>
      )}
    </div>
  )
}
