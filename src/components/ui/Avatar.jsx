import { cn } from '../../lib/cn'
import { anchors as ANCHOR_CFG, layers as LAYER_CFG, assets as ASSET_CFG } from '../../avatar-system'

/**
 * Avatar — Ooka monkey base + wearable overlays, driven entirely by the
 * /avatar-system/ metadata. There are NO per-item hardcoded offsets here:
 * every wearable is placed from its asset entry (anchor + attach + scale)
 * in `src/avatar-system/config/avatarAssets.json`, against the body anchors
 * in `avatarAnchors.json`, stacked by `avatarLayers.json`.
 *
 *   variant="head" — circular crop framed to head-and-shoulders. Renders the
 *                    full body + wearables, zoomed and clipped, so the equipped
 *                    cosmetics (hat, glasses, collar, cape…) show on the chip.
 *   variant="full" — whole body in a tall frame (shop "Your Ooka", hero).
 *
 * Props:
 *   size      — 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero'
 *   variant   — 'head' (default) | 'full'
 *   equipped  — { skin, outfit, hat, glasses, ... } ids into the asset registry
 *   bare      — drop the tinted panel + ring (avatar floats on its own)
 *   src       — DEPRECATED photo URL; ignored.
 */

const ANCHORS = ANCHOR_CFG.anchors
const WEARABLE_ASSETS = ASSET_CFG.wearables || {}
const BASE_ASSETS = ASSET_CFG.base || {}

// ---- Back-compat exports (ShopPage / call sites depend on these) -----------

export const AVATAR_REGISTRY = Object.fromEntries(
  Object.entries(BASE_ASSETS).map(([id, a]) => [id, { head: a.src.head, full: a.src.full }])
)
export const DEFAULT_AVATAR_ID = 'skin_default'
export function avatarSrc(id, variant = 'head') {
  const entry = AVATAR_REGISTRY[id] || AVATAR_REGISTRY[DEFAULT_AVATAR_ID]
  return entry[variant] || entry.head
}

export const OUTFIT_REGISTRY = Object.fromEntries(
  Object.entries(WEARABLE_ASSETS)
    .filter(([, a]) => a.category === 'outfit')
    .map(([id, a]) => [id, { src: a.src, ...a }])
)

export const WEARABLES_REGISTRY = {}

// ---- Layer lookup: category → { z, behindBody } ---------------------------
const CATEGORY_LAYER = {}
for (const [name, def] of Object.entries(LAYER_CFG.layers || {})) {
  for (const cat of def.categories || []) {
    CATEGORY_LAYER[cat] = { z: def.z, behindBody: !!def.behindBody, layer: name }
  }
}
function layerFor(category) {
  return CATEGORY_LAYER[category] || { z: 25, behindBody: false, layer: 'outfit' }
}

// ---- Size tiers ------------------------------------------------------------
const CIRCLE = { xs: 28, sm: 36, md: 48, lg: 72, xl: 96, hero: 128 }
const FULL_RATIO = 1536 / 1024 // body canvas aspect; box matches so frac == box %

// Head-chip framing — the circular avatar shows this square window of the full
// 1024×1536 body (x 184–840, y 64–720): head + shoulders, centred. Derived:
//   ZOOM = 1024 / windowWidth, offsets = -windowOrigin / windowWidth.
const HEAD_ZOOM = 1.56
const HEAD_LEFT = -0.281
const HEAD_TOP = -0.098

const FRAME_SHADOW = {
  gold:    '0 0 0 3px #fbbf24, 0 0 18px rgba(251,191,36,0.6), 0 0 30px rgba(251,191,36,0.3)',
  rainbow: '0 0 0 3px #ec4899, 0 0 18px rgba(168,85,247,0.6), 0 0 30px rgba(56,189,248,0.4)',
  fire:    '0 0 0 3px #fb923c, 0 0 20px rgba(251,146,60,0.8), 0 0 36px rgba(244,63,94,0.45)',
  galaxy:  '0 0 0 2px #6366f1, 0 0 22px rgba(99,102,241,0.7), 0 0 40px rgba(99,102,241,0.4)',
}

const ATTACH_TRANSFORM = {
  'center':        'translate(-50%, -50%)',
  'top-center':    'translateX(-50%)',
  'bottom-center': 'translate(-50%, -100%)',
}

// Resolve one equipped wearable id into positioned <img> descriptor(s).
function placeAsset(id) {
  const a = WEARABLE_ASSETS[id]
  if (!a || !a.src) return []
  const anchor = ANCHORS[a.anchor]
  if (!anchor) return []
  const [fx, fy] = anchor.frac
  const attach = a.attach || anchor.attach || 'center'
  const { z, behindBody } = layerFor(a.category)
  const base = {
    left: `${fx * 100}%`,
    top: `${fy * 100}%`,
    width: `${(a.scale || 1) * 100}%`,
    transform: ATTACH_TRANSFORM[attach] || ATTACH_TRANSFORM.center,
  }
  const out = []
  if (a.behindSrc) out.push({ id: id + '_behind', src: a.behindSrc, ...base, zIndex: 90, behindBody: true })
  out.push({ id, src: a.src, ...base, zIndex: 100 + z, behindBody })
  return out
}

export default function Avatar({
  src,                 // deprecated, ignored
  initials = '?',
  size = 'md',
  variant = 'head',
  equipped,
  bare = false,
  className,
  ...rest
}) {
  const boxW = CIRCLE[size] || CIRCLE.md
  const isFull = variant === 'full'
  const boxH = isFull ? Math.round(boxW * FULL_RATIO) : boxW

  const eq = equipped || {}
  const skinId = (eq.skin && AVATAR_REGISTRY[eq.skin]) ? eq.skin : DEFAULT_AVATAR_ID
  // Always render the full-body art so wearables (placed in body coordinates)
  // appear in BOTH variants — the head chip just frames it to the head.
  const baseSrc = avatarSrc(skinId, 'full')

  const frameKey = eq.frame && typeof eq.frame === 'string' ? eq.frame.replace('frame_', '') : null
  const boxShadow = FRAME_SHADOW[frameKey] || 'var(--avatar-ring)'

  const worn = Object.entries(eq)
    .filter(([slot]) => slot !== 'skin' && slot !== 'frame')
    .flatMap(([, id]) => placeAsset(id))
    .filter(Boolean)
    .sort((p, q) => p.zIndex - q.zIndex)

  const panelBg = bare
    ? 'transparent'
    : 'radial-gradient(circle at 50% 32%, var(--quiz-bg-2, #1b2444), var(--quiz-bg, #0f1830))'
  const panelShadow = bare ? (frameKey ? boxShadow : 'none') : boxShadow

  const wearableImg = (p) => (
    <img
      key={p.id}
      src={p.src}
      alt=""
      className="absolute pointer-events-none"
      style={{ left: p.left, top: p.top, width: p.width, transform: p.transform, zIndex: p.zIndex }}
      onError={(e) => { e.currentTarget.style.display = 'none' }}
    />
  )

  const bodyImg = (
    <img
      src={baseSrc}
      alt=""
      className="absolute inset-0 w-full h-full object-contain"
      style={{ zIndex: 100 }}
      onError={(e) => { e.currentTarget.style.display = 'none' }}
    />
  )

  // ---- Head chip: full body + wearables, zoomed & clipped to a circle ----
  if (!isFull) {
    const stageW = boxW * HEAD_ZOOM
    const stageH = stageW * FULL_RATIO
    return (
      <div
        className={cn('relative inline-block shrink-0 rounded-full overflow-hidden', className)}
        style={{ width: boxW, height: boxW, background: panelBg, boxShadow: panelShadow }}
        {...rest}
      >
        <div style={{ position: 'absolute', width: stageW, height: stageH, left: boxW * HEAD_LEFT, top: boxW * HEAD_TOP }}>
          {worn.filter((p) => p.behindBody).map(wearableImg)}
          {bodyImg}
          {worn.filter((p) => !p.behindBody).map(wearableImg)}
        </div>
      </div>
    )
  }

  // ---- Full body ----
  return (
    <div
      className={cn('relative inline-block shrink-0 rounded-2xl', className)}
      style={{ width: boxW, height: boxH }}
      {...rest}
    >
      {worn.filter((p) => p.behindBody).map(wearableImg)}

      <div
        className="relative w-full h-full overflow-hidden rounded-2xl flex items-center justify-center"
        style={{ background: panelBg, boxShadow: panelShadow, zIndex: 100 }}
      >
        <img
          src={baseSrc}
          alt=""
          className="w-full h-full object-contain"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      </div>

      {worn.filter((p) => !p.behindBody).map(wearableImg)}
    </div>
  )
}
