import { useEffect } from 'react'

/**
 * useWideFrame — let this screen use the whole window instead of the phone
 * column the rest of the app lives in.
 *
 * Layout wraps every page in a `max-w-md` frame, which is right for a quiz
 * but wrong for the editing passage: that fits its type to the width it is
 * given, so a wider column is directly bigger, more readable text rather
 * than just longer lines.
 *
 * It's a body class rather than a prop because the frame lives in Layout,
 * above every page, and the screens that want it are nested several levels
 * down (App -> PracticePage -> EnglishEditing -> EditingPlayer). Threading a
 * prop up through all of that to set one max-width would be worse.
 *
 * On a phone this changes nothing: the frame is already narrower than both
 * the normal and the wide cap, so width comes from the viewport either way.
 *
 * Counted rather than toggled, so a screen that mounts while another is
 * still unmounting (the player handing over to the review) can't leave the
 * app stuck narrow.
 */
let held = 0

export default function useWideFrame(enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined
    held += 1
    document.body.classList.add('ooka-wide')
    return () => {
      held -= 1
      if (held <= 0) {
        held = 0
        document.body.classList.remove('ooka-wide')
      }
    }
  }, [enabled])
}
