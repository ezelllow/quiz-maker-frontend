/**
 * cn — tiny class-name joiner.
 *
 * Accepts any number of arguments. Falsy values are dropped. Used by the
 * ui primitives to merge default classes with caller-supplied `className`.
 *
 * Example:
 *   <button className={cn('btn', isActive && 'btn-active', className)}>
 *
 * Kept dependency-free on purpose — no need to pull in clsx for this scale.
 */
export function cn(...args) {
  return args.filter(Boolean).join(' ')
}
