interface SeigaihaOverlayProps {
  className?: string
}

/**
 * Seigaiha (青海波) pattern overlay.
 * Always renders as inset-0, pointer-events-none.
 * Use className to set position (absolute/fixed) and opacity.
 *
 * Common presets:
 *   fixed   opacity-30 dark:opacity-20  → page backgrounds (Create, Gallery, Community)
 *   absolute opacity-60 dark:opacity-25 → modal / card headers
 *   absolute opacity-20 dark:opacity-10 → subtle page overlay (404)
 */
export default function SeigaihaOverlay({
  className = "absolute opacity-30 dark:opacity-20",
}: SeigaihaOverlayProps) {
  return <div className={`inset-0 pattern-seigaiha pointer-events-none ${className}`} />
}
