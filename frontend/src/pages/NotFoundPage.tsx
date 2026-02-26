import { Link } from "react-router-dom"
import { Button } from "@lib/ui/button"
import { Home, Wand2 } from "lucide-react"
import FallingPetals from "@lib/decorations/FallingPetals/FallingPetals"
import ToriiGateSilhouette from "@lib/decorations/ToriiGateSilhouette/ToriiGateSilhouette"
import SeigaihaOverlay from "@lib/decorations/SeigaihaOverlay/SeigaihaOverlay"

const STARS = Array.from({ length: 58 }, (_, i) => ({
  left: `${((i * 37 + 13) % 96) + 2}%`,
  top: `${((i * 61 + 7) % 58) + 1}%`,
  size: (i % 3) + 1,
  delay: `${((i * 0.41) % 4).toFixed(1)}s`,
  duration: `${(2.2 + (i % 4) * 0.55).toFixed(1)}s`,
}))

/* ─── Page ─── */
export default function NotFoundPage() {
  return (
    <div className="relative flex-1 min-h-[calc(100vh-4rem)] overflow-hidden flex items-center justify-center isolate bg-background-light dark:bg-background-dark">
      {/* ── Subtle gradient atmosphere (uses theme tokens) ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-sakura-pink/5 pointer-events-none" />

      {/* ── Stars — dark mode only ── */}
      <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-500">
        {STARS.map((star, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animation: `twinkle ${star.duration} ease-in-out ${star.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* ── Sakura petals ── */}
      <FallingPetals count={12} />

      {/* ── Torii gate silhouette — bottom center ── */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] md:w-[560px] lg:w-[680px] text-primary pointer-events-none"
        style={{ opacity: 0.13 }}
      >
        <ToriiGateSilhouette />
      </div>

      {/* ── Seigaiha pattern overlay ── */}
      <SeigaihaOverlay className="absolute opacity-20 dark:opacity-10" />

      {/* ── Main content ── */}
      <div className="relative z-10 text-center px-6 py-12 w-full max-w-2xl mx-auto">
        {/* Vertical Japanese text — left */}
        <span
          className="absolute -left-4 xl:-left-16 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl] hidden lg:block pointer-events-none select-none font-japanese font-bold text-5xl tracking-[0.6em] text-primary/10 dark:text-primary/[0.07]"
          aria-hidden="true"
        >
          四〇四
        </span>

        {/* Vertical Japanese text — right */}
        <span
          className="absolute -right-4 xl:-right-16 top-1/2 -translate-y-1/2 [writing-mode:vertical-lr] hidden lg:block pointer-events-none select-none font-japanese font-bold text-5xl tracking-[0.6em] text-primary/10 dark:text-primary/[0.07]"
          aria-hidden="true"
        >
          聖域外
        </span>

        {/* 404 */}
        <div className="relative inline-block animate-fade-in" aria-label="404">
          <span
            className="text-[150px] md:text-[210px] font-display font-bold leading-none tracking-tight select-none text-primary"
            style={{ filter: "drop-shadow(0 0 40px rgba(230, 57, 70, 0.25))" }}
          >
            404
          </span>
        </div>

        {/* Heading */}
        <div
          className="space-y-3 mt-1 animate-slide-up"
          style={{ animationDelay: "0.15s", animationFillMode: "both" }}
        >
          <h1 className="text-3xl md:text-5xl font-display font-bold text-slate-900 dark:text-white">
            Lost in the Shrine
          </h1>
          <p className="text-primary/65 dark:text-primary/45 font-japanese text-lg tracking-[0.35em]">
            迷子になりました
          </p>
        </div>

        {/* Description */}
        <p
          className="mt-6 text-slate-600 dark:text-slate-400 text-base leading-relaxed max-w-sm mx-auto animate-fade-in"
          style={{ animationDelay: "0.3s", animationFillMode: "both" }}
        >
          The spirits have led you astray. This page has wandered beyond the torii gate into the
          unknown realm.
        </p>

        {/* CTA buttons */}
        <div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
          style={{ animationDelay: "0.45s", animationFillMode: "both" }}
        >
          <Link to="/">
            <Button size="lg" className="gap-2">
              <Home className="h-4 w-4" />
              Return Home
            </Button>
          </Link>
          <Link to="/create">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-slate-600 dark:text-slate-400 hover:text-primary"
            >
              <Wand2 className="h-4 w-4" />
              Start Creating
            </Button>
          </Link>
        </div>

        {/* Divider with shrine motif */}
        <div
          className="mt-12 flex items-center justify-center gap-6 animate-fade-in"
          style={{ animationDelay: "0.6s", animationFillMode: "both" }}
        >
          <div className="flex-1 max-w-[80px] border-t border-primary/15 dark:border-primary/10" />
          <span className="font-japanese text-xs text-primary/30 dark:text-primary/20 tracking-[0.4em]">
            鳥居
          </span>
          <div className="flex-1 max-w-[80px] border-t border-primary/15 dark:border-primary/10" />
        </div>
      </div>
    </div>
  )
}
