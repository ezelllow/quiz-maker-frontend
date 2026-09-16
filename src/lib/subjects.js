/**
 * The subject list, in one place.
 *
 * Every screen that offers a subject — the Practice picker and the Daily
 * Challenge grid — reads from here, so a subject looks like itself wherever
 * it appears. They had drifted already: the same icon names rendered as
 * coloured discs on Practice and flat glyphs on the daily, which read as two
 * different things rather than one subject in two places.
 *
 *   id        what the backend calls the level ('english' is not a level —
 *             it leaves the quiz form entirely, see `leaves`)
 *   icon      Icon name
 *   label     full name, for a screen with room
 *   short     for the daily's two-column grid, where "Combined Physics G3"
 *             wraps to three lines
 *   tone      TopicCard tone; `color` is that tone's foreground, for the
 *             places that want the raw value
 *   leaves    true when picking it swaps the screen rather than filtering
 *             the quiz form
 *
 * Derived rather than repeated, so they can't fall out of step:
 *   levelKey  what /api/subtopics and the quiz `level` want — the id, for
 *             everything that IS a level; absent for the ones that aren't
 *   kind      'english' on the one PracticePage routes to its own player
 */
export const SUBJECT_TONES = {
  gold:   { bg: 'rgba(201, 162, 75, 0.18)',  fg: '#C9A24B' },
  green:  { bg: 'rgba(91,  185, 140, 0.18)', fg: '#3F9F73' },
  blue:   { bg: 'rgba(56,  134, 200, 0.18)', fg: '#3F8AC2' },
  purple: { bg: 'rgba(124, 78,  168, 0.18)', fg: '#7C4EA8' },
  red:    { bg: 'rgba(217, 83,  79,  0.18)', fg: '#D9534F' },
}

export const SUBJECTS = [
  { id: 'pure',       icon: 'flask',  label: 'Pure Physics',        short: 'Pure Physics', tone: 'blue',   tagline: 'Pure · 20 topics' },
  { id: 'combinedG3', icon: 'atom',   label: 'Combined Physics G3', short: 'Combined G3',  tone: 'green',  tagline: 'Combined · 16 topics' },
  { id: 'combinedG2', icon: 'dna',    label: 'Combined Physics G2', short: 'Combined G2',  tone: 'gold',   tagline: 'Combined · 13 topics' },
  { id: 'combinedG1', icon: 'magnet', label: 'G1 Science',          short: 'G1 Science',   tone: 'red',    tagline: 'Science · 11 topics' },
  { id: 'p6math',     icon: 'divide', label: 'P6 Math',             short: 'P6 Math',      tone: 'purple', tagline: 'PSLE · All topics' },
  { id: 'english',    icon: 'book',   label: 'English',             short: 'English',      tone: 'green',  tagline: 'Editing · 60 passages', leaves: true },
].map((s) => ({
  ...s,
  color: SUBJECT_TONES[s.tone].fg,
  active: true,
  ...(s.leaves ? { kind: s.id } : { levelKey: s.id }),
}))

export const SUBJECT_BY_ID = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]))
