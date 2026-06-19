import { assets as ASSET_CFG } from '../../avatar-system'

const WEARABLE_ASSETS = ASSET_CFG.wearables || {}

/**
 * WearablePreview — shows a wearable's art at a consistent visual size in a
 * square container, regardless of how much of its source canvas the art fills.
 *
 * Some assets (e.g. the hoodie) are drawn on the full 1024×1536 body canvas, so
 * their art is just a small band — plain object-contain would render them tiny
 * next to tightly-cropped items like a cap. When an asset carries a
 * `boundingBox` + `nativeCanvas` in avatarAssets.json, we crop to that box so
 * the art fills the tile. Assets without a bounding box are already tight, so
 * we just contain them.
 *
 *   id     — wearable id (key into avatarAssets.wearables)
 *   emoji  — fallback glyph if the id has no image asset
 */
export default function WearablePreview({ id, emoji, className = '' }) {
  const a = WEARABLE_ASSETS[id]
  if (!a || !a.src) {
    return emoji ? <span style={{ fontSize: '2.1em', lineHeight: 1 }}>{emoji}</span> : null
  }

  const bb = a.boundingBox
  const cv = a.nativeCanvas
  // No measured content box → asset already fills its canvas; just contain it.
  if (!bb || !cv || !cv.width || !cv.height) {
    return (
      <img
        src={a.src}
        alt=""
        draggable={false}
        className={'w-full h-full object-contain ' + className}
        style={{ maxWidth: 'none' }}
      />
    )
  }

  // Crop to the content box (with a little breathing room) so it fills the tile.
  const PAD = 1.12
  const ref = Math.max(bb.width, bb.height) * PAD
  const cx = bb.x + bb.width / 2
  const cy = bb.y + bb.height / 2
  return (
    <div className={'relative w-full h-full overflow-hidden ' + className}>
      <img
        src={a.src}
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          width: `${(cv.width / ref) * 100}%`,
          height: `${(cv.height / ref) * 100}%`,
          left: `${(0.5 - cx / ref) * 100}%`,
          top: `${(0.5 - cy / ref) * 100}%`,
          maxWidth: 'none',
        }}
      />
    </div>
  )
}
