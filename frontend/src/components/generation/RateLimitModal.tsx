import { useEffect, useRef } from "react"
import gsap from "gsap"
import SeigaihaOverlay from "@lib/decorations/SeigaihaOverlay/SeigaihaOverlay"
import ToriiGateIcon from "@lib/decorations/ToriiGateIcon/ToriiGateIcon"
import type { CreateMode } from "@customTypes/generation"

interface RateLimitModalProps {
  onClose: () => void
  limit: number
  resetAt: string
  mode: CreateMode
}

function formatTimeUntil(resetAt: string): string {
  if (!resetAt) return "tomorrow"
  const diffMs = new Date(resetAt).getTime() - Date.now()
  if (diffMs <= 0) return "very soon"
  const h = Math.floor(diffMs / 3_600_000)
  const m = Math.floor((diffMs % 3_600_000) / 60_000)
  if (h >= 1) return `${h}h ${m}m`
  if (m >= 1) return `${m}m`
  return "less than a minute"
}

function formatResetClock(resetAt: string): string {
  if (!resetAt) return "midnight UTC"
  return new Date(resetAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

const MODE_LABEL: Record<CreateMode, string> = {
  anime: "anime generations",
  emoji: "emoji pack generations",
}

export default function RateLimitModal({ onClose, limit, resetAt, mode }: RateLimitModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power2.out" } })
        .fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.35 })
        .fromTo(
          cardRef.current,
          { opacity: 0, scale: 0.92, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.4)" },
          "<0.05"
        )
        .fromTo(
          iconRef.current,
          { opacity: 0, scale: 0.85, y: 10 },
          { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.8)" },
          "<0.1"
        )
        .fromTo(
          textRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4 },
          "<0.1"
        )
        .fromTo(
          btnRef.current,
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.3 },
          "<0.08"
        )
    })

    return () => ctx.revert()
  }, [])

  const timeUntil = formatTimeUntil(resetAt)
  const resetClock = formatResetClock(resetAt)

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div
        ref={cardRef}
        className="
          relative w-full max-w-xs rounded-2xl
          bg-paper-light dark:bg-paper-dark
          border border-primary/15 dark:border-sakura-pink/20
          shadow-2xl shadow-black/20 dark:shadow-black/50
          flex flex-col items-center gap-6 px-8 py-10
          select-none overflow-hidden
        "
      >
        <SeigaihaOverlay className="absolute opacity-80 dark:opacity-50" />

        {/* Icon */}
        <div ref={iconRef} className="relative z-10">
          <div className="absolute inset-0 rounded-full bg-primary/15 dark:bg-sakura-pink/15 blur-2xl" />
          <ToriiGateIcon className="relative w-20 h-16 text-primary dark:text-sakura-pink" />
        </div>

        {/* Text */}
        <div ref={textRef} className="relative z-10 flex flex-col items-center gap-2 text-center">
          <h2 className="font-display font-semibold text-lg tracking-wide text-slate-800 dark:text-slate-100">
            Daily limit reached
          </h2>
          <p className="text-xs tracking-[0.25em] font-japanese text-primary/45 dark:text-sakura-pink/45">
            明日またどうぞ
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed max-w-[185px] mt-1">
            You've used all{" "}
            <span className="font-semibold text-primary dark:text-sakura-pink">{limit}</span> of
            today's {MODE_LABEL[mode]}.
          </p>

          {/* Reset pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 dark:bg-sakura-pink/8 border border-primary/10 dark:border-sakura-pink/15 mt-1">
            <span className="text-[8px] text-primary dark:text-sakura-pink">◉</span>
            <span className="font-display text-[10px] text-slate-600 dark:text-slate-300">
              Resets in{" "}
              <span className="font-semibold text-primary dark:text-sakura-pink">{timeUntil}</span>
              {" at "}
              <span className="font-semibold">{resetClock}</span>
            </span>
          </div>
        </div>

        {/* Button */}
        <button
          ref={btnRef}
          onClick={onClose}
          className="relative z-10 w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-display text-sm tracking-wide active:scale-95 transition-all duration-200"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
