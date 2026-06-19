# Ooka Cosmetic Asset Spec — for generating items that fit the base monkey

Hand the file **`template/asset_placement_guide.png`** to ChatGPT together with the
prompt, and tell it to draw the item **in the labelled box on that exact canvas**.

## The golden rule (read this first)

The base monkey lives on a **1024 × 1536 px, transparent** canvas. The easiest way to
make an asset that "just fits" is to draw it on **the same 1024 × 1536 transparent
canvas, in the exact position it sits on the monkey** — like a clear sheet laid over the
monkey. The art then drops straight into the system as a full-canvas overlay (this is
exactly how the hoodie works). Don't crop tightly around the item; keep the full 1024 ×
1536 frame with everything else transparent.

- Canvas: **1024 wide × 1536 tall**, fully transparent background, PNG.
- The monkey is centred (vertical centre line = **x 512**).
- Match the art style of the base: thick dark outline, soft cel-shading, clean vector look.

---

## Base monkey landmark coordinates (pixels on the 1024 × 1536 canvas)

| Landmark | x | y | Notes |
|---|---|---|---|
| Top of head (crown) | 512 | 139 | highest fur/tuft point |
| Left eye centre | 438 | 452 | |
| Right eye centre | 585 | 452 | eye line is y ≈ 452 |
| Left ear centre | 242 | 484 | ear box x210–283, y432–519 |
| Right ear centre | 782 | 484 | ear box x743–814, y432–519 |
| Neck (narrowest) | 512 | 641 | neck width x451–574 |
| Shoulders | 512 | 686 | |
| Belly / chest centre | 512 | 836 | |
| Left hand (paw) | 308 | 980 | |
| Right hand (paw) | 715 | 980 | |
| Left foot | 418 | 1228 | |
| Right foot | 604 | 1228 | |

- **Whole body** occupies: x **184 → 847**, y **139 → 1284** (width 664, height 1146).
- **Head + ears** box: x **184 → 839**, y **139 → 640** (width 656, height 502).

---

## Body outline (for clothing — left & right edge at each height)

Use these to make outfits/capes that wrap the body. The arms flare outward toward the
hands, reaching their widest (x 255–770) at about y 960.

| y | left edge | right edge | region |
|---|---|---|---|
| 320 | 310 | 714 | head |
| 480 | 186 | 837 | ears (widest head) |
| 640 | 451 | 574 | neck |
| 720 | 341 | 683 | shoulders / upper arms |
| 800 | 307 | 717 | torso + arms |
| 880 | 276 | 748 | torso + arms |
| 960 | 255 | 770 | widest (wrists) |
| 1040 | — | — | splits: hands at sides, legs centre |
| 1120 | 384 | 643 | legs |
| 1200 | 381 | 643 | feet |

---

## Where to draw each item (bounding box on the 1024 × 1536 canvas)

These match the coloured boxes in `asset_placement_guide.png`.

| Item type | box x | box y | Anchor / how it sits |
|---|---|---|---|
| **Hat / cap / crown** | 300 – 724 | 40 – 215 | bottom of hat rests on the crown (~y 200), rises up |
| **Glasses / visor** | 355 – 669 | 405 – 505 | centred on the eye line (y 452), covers both eyes |
| **Earring / ear item** | per ear | 432 – 519 | left ear ~x242, right ear ~x782 |
| **Necklace / scarf / collar** | 415 – 609 | 598 – 722 | wraps the neck (y 641); necklaces hang downward |
| **Outfit (hoodie/shirt/jacket)** | 255 – 770 | 668 – 1015 | follow the body outline above; covers torso + arms, hem at the hips; paws poke out below |
| **Chest emblem / badge / chain** | 438 – 586 | 775 – 895 | on the belly centre (512, 836) |
| **Hand item (left)** | 250 – 366 | 922 – 1038 | on the left paw (308, 980) |
| **Hand item (right)** | 660 – 776 | 922 – 1038 | on the right paw (715, 980) |
| **Shoes (left)** | 350 – 490 | 1170 – 1285 | on the left foot (418, 1228) |
| **Shoes (right)** | 536 – 676 | 1170 – 1285 | on the right foot (604, 1228) |
| **Back item (cape / backpack / wings)** | centred x512 | 690 – 1060 | sits **behind** the body |

---

## Ready-to-paste prompt (swap in the item)

```
Draw a [ITEM — e.g. "red baseball cap"] for a cartoon monkey mascot, as a single PNG
on a 1024 x 1536 transparent canvas. Match the attached guide image: draw ONLY the
[ITEM], positioned exactly inside the "[BOX NAME — e.g. HAT]" box, sized to sit naturally
on the monkey there. Everything outside the item must be fully transparent — do not draw
the monkey, do not draw a background, no shadow, no border.

Style: thick dark-brown/black outline, smooth soft cel-shading with gentle gradients,
clean vector look, flat even lighting. The item should look like it belongs on the same
character as the guide.

Output the full 1024 x 1536 frame (do not crop to the item).
```

Examples to fill in:
- *"red baseball cap" … "HAT" box.*
- *"round black sunglasses" … "EYEWEAR" box.*
- *"gold chain necklace" … "NECK / SCARF" box.*
- *"blue superhero cape" … behind the body, "Back item" — say "drawn behind, flowing down from the shoulders".*

---

## After ChatGPT makes it

Send the PNG back here. Because it's already on the base canvas, it drops in as a
full-overlay asset: I add one entry to `config/avatarAssets.json`
(`anchor: bodyOverlay, scale: 1.0`) and it renders in place — no per-item tuning.

If ChatGPT gives you a tightly-cropped item instead of the full frame, that's fine too —
I can re-place it using the anchor coordinates above; it's just a little more work.

**Tip:** generate one item per image. Don't ask for the monkey in the picture — only the
item on a transparent sheet. That keeps the style consistent and the placement clean.
