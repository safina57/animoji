import { useEffect, useRef, useState } from "react";
import { Heart, Download, Share2, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dialog, DialogTitle } from "@lib/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@lib/ui/avatar";
import { imageService } from "@services/imageService";
import { useAppDispatch, useAppSelector } from "@hooks/redux";
import { updateLikedStatus } from "@store/slices/feedSlice";
import type { ImageFeedItem, ImageDetailItem } from "@customTypes/image";

interface ImageDetailDialogProps {
  item: ImageFeedItem | null;
  open: boolean;
  onClose: () => void;
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

  // On open: fetch fresh detail (for accurate likes_count) + check liked state
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

    if (isAuthenticated) {
      imageService.checkLiked(item.id).then(setLiked).catch(() => {});
    }
  }, [item?.id, open, isAuthenticated]);

  if (!item) return null;

  const displayItem = detail ?? item;
  const lastPrompt = displayItem.prompts[displayItem.prompts.length - 1] ?? "";
  const formattedDate = new Date(displayItem.created_at).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        {/* Backdrop — blur overlay matching publish modal pattern */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none">
          <DialogTitle className="sr-only">
            {lastPrompt || "Image detail"}
          </DialogTitle>

          {/* Close button */}
          <DialogPrimitive.Close
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60 transition-colors focus:outline-none"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </DialogPrimitive.Close>

          <div className="flex flex-col md:flex-row md:max-h-[88vh]">
            {/* Left: image panel with hover action buttons */}
            <div className="group relative flex-1 min-h-[280px] bg-[#0F111A] flex items-center justify-center overflow-hidden">
              <img
                src={displayItem.generated_url}
                alt={lastPrompt}
                className="max-h-[88vh] w-full object-contain"
              />

              {/* Action overlay — bottom row, split left/right, on image hover */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* Left: like */}
                <button
                  type="button"
                  onClick={handleToggleLike}
                  disabled={likeLoading}
                  className={[
                    "flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-sm shadow-lg text-sm font-medium transition-all",
                    liked
                      ? "bg-rose-500/90 text-white"
                      : "bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-rose-500/90 hover:text-white",
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
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-primary hover:text-white transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{copyFeedback ? "Copied!" : "Share"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-primary hover:text-white transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: metadata panel */}
            <div className="w-full md:w-72 shrink-0 flex flex-col gap-5 p-6 overflow-y-auto border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700">
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
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                    {displayItem.user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formattedDate}
                  </p>
                </div>
              </div>

              {/* Prompt */}
              {lastPrompt && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    Prompt
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {lastPrompt}
                  </p>
                  {displayItem.prompts.length > 1 && (
                    <p className="text-xs text-slate-400 mt-1">
                      +{displayItem.prompts.length - 1} refinement
                      {displayItem.prompts.length > 2 ? "s" : ""}
                    </p>
                  )}
                </div>
              )}

              {/* Likes stat */}
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Heart className="w-4 h-4 text-rose-400" />
                <span className="text-sm">{likesCount} likes</span>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}
