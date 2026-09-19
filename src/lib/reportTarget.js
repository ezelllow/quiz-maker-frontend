import { useEffect, useSyncExternalStore } from 'react'

/**
 * What the student is currently looking at, for the header's report button.
 *
 * The button lives in the app bar so it's always in the same obvious place,
 * but a report is only worth much if it names the content — content_uid is
 * the Sheet row to go and fix. Those two pull in opposite directions: the
 * button is global, the context is deep inside a quiz screen.
 *
 * So screens publish here and the header subscribes. An external store
 * rather than React context because publishing must not re-render the app:
 * a context value set from an effect would re-render every screen on each
 * question change, and would trip the no-setState-in-effect rule besides.
 * Here, only the header re-renders.
 */
let target = null
const listeners = new Set()

function emit() {
  for (const fn of listeners) fn()
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function snapshot() {
  return target
}

/** Publish, or pass null to clear. */
export function setReportTarget(next) {
  target = next
  emit()
}

/**
 * Publish for as long as this component is mounted.
 *
 * `deps` are what the identity is built from — pass the values themselves,
 * not the object, or a fresh object literal each render would republish on
 * every render.
 */
export function usePublishReportTarget(build, deps) {
  useEffect(() => {
    setReportTarget(build())
    return () => setReportTarget(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** Read it. Re-renders only the caller. */
export function useReportTarget() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
