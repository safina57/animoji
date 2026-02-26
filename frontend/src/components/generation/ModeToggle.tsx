import type { CreateMode } from "@customTypes/generation"

interface ModeToggleProps {
  mode: CreateMode
  onToggle: () => void
  currentLabel: string
  switchLabel: string
}

export default function ModeToggle({ mode, onToggle, currentLabel, switchLabel }: ModeToggleProps) {
  const isAnime = mode === "anime"

  return (
    <div className="relative group/mode shrink-0">
      <button
        onClick={onToggle}
        className="flex items-center justify-center w-9 h-9 rounded-xl border border-primary/15 text-primary/40 hover:text-primary hover:border-primary/35 hover:bg-primary/5 transition-all"
        aria-label={`Switch to ${switchLabel} mode`}
      >
        <span className="material-symbols-outlined text-[20px]">
          {isAnime ? "auto_fix_high" : "emoji_emotions"}
        </span>
      </button>

      {/* Tooltip */}
      <div className="absolute left-0 bottom-full mb-2.5 opacity-0 group-hover/mode:opacity-100 transition-opacity pointer-events-none z-50 min-w-[148px]">
        <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-white/10">
          <p className="font-semibold">{currentLabel}</p>
          <p className="text-white/50 mt-0.5 text-[11px]">Switch to {switchLabel}</p>
        </div>
        <div className="absolute left-3 top-full w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45 border-r border-b border-white/10 -mt-1" />
      </div>
    </div>
  )
}
