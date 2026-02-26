import { useState } from "react"
import { Check, Link, Download } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@lib/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@lib/ui/avatar"
import SeigaihaOverlay from "@lib/decorations/SeigaihaOverlay/SeigaihaOverlay"
import TempleBuilding from "@lib/decorations/TempleBuilding/TempleBuilding"
import { useAppSelector } from "@hooks/redux"
import { cn } from "@lib/utils"
import type { EmojiPackGalleryItem, EmojiVariantGalleryItem } from "@customTypes/emoji"

interface EmojiPackDetailDialogProps {
  pack: EmojiPackGalleryItem | null
  open: boolean
  onClose: () => void
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

async function downloadVariant(url: string, emotion: string) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = `sticker-${emotion}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
  } catch {
    window.open(url, "_blank")
  }
}

export function EmojiPackDetailDialog({ pack, open, onClose }: EmojiPackDetailDialogProps) {
  const user = useAppSelector((s) => s.auth.user)

  if (!pack) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {/* Exact same shell as ImageDetailDialog */}
      <DialogContent className="w-[95vw] max-w-5xl p-0 gap-0 overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900 shadow-2xl shadow-black/20 dark:shadow-black/60">
        <DialogTitle className="sr-only">Sticker Pack</DialogTitle>

        <div className="flex flex-col md:flex-row md:max-h-[88vh]">
          {/* Left: variants grid — fills like the image panel */}
          <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
            <div className="min-h-full flex items-center justify-center p-6">
              <div className="flex flex-wrap justify-center gap-4">
                {pack.variants.map((variant) => (
                  <div key={variant.id} className="w-44 sm:w-48 shrink-0">
                    <VariantItem variant={variant} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: metadata panel — exact structure from ImageDetailDialog */}
          <div className="relative w-full md:w-72 shrink-0 flex flex-col overflow-y-auto border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 bg-paper-light dark:bg-paper-dark paper-texture bg-cover bg-center">
            <SeigaihaOverlay className="absolute opacity-60 dark:opacity-25" />

            {/* Top accent bar */}
            <div className="relative h-0.5 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 shrink-0" />

            <div className="relative flex flex-col gap-5 p-6 flex-1">
              {/* User info */}
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarImage src={user?.avatar_url ?? ""} alt={user?.name ?? ""} />
                  <AvatarFallback>{user?.name?.charAt(0).toUpperCase() ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-display font-semibold text-slate-900 dark:text-white leading-tight truncate">
                    {user?.name ?? "You"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(pack.created_at)}
                  </p>
                </div>
              </div>

              <div className="h-px bg-primary/10" />

              {/* Pack info — mirrors the Prompt section */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Sticker Pack
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {pack.variants.length} emotion{pack.variants.length !== 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {pack.variants.map((v) => (
                    <span
                      key={v.id}
                      className="text-[10px] bg-primary/8 dark:bg-primary/12 text-primary border border-primary/15 rounded-full px-2 py-0.5 font-medium"
                    >
                      {capitalize(v.emotion)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Temple decoration — same as ImageDetailDialog's short-prompt filler */}
              <div className="flex flex-col items-center gap-3 py-4 mt-auto select-none">
                <TempleBuilding className="w-24 h-24 text-primary opacity-[0.11] dark:opacity-[0.08]" />
                <p className="text-[10px] font-japanese text-muted-foreground tracking-widest">
                  あなたのスタンプ
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Single variant card inside the dialog ── */
function VariantItem({ variant }: { variant: EmojiVariantGalleryItem }) {
  const [loaded, setLoaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(variant.url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDownload() {
    setDownloading(true)
    await downloadVariant(variant.url, variant.emotion)
    setDownloading(false)
  }

  /* Exact button style lifted from ImageDetailDialog's action overlay */
  const btnBase =
    "flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-sm shadow-lg text-sm font-medium border transition-all"
  const btnIdle =
    "bg-white/90 dark:bg-paper-dark/90 text-primary border-primary/10 hover:bg-primary hover:text-white hover:border-transparent"
  const btnActive = "bg-primary/90 text-white border-transparent"

  return (
    <div className="group relative aspect-square rounded-xl overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
      )}
      <img
        src={variant.url}
        alt={`${variant.emotion} sticker`}
        className={cn(
          "absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setLoaded(true)}
      />

      {/* Gradient scrim — same as ImageDetailDialog */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/65 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Action row — split left/right, matches ImageDetailDialog overlay layout */}
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Right: copy + download */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className={cn(btnBase, copied ? btnActive : btnIdle)}
            aria-label={`Copy link for ${variant.emotion}`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className={cn(btnBase, btnIdle, "disabled:opacity-60")}
            aria-label={`Download ${variant.emotion} sticker`}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
