import { memo, useState } from "react"
import { cn } from "@lib/utils"
import type { EmojiPackGalleryItem } from "@customTypes/emoji"

interface EmojiPackCardProps {
  pack: EmojiPackGalleryItem
  onClick: () => void
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

const EmojiPackCard = memo(function EmojiPackCard({ pack, onClick }: EmojiPackCardProps) {
  const previews = pack.variants.slice(0, 4)
  const emptySlots = Math.max(0, 4 - previews.length)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className="group relative w-full text-left break-inside-avoid rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-md hover:shadow-xl hover:border-primary/20 border border-transparent transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
    >
      {/* 2×2 emoji preview — mirrors ImageCard's image area */}
      <div className="relative overflow-hidden">
        <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800/60">
          {previews.map((v) => (
            <EmojiCell key={v.id} url={v.url} emotion={v.emotion} />
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square bg-slate-50 dark:bg-slate-900/80" />
          ))}
        </div>

        {/* Gradient scrim — exact match to ImageCard */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Hover affordance */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-white text-[11px] font-semibold bg-black/25 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
            View Pack
          </span>
        </div>
      </div>

      {/* Bottom strip — mirrors ImageCard's user info area */}
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-primary/70">
            emoji_emotions
          </span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
            {pack.variants.length} sticker{pack.variants.length !== 1 ? "s" : ""}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
          {formatRelativeDate(pack.created_at)}
        </span>
      </div>
    </div>
  )
})

function EmojiCell({ url, emotion }: { url: string; emotion: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className="aspect-square bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden relative">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-slate-100 dark:bg-slate-800/60" />
      )}
      <img
        src={url}
        alt={emotion}
        className={cn(
          "w-4/5 h-4/5 object-contain transition-all duration-500 group-hover:scale-105",
          loaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}

export default EmojiPackCard
