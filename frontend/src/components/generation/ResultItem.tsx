import ImageCompareSlider from "@components/generation/ImageCompareSlider"
import PublishButton from "@components/generation/PublishButton"
import type { GenerationResult } from "@customTypes/generation"

interface ResultItemProps {
  result: GenerationResult
  index: number
  isLatest: boolean
  jobId: string | null
}

export default function ResultItem({ result, index, isLatest, jobId }: ResultItemProps) {
  const timeAgo = formatTimeAgo(result.timestamp)

  async function handleDownload(url: string, iterationNum: number) {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = objectUrl
      a.download = `animoji-take-${iterationNum}.png`
      a.click()
      URL.revokeObjectURL(objectUrl)
    } catch {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <div className="flex gap-4 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
      {/* Timeline column */}
      <div className="hidden md:flex flex-col items-center w-8 shrink-0">
        <div className="mt-8 w-3 h-3 rounded-full bg-primary border-2 border-background-light dark:border-background-dark shadow-lg shrink-0" />
        <div className="flex-1 w-0.5 mt-2 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        {/* Prompt header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm shadow-primary/30">
                {result.iterationNum}
              </span>
              <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                Take {result.iterationNum}
              </span>
              <span className="text-slate-300 dark:text-slate-600 text-xs">·</span>
              <span className="text-xs text-slate-400">{timeAgo}</span>
              {isLatest && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  Latest
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{result.prompt}"</p>
          </div>
        </div>

        {/* Image comparison */}
        <div className="relative group">
          <div className="japanese-frame rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
            <ImageCompareSlider
              leftImage={result.originalImageUrl}
              rightImage={result.generatedImageUrl}
            />
          </div>

          {/* Download button — visible on hover */}
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionButton
              icon="download"
              onClick={() => handleDownload(result.generatedImageUrl, result.iterationNum)}
            />
          </div>

          {/* Publish button — always visible, latest only */}
          {isLatest && (
            <div className="absolute bottom-4 right-4">
              <PublishButton jobId={jobId} result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ActionButton({ icon, onClick }: { icon: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-primary hover:text-white transition-all shadow-lg border border-primary/10 flex items-center justify-center"
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
    </button>
  )
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
