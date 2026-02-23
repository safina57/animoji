import { useEffect, useRef, useState } from "react";
import { Heart, Download, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@lib/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@lib/ui/avatar";
import { imageService } from "@services/imageService";
import SeigaihaOverlay from "@lib/decorations/SeigaihaOverlay/SeigaihaOverlay";
import { useAppDispatch, useAppSelector } from "@hooks/redux";
import { updateLikedStatus } from "@store/slices/feedSlice";
import type { ImageFeedItem, ImageDetailItem } from "@customTypes/image";

interface ImageDetailDialogProps {
  item: ImageFeedItem | null;
  open: boolean;
  onClose: () => void;
}

/* ── 2D Temple SVG ── */
function TempleBuilding({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Spire */}
      <rect x="57" y="0" width="6" height="14" rx="3" fill="currentColor" />
      <rect x="53" y="12" width="14" height="4" rx="2" fill="currentColor" />

      {/* Roof tier 1 (top, smallest) */}
      <path d="M44 16 L60 11 L76 16 L82 27 H38 Z" fill="currentColor" />
      <rect x="47" y="27" width="26" height="7" rx="1" fill="currentColor" />

      {/* Roof tier 2 (mid) */}
      <path d="M27 34 L60 27 L93 34 L100 46 H20 Z" fill="currentColor" />
      <rect x="34" y="46" width="52" height="9" rx="1" fill="currentColor" />

      {/* Roof tier 3 (main, widest) */}
      <path d="M8 55 L60 46 L112 55 L120 68 H0 Z" fill="currentColor" />

      {/* Main hall body */}
      <rect x="18" y="68" width="84" height="28" rx="2" fill="currentColor" />

      {/* Steps */}
      <rect x="12" y="96" width="96" height="5" rx="2" fill="currentColor" />
      <rect x="5" y="101" width="110" height="5" rx="2" fill="currentColor" />
      <rect x="0" y="106" width="120" height="5" rx="2" fill="currentColor" />
    </svg>
  );
}

export function ImageDetailDialog({
  item,
  open,
  onClose,
}: ImageDetailDialogProps) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const [detail, setDetail] = useState<ImageDetailItem | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On open: fetch fresh detail (for accurate likes_count)
  useEffect(() => {
    if (!item || !open) return;

    setDetail(null);
    setLiked(false);
    setLikesCount(0);

    imageService
      .fetchImageDetail(item.id)
      .then((d) => {
        setDetail(d);
        setLikesCount(d.likes_count);
      })
      .catch(() => {});

    if (item.is_liked_by_user !== undefined) {
      setLiked(item.is_liked_by_user);
    } else if (isAuthenticated) {
      imageService.checkLiked(item.id).then(setLiked).catch(() => {});
    }
  }, [item?.id, open, isAuthenticated]);

  if (!item) return null;

  const displayItem = detail ?? item;
  const lastPrompt = detail ? (detail.prompts[detail.prompts.length - 1] ?? "") : "";
  const formattedDate = detail
    ? new Date(detail.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      window.location.href = "/auth";
      return;
    }
    if (likeLoading) return;
    setLikeLoading(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount((c) => (wasLiked ? c - 1 : c + 1));
    try {
      if (wasLiked) {
        await imageService.unlikeImage(item.id);
      } else {
        await imageService.likeImage(item.id);
      }
      dispatch(updateLikedStatus({ imageId: item.id, liked: !wasLiked }));
    } catch {
      setLiked(wasLiked);
      setLikesCount((c) => (wasLiked ? c + 1 : c - 1));
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}?image=${item.id}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopyFeedback(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(displayItem.generated_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `animoji-${item.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(displayItem.generated_url, "_blank");
    }
  };

  const isShortPrompt = detail && lastPrompt.length < 100;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[95vw] max-w-5xl p-0 gap-0 overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900 shadow-2xl shadow-black/20 dark:shadow-black/60">
        <DialogTitle className="sr-only">
          {lastPrompt || "Image detail"}
        </DialogTitle>

        <div className="flex flex-col md:flex-row md:max-h-[88vh]">
          {/* Left: image panel */}
          <div className="group relative flex-1 min-h-[280px] bg-background-light dark:bg-background-dark flex items-center justify-center overflow-hidden">
            <img
              src={displayItem.generated_url}
              alt={lastPrompt}
              className="max-h-[88vh] w-full object-contain"
            />

            {/* Gradient scrim */}
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/65 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Action overlay — bottom row, split left/right, on hover */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* Left: like */}
              <button
                type="button"
                onClick={handleToggleLike}
                disabled={likeLoading}
                className={[
                  "flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-sm shadow-lg text-sm font-medium border transition-all",
                  liked
                    ? "bg-primary/90 text-white border-transparent"
                    : "bg-white/90 dark:bg-paper-dark/90 text-primary border-primary/10 hover:bg-primary hover:text-white hover:border-transparent",
                ].join(" ")}
              >
                <Heart
                  className={[
                    "w-4 h-4",
                    liked ? "fill-white" : "",
                  ].join(" ")}
                />
                <span>{likesCount}</span>
              </button>

              {/* Right: share + download */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className={[
                    "flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-sm shadow-lg text-sm font-medium border transition-all",
                    copyFeedback
                      ? "bg-primary/90 text-white border-transparent"
                      : "bg-white/90 dark:bg-paper-dark/90 text-primary border-primary/10 hover:bg-primary hover:text-white hover:border-transparent",
                  ].join(" ")}
                >
                  <Share2 className="w-4 h-4" />
                  <span>{copyFeedback ? "Copied!" : "Share"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 dark:bg-paper-dark/90 backdrop-blur-sm shadow-lg text-sm font-medium text-primary border border-primary/10 hover:bg-primary hover:text-white hover:border-transparent transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: gallery card panel */}
          <div className="relative w-full md:w-72 shrink-0 flex flex-col overflow-y-auto border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 bg-paper-light dark:bg-paper-dark paper-texture bg-cover bg-center">
            {/* Seigaiha pattern overlay */}
            <SeigaihaOverlay className="absolute opacity-60 dark:opacity-25" />

            {/* Top accent bar */}
            <div className="relative h-0.5 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 shrink-0" />

            <div className="relative flex flex-col gap-5 p-6 flex-1">
              {/* User info */}
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarImage
                    src={displayItem.user.avatar_url}
                    alt={displayItem.user.name}
                  />
                  <AvatarFallback>
                    {displayItem.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-display font-semibold text-slate-900 dark:text-white leading-tight truncate">
                    {displayItem.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formattedDate}
                  </p>
                </div>
              </div>

              <div className="h-px bg-primary/10" />

              {/* Prompt — shadcn blockquote pattern */}
              {lastPrompt && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Prompt
                  </p>
                  <blockquote className="mt-1 border-l-2 border-primary/60 pl-5 italic">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {lastPrompt}
                    </p>
                  </blockquote>
                  {detail && detail.prompts.length > 1 && (
                    <p className="text-[11px] text-muted-foreground pl-5">
                      +{detail.prompts.length - 1} refinement
                      {detail.prompts.length > 2 ? "s" : ""}
                    </p>
                  )}
                </div>
              )}

              {/* Temple decorative filler for short prompts */}
              {isShortPrompt && (
                <div className="flex flex-col items-center gap-3 py-4 mt-auto select-none">
                  <TempleBuilding className="w-24 h-24 text-primary opacity-[0.11] dark:opacity-[0.08]" />
                  <p className="text-[10px] font-japanese text-muted-foreground tracking-widest">
                    あなたの創造物
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
