# Ooka Avatar System

Single source of truth for avatar positioning. The frontend renders the avatar
by reading this metadata — **no per-item CSS offsets, no hardcoded numbers, no
skin-tone-specific versions**. Add cosmetics by dropping a PNG and one entry in
`config/avatarAssets.json`.

## Folders
- `template/` — the Monkey Avatar Template V1.
  - `monkey_avatar_template_v1.json` — canvas, bodyBounds, and every anchor in
    template space (1024×1024), the human-readable spec.
  - `monkey_avatar_template_v1.png` — body + grid + labelled anchor dots (visual reference).
  - `monkey_avatar_template_v1.svg` — vector anchor map.
- `config/` — machine-readable config consumed by the renderer.
  - `avatarMeasurements.json` — raw landmarks measured off `skin_default_full.png`
    (native px + fractions) and the template transform. The empirical origin of every number.
  - `avatarAnchors.json` — anchor points as **fractions of the body canvas**
    (resolution-independent) + template px + attach rule. **This is what the engine reads.**
  - `avatarLayers.json` — render order + z-index + behindBody per layer.
  - `avatarAssets.json` — base skins + wearables, each with a boundingBox,
    anchor, attach, scale, and anchorCompatibility. `templates` shows the schema
    for future categories.

## Coordinate model
Anchors are stored as `[fx, fy]` fractions of the full-body PNG canvas (852×1262).
Because the body PNG is drawn edge-to-edge in its container, a fraction of the
canvas equals a percentage of the rendered box — so the same numbers work at any
size or resolution. Template px (1024²) are derived for human reference only:
`X = fx*852*scale + xOffset`, `Y = fy*1262*scale`, `scale = 1024/1262`.

## Attach rules
- `center` — asset centre sits on the anchor (glasses, hands, feet, bowtie).
- `top-center` — asset top-centre sits on the anchor (outfits, necklaces, capes).
- `bottom-center` — asset bottom-centre sits on the anchor (hats, crowns, helmets).

## Adding a cosmetic (the whole pipeline)
1. Export a PNG on a 1024-wide transparent canvas, art centred.
2. Add an entry to `config/avatarAssets.json` → `wearables`:
   `{ assetId, category, slot, src, nativeCanvas, boundingBox, anchor, attach, scale, anchorCompatibility }`.
3. Sell it from the backend SHOP_CATALOGUE with the matching slot. Done — no code changes.

## Scale
Supports 500+ cosmetics, 20+ skin tones, animated/seasonal/premium items, and
new avatar bodies (publish a new template + measurements; anchors stay fractional).
