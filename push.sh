#!/usr/bin/env bash
# Run from C:\School\quiz-maker-frontend (Git Bash).
# Pushes this session's frontend work: shop→wardrobe merge, Dashboard nav,
# Angel Wings item, and the avatar/modal z-index fix.
set -e

# Clear the stuck lock left by the sandbox (harmless if it isn't there).
rm -f .git/index.lock

git add \
  src/App.jsx \
  src/components/Layout.jsx \
  src/components/CustomizePage.jsx \
  src/components/AvatarCustomizer.jsx \
  src/components/ui/Avatar.jsx \
  src/components/ui/Modal.jsx \
  src/avatar-system/config/avatarAssets.json \
  public/brand/ooka/avatars/wearables/wings_angel.svg

git commit -m "Wardrobe: merge shop, Dashboard nav, Angel Wings item, fix modal overlap

- Replace Shop nav tab with Dashboard
- Wardrobe shows buyable items per category with confirm-modal purchase
- Add Angel Wings (wings_angel) backItem + SVG art
- Rarity badge/glow only render when an item has a rarity
- Isolate avatar stacking context + lift modal z-index so the buy popup
  no longer overlaps the Ooka preview"

git push
echo "Done."
