import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@hooks/redux";
import { resetGeneration, markResultAsPublished } from "@store/slices/generationSlice";
import { publishImage } from "@services/generationService";
import { Button } from "@lib/ui/button";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@lib/ui/dialog";
import ImageCompareSlider from "./ImageCompareSlider";
import type { GenerationResult } from "@customTypes/generation";

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

/* ── Result Item ── */

interface ResultItemProps {
  result: GenerationResult;
  index: number;
  isLatest: boolean;
  jobId: string | null;
}

function ResultItem({ result, index, isLatest, jobId }: ResultItemProps) {
  const timeAgo = formatTimeAgo(result.timestamp);

  async function handleDownload(url: string, iterationNum: number) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `animoji-take-${iterationNum}.png`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div
      className="flex gap-4 animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Timeline column: dot + line, always centered via flex */}
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

          {/* Secondary action buttons — visible on hover */}
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionButton icon="download" onClick={() => handleDownload(result.generatedImageUrl, result.iterationNum)} />
          </div>

          {/* Publish button — always visible, bottom-right, latest only */}
          {isLatest && (
            <div className="absolute bottom-4 right-4">
              <PublishButton jobId={jobId} result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Publish Button + Modal ── */

interface PublishButtonProps {
  jobId: string | null;
  result: GenerationResult;
}

function PublishButton({ jobId, result }: PublishButtonProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPublished = !!result.publishedImageId;

  async function handleConfirm() {
    if (!jobId || isPublishing) return;
    setIsPublishing(true);
    setError(null);
    try {
      const response = await publishImage(jobId, visibility);
      dispatch(
        markResultAsPublished({
          iterationNum: result.iterationNum,
          imageId: response.image_id,
        })
      );
      setOpen(false);
      dispatch(resetGeneration());
      navigate(`/?image=${response.image_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  }

  /* Published state — non-interactive badge */
  if (isPublished) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white shadow-lg">
        <span className="material-symbols-outlined text-sm">check_circle</span>
        <span className="text-xs font-semibold">Published</span>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(null); }}>
      {/* Trigger — always-visible button on image */}
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="flex items-center gap-1.5 bg-white/90 dark:bg-paper-dark/90 border border-primary/10 rounded-2xl text-primary hover:border-primary/30 hover:bg-primary hover:text-white backdrop-blur-sm shadow-lg transition-all"
      >
        <span className="material-symbols-outlined text-sm">cloud_upload</span>
        <span className="text-xs font-semibold">Publish</span>
      </Button>

      {/* Custom portal — blur overlay, no X button, controlled size */}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-primary/10 bg-paper-light dark:bg-paper-dark paper-texture p-0 overflow-hidden shadow-xl shadow-primary/10 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

          <div className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-base font-display font-bold text-slate-900 dark:text-white">
                Publish to Gallery
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 font-japanese">
                ギャラリーに公開する
              </DialogDescription>
            </DialogHeader>

            {/* Visibility selector */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Visibility
              </p>
              <div className="grid grid-cols-2 gap-2">
                <VisibilityOption
                  value="public"
                  selected={visibility === "public"}
                  onSelect={() => setVisibility("public")}
                  icon="public"
                  label="Public"
                  description="Anyone can see it"
                />
                <VisibilityOption
                  value="private"
                  selected={visibility === "private"}
                  onSelect={() => setVisibility("private")}
                  icon="lock"
                  label="Private"
                  description="Only you can see it"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </p>
            )}

            {/* Footer */}
            <DialogFooter className="gap-2 sm:gap-2">
              <DialogClose asChild>
                <Button variant="outline" size="sm" disabled={isPublishing} className="flex-1">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={isPublishing}
                className="flex-1 gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20"
              >
                {isPublishing ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                    Publishing…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">
                      cloud_upload
                    </span>
                    Confirm
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}

/* ── Visibility option card ── */

interface VisibilityOptionProps {
  value: "public" | "private";
  selected: boolean;
  onSelect: () => void;
  icon: string;
  label: string;
  description: string;
}

function VisibilityOption({ selected, onSelect, icon, label, description }: VisibilityOptionProps) {
  return (
    <button
      onClick={onSelect}
      className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5 dark:bg-primary/10"
          : "border-slate-200 dark:border-slate-700 hover:border-primary/40"
      }`}
    >
      <span
        className={`material-symbols-outlined text-lg ${
          selected ? "text-primary" : "text-slate-400"
        }`}
      >
        {icon}
      </span>
      <span
        className={`text-xs font-semibold ${
          selected ? "text-primary" : "text-slate-600 dark:text-slate-300"
        }`}
      >
        {label}
      </span>
      <span className="text-[10px] text-slate-400 leading-tight">{description}</span>
    </button>
  );
}

/* ── Small sub-components ── */

function ActionButton({ icon, onClick }: { icon: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-primary hover:text-white transition-all shadow-lg border border-primary/10 flex items-center justify-center">
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
