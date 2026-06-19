# Ooka Monkey — AI Generation Brief (for ChatGPT / DALL·E / gpt-image)

Use this to generate the **base monkey** as polished AI art that still drops into the
avatar system. Attach **`template/monkey_pose_guide.png`** to the chat as a reference
image, then paste the prompt below.

> Generate the **default brown** monkey only. The other 5 skin tones (Tan, Espresso,
> Silver, Golden, Cream) are recoloured from this one master — don't generate them
> separately, or they won't line up.

---

## ✅ Paste this prompt into ChatGPT (with the pose guide attached)

```
Create a cute cartoon monkey mascot, full body, front view, as a single image with a
fully TRANSPARENT background. Match the pose and proportions in the attached guide image.

STYLE (children's learning-app mascot):
- Thick, smooth dark-brown outline around the whole character.
- Soft cel-shading with gentle gradients: a little lighter in the centre, slightly
  darker toward the edges. Clean and glossy, not painterly.
- Warm medium-brown fur. A cream / peach-tan colour for the muzzle, belly patch,
  inner ears, hands and feet.
- Big round glossy black eyes, each with two white highlight dots. Thin friendly
  eyebrows. Small black nose. Happy OPEN smile showing a small red tongue.
- A small spiky tuft of hair on top of the head.
- Flat, even lighting. No cast shadow, no ground shadow, no background.

POSE & PROPORTIONS (must follow exactly — this is rigged in a game):
- Perfectly SYMMETRICAL, front-facing, standing upright, centred in the frame.
- Head faces straight forward, eyes level and looking at the viewer.
- Include a SHORT BUT CLEARLY VISIBLE NECK between the head and body — do not fuse the
  head directly onto the torso.
- Arms hang relaxed at the sides but held slightly AWAY from the body, with a small
  visible gap between each arm and the torso. Hands open, near the hips.
- Legs straight, feet flat on an invisible floor, pointing slightly outward.
- Head is about ONE THIRD of the total body height (not a giant head).
- Small tail curling at the lower right, behind the body.

FRAMING & OUTPUT:
- Portrait canvas, 1024 x 1536.
- ENTIRE body visible and centred with even padding on all sides. Do NOT crop the
  ears, hands, feet or tail — everything must sit inside the frame.
- Transparent background. No scenery, no text, no props, no border, no drop shadow.
- One single character, crisp clean edges, suitable for cutting out.
```

---

## Why each rule matters (so you can adjust)

| Rule | Why the system needs it |
|---|---|
| **Transparent background, no shadow** | It's layered over app backgrounds; any bg/shadow has to be cut off. |
| **Front view, perfectly symmetric** | Clothes are symmetric — a tilted/asymmetric body makes every garment misalign. |
| **Visible neck** | The old monkey had no neck, so hoods/collars covered the face. A neck gives collars somewhere to sit. |
| **Arms slightly out, gap from torso** | Lets sleeves read as sleeves and lets items layer between arm and body. |
| **Head ≈ 1/3 height** | A giant head makes hats/hoods crowd the face. |
| **Nothing cropped, even padding** | The whole figure must be inside the canvas so anchor positions are stable. |
| **Eyes level & centred** | Glasses/visor anchors assume a level eye line. |
| **One master tone** | All 6 skins are recoloured from one file, so they stay pixel-identical in shape. |

---

## After ChatGPT generates it

1. Pick the cleanest result — **most symmetric**, nothing cropped, clear gap under the
   chin (neck) and beside the arms.
2. If it added a background or a shadow, reply: *"Same image, fully transparent
   background, remove the shadow."* (Or generate on a flat solid colour like pure white
   / pure green — easy to key out.)
3. Send the PNG back here. I will then:
   - Trim/clean any leftover background and feather the halo.
   - Measure the **real** anchor positions (crown, eyes, neck, shoulders, hands, feet)
     from the actual art and write them into `config/avatarAnchors.json`.
   - Recolour the master into the **6 skin tones** (full + head crops).
   - Re-fit the hoodie and wire the new base into `Avatar.jsx`.

You don't need to get the dimensions pixel-perfect — getting the **pose, framing and
style** right is what matters. I calibrate the metadata to whatever you hand me.

---

## Troubleshooting prompts

- **Cropped / zoomed in:** "Zoom out — show the full body with generous padding; ears,
  hands and feet must be fully inside the frame."
- **Head too big:** "Make the head smaller, about one third of the body height, with a
  visible neck."
- **Arms glued to body:** "Separate the arms from the torso with a small visible gap."
- **Not symmetric:** "Make it perfectly symmetrical and facing straight forward."
- **Backgrounded:** "Transparent background, no background colour, no shadow."
- **Too painterly:** "Cleaner vector-style cel-shading with a bold outline."
