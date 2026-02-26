import CherryBlossom from "@lib/decorations/CherryBlossom/CherryBlossom"
import SakuraDecorationIcon from "@assets/icons/sakura-decoration.svg?react"
import SeigaihaOverlay from "@lib/decorations/SeigaihaOverlay/SeigaihaOverlay"

/**
 * Shared ambient decorations used on Create and Emoji pages.
 * Fixed-position, pointer-events-none, XL-screen only for the illustrations.
 */
export default function PageDecorations() {
  return (
    <>
      {/* Bottom gradient line */}
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none" />

      {/* Sakura decoration — top-left */}
      <div className="fixed top-1/4 left-10 pointer-events-none opacity-10 dark:opacity-5 hidden xl:block">
        <SakuraDecorationIcon />
      </div>

      {/* Cherry blossom — bottom-left */}
      <div className="fixed bottom-20 left-10 pointer-events-none text-sakura-pink hidden xl:block w-48 opacity-30 dark:opacity-15">
        <CherryBlossom />
      </div>

      {/* Circle accent — bottom-right */}
      <div className="fixed bottom-1/4 right-10 pointer-events-none opacity-10 dark:opacity-5 hidden xl:block">
        <div className="w-32 h-32 rounded-full border-2 border-primary" />
      </div>

      {/* Seigaiha pattern overlay */}
      <SeigaihaOverlay className="fixed opacity-30 dark:opacity-20" />
    </>
  )
}
