import { useAppDispatch, useAppSelector } from "@shared/hooks/redux";
import { resetGeneration } from "@store/slices/generationSlice";
import ImageCompareSlider from "./ImageCompareSlider";

export default function ResultView() {
  const dispatch = useAppDispatch();
  const { originalImageUrl, generatedImageUrl } = useAppSelector(
    (s) => s.generation
  );

  if (!originalImageUrl || !generatedImageUrl) return null;

  return (
    <div className="flex-1 flex gap-8 items-center justify-center min-h-0 animate-slide-up">
      {/* Main image area */}
      <div className="relative h-full flex items-center justify-center flex-1">
        <div className="relative group max-h-full w-full max-w-xl">
          {/* Header */}
          <div className="flex justify-between items-end mb-4 px-2">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                Creation Complete
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-japanese">
                あなたの傑作が完成しました
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => dispatch(resetGeneration())}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 hover:bg-primary/5 transition-all text-xs font-bold uppercase tracking-widest text-primary"
              >
                <span className="material-symbols-outlined text-sm">
                  add_circle
                </span>
                New
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 hover:bg-primary/5 transition-all text-xs font-bold uppercase tracking-widest text-primary">
                <span className="material-symbols-outlined text-sm">
                  history
                </span>
                History
              </button>
            </div>
          </div>

          {/* Compare slider container */}
          <div className="japanese-frame rounded-xl overflow-hidden transition-transform duration-500 hover:scale-[1.005]">
            <div className="rounded-lg overflow-hidden">
              <ImageCompareSlider
                leftImage={originalImageUrl}
                rightImage={generatedImageUrl}
              />
            </div>
          </div>

          {/* Refine button */}
          <button className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white dark:bg-paper-dark px-5 py-2.5 rounded-full shadow-xl border border-primary/10 hover:border-primary/40 transition-all z-10">
            <span className="material-symbols-outlined text-primary text-lg">
              edit_note
            </span>
            <span className="text-xs font-bold uppercase tracking-tighter">
              Refine details
            </span>
          </button>
        </div>

        {/* Vertical Japanese text */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden xl:block">
          <p className="[writing-mode:vertical-rl] text-primary/30 font-japanese text-3xl tracking-[0.5em] font-bold select-none">
            創造の美
          </p>
        </div>
      </div>

      {/* Side action buttons */}
      <aside className="flex flex-col gap-4 py-8 shrink-0">
        <div className="flex flex-col gap-3">
          <ActionButton icon="favorite" label="Save" />
          <ActionButton icon="share" label="Share" />
          <ActionButton icon="download" label="Get" />
        </div>
        <div className="h-px w-8 bg-primary/10 mx-auto" />
        <ActionButton icon="more_horiz" label="More" />
      </aside>
    </div>
  );
}

/* ── Small sub-components ── */

function ActionButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="group flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-paper-light dark:bg-paper-dark hover:bg-primary hover:text-white transition-all shadow-sm border border-primary/5">
      <span className="material-symbols-outlined mb-1">{icon}</span>
      <span className="text-[9px] font-bold uppercase">{label}</span>
    </button>
  );
}
