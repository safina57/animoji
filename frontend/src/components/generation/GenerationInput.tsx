import { useRef, type ChangeEvent, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@hooks/redux";
import {
  setPrompt,
  setReferenceImage,
  startGeneration,
  setJobId,
  failGeneration,
} from "@store/slices/generationSlice";
import { submitJob } from "@services/apiClient";
import { Button } from "@lib/ui/button";

const SUGGESTIONS = ["Cyberpunk Tokyo", "Studio Ghibli Forest", "90s Retro Anime"];

export default function GenerationInput() {
  const dispatch = useAppDispatch();
  const { prompt, referenceImage, referencePreviewUrl, stage } = useAppSelector(
    (s) => s.generation
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBottom = stage === "result";

  /* ── File selection ── */
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    dispatch(setReferenceImage({ file, previewUrl }));
  }

  function removeImage() {
    dispatch(setReferenceImage(null));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /* ── Generation ── */
  async function generate() {
    if (!prompt.trim()) return;
    if (!referenceImage) {
      dispatch(failGeneration("Please upload an image first"));
      return;
    }

    dispatch(startGeneration());

    try {
      const result = await submitJob(referenceImage, prompt);
      dispatch(setJobId(result.job_id)); // Store job_id to trigger SSE connection
    } catch (error) {
      dispatch(
        failGeneration(
          error instanceof Error ? error.message : "Something went wrong. Please try again."
        )
      );
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      generate();
    }
  }

  /* ── Layout wrappers by stage ── */
  const wrapperClass = isBottom
    ? "w-full max-w-4xl mx-auto pb-6 pt-2 shrink-0 animate-slide-down"
    : "w-full max-w-3xl space-y-12";

  return (
    <div
      className={
        isBottom
          ? wrapperClass
          : "flex-1 flex flex-col items-center justify-center p-6 md:p-12"
      }
    >
      <div className={isBottom ? "" : "w-full max-w-3xl space-y-12"}>
        {/* Hero text — only shown in initial input stage */}
        {!isBottom && (
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-slate-900 dark:text-white">
              What shall we create today?
            </h1>
            <p className="text-sm md:text-base text-primary/60 dark:text-primary/40 font-japanese uppercase tracking-[0.4em] font-medium">
              今日は何を作りましょうか
            </p>
          </div>
        )}

        {/* Input card */}
        <div className="relative group">
          {/* Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />

          <div className="relative bg-paper-light dark:bg-paper-dark paper-texture rounded-3xl border border-primary/10 shadow-xl shadow-primary/5 p-2 flex flex-col gap-2 transition-all duration-300 focus-within:border-primary/30 focus-within:shadow-primary/10">
            {/* Reference image preview */}
            {referencePreviewUrl && (
              <div className="relative mx-4 mt-2">
                <img
                  src={referencePreviewUrl}
                  alt="Reference"
                  className="h-20 w-20 object-cover rounded-xl border border-primary/10"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            )}

            {/* Input row */}
            <div className="flex items-center gap-2">
              {/* Add image button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-12 h-12 rounded-2xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-3xl">
                  add_photo_alternate
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              <textarea
                value={prompt}
                onChange={(e) => dispatch(setPrompt(e.target.value))}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-lg md:text-xl font-display placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none py-3"
                placeholder={
                  isBottom
                    ? "Change the lighting to sunset..."
                    : "Describe your anime vision..."
                }
                rows={1}
              />

              {/* Generate button */}
              <Button
                onClick={generate}
                disabled={!prompt.trim()}
                size="icon"
                className="shrink-0"
                aria-label="Generate image"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Vertical Japanese decoration */}
          {!isBottom && (
            <div className="absolute -right-16 top-1/2 -translate-y-1/2 hidden xl:block pointer-events-none">
              <p className="[writing-mode:vertical-rl] text-primary/20 font-japanese text-2xl tracking-[0.5em] font-bold">
                想像力
              </p>
            </div>
          )}
        </div>

        {/* Suggestion chips — only in initial stage */}
        {!isBottom && (
          <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-2">
              Suggestions:
            </span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => dispatch(setPrompt(s))}
                className="px-4 py-1.5 rounded-full border border-primary/10 text-xs font-medium hover:bg-primary hover:text-white hover:border-primary transition-all text-slate-500 dark:text-slate-400"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Subtitle under input when at bottom */}
        {isBottom && (
          <p className="text-center text-[10px] text-slate-400 mt-3 uppercase tracking-widest font-medium">
            Refine your vision or start a new prompt
          </p>
        )}
      </div>
    </div>
  );
}
