import { useAppDispatch, useAppSelector } from "@hooks/redux";
import { resetGeneration } from "@store/slices/generationSlice";
import ResultItem from "@components/generation/ResultItem";

export default function ResultView() {
  const dispatch = useAppDispatch();
  const results = useAppSelector((s) => s.generation.results);
  const jobId = useAppSelector((s) => s.generation.jobId);

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
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Start New
          </button>
        </div>

        {/* Results Timeline */}
        <div className="space-y-12">
          {results.map((result, index) => (
            <ResultItem
              key={index}
              result={result}
              index={index}
              isLatest={index === results.length - 1}
              jobId={jobId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
