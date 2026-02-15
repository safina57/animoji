import { useAppDispatch, useAppSelector } from "@hooks/redux";
import { resetGeneration } from "@store/slices/generationSlice";
import ImageCompareSlider from "./ImageCompareSlider";
import type { GenerationResult } from "@store/slices/generationSlice";

export default function ResultView() {
  const dispatch = useAppDispatch();
  const results = useAppSelector((s) => s.generation.results);

  if (results.length === 0) return null;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-8 pb-8">
        {/* Header */}
        <div className="flex justify-between items-end px-2 pt-4 sticky top-0 bg-background-light dark:bg-background-dark z-10 pb-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
              Creation Timeline
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-japanese">
              あなたの創造の旅
            </p>
          </div>
          <button
            onClick={() => dispatch(resetGeneration())}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 hover:bg-primary/5 transition-all text-xs font-bold uppercase tracking-widest text-primary"
          >
            <span className="material-symbols-outlined text-sm">
              add_circle
            </span>
            Start New
          </button>
        </div>

        {/* Results Timeline */}
        <div className="space-y-12 relative">
          {/* Vertical timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent hidden md:block" />

          {results.map((result, index) => (
            <ResultItem
              key={result.jobId}
              result={result}
              index={index}
              isLatest={index === results.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Result Item Component ── */

interface ResultItemProps {
  result: GenerationResult;
  index: number;
  isLatest: boolean;
}

function ResultItem({ result, index, isLatest }: ResultItemProps) {
  const timeAgo = formatTimeAgo(result.timestamp);

  return (
    <div
      className="relative animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Timeline dot */}
      <div className="absolute -left-1 md:left-[30px] top-8 w-3 h-3 rounded-full bg-primary border-2 border-background-light dark:border-background-dark shadow-lg hidden md:block" />

      <div className="md:ml-20 space-y-4">
        {/* Prompt header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Iteration {index + 1}
              </span>
              <span className="text-xs text-slate-400">{timeAgo}</span>
              {isLatest && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                  Latest
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 italic">
              "{result.prompt}"
            </p>
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

          {/* Action buttons on hover */}
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionButton icon="favorite_border" />
            <ActionButton icon="download" />
            <ActionButton icon="share" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Small sub-components ── */

function ActionButton({ icon }: { icon: string }) {
  return (
    <button className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-primary hover:text-white transition-all shadow-lg border border-primary/10 flex items-center justify-center">
      <span className="material-symbols-outlined text-lg">{icon}</span>
    </button>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
