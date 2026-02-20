import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@hooks/redux";
import { loadFeed, loadMoreFeed } from "@store/slices/feedSlice";
import { imageService } from "@services/imageService";
import { ImageCard } from "@components/community/ImageCard";
import { ImageDetailDialog } from "@components/community/ImageDetailDialog";
import type { ImageFeedItem } from "@customTypes/image";

// Torii gate SVG for empty state
function ToriiGate({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="5" y="18" width="110" height="8" rx="4" fill="currentColor" />
      <rect x="15" y="28" width="90" height="6" rx="3" fill="currentColor" />
      <rect x="20" y="34" width="8" height="62" rx="4" fill="currentColor" />
      <rect x="92" y="34" width="8" height="62" rx="4" fill="currentColor" />
      <rect x="10" y="12" width="14" height="8" rx="3" fill="currentColor" />
      <rect x="96" y="12" width="14" height="8" rx="3" fill="currentColor" />
    </svg>
  );
}

function SkeletonCard({ tall }: { tall?: boolean }) {
  return (
    <div
      className={[
        "w-full break-inside-avoid rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse",
        tall ? "h-72" : "h-48",
      ].join(" ")}
    />
  );
}

const SKELETON_HEIGHTS: boolean[] = [
  false, true, false, true, true, false, true, false,
];

// Hoisted static JSX — never recreated across renders
const skeletonGrid = (
  <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
    {SKELETON_HEIGHTS.map((tall, i) => (
      <SkeletonCard key={i} tall={tall} />
    ))}
  </div>
);

const emptyState = (
  <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
    <ToriiGate className="w-32 h-32 text-primary opacity-10" />
    <div className="space-y-2">
      <p className="text-lg font-japanese text-slate-400 dark:text-slate-500">
        まだ投稿がありません
      </p>
      <p className="text-slate-500 dark:text-slate-400">
        No creations yet — be the first to publish!
      </p>
    </div>
  </div>
);

const loadingMoreSpinner = (
  <div className="flex justify-center mt-8">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const headerDecoration = (
  <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block opacity-10 pointer-events-none text-primary">
    <ToriiGate className="w-24 h-24" />
  </div>
);

export default function CommunityPage() {
  const dispatch = useAppDispatch();
  const { images, hasMore, isLoading, isLoadingMore } = useAppSelector(
    (s) => s.feed
  );

  const [selectedImage, setSelectedImage] = useState<ImageFeedItem | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Initial load + deep-link: open the dialog for ?image={id} on page load
  useEffect(() => {
    dispatch(loadFeed());

    const imageId = new URLSearchParams(window.location.search).get("image");
    if (imageId) {
      imageService
        .fetchImageDetail(imageId)
        .then((img) => {
          setSelectedImage(img);
          setDialogOpen(true);
        })
        .catch(() => {
          // Unknown or private image — silently ignore
        });
    }
  }, [dispatch]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          dispatch(loadMoreFeed());
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [dispatch, hasMore, isLoading, isLoadingMore]);

  // Stable reference — memo on ImageCard only skips re-renders if onClick is stable
  const handleCardClick = useCallback((item: ImageFeedItem) => {
    setSelectedImage(item);
    setDialogOpen(true);
    window.history.replaceState({}, "", `?image=${item.id}`);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark overflow-y-auto relative">
      {/* Seigaiha pattern overlay — matches CreatePage background */}
      <div className="fixed inset-0 pattern-seigaiha pointer-events-none opacity-30 dark:opacity-20" />
      {/* Header */}
      <div className="relative bg-gradient-to-r from-primary/10 via-fuji-blue/10 to-sakura-pink/10 border-b border-primary/10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white">
            Community Gallery
          </h1>
          <p className="text-sm md:text-base text-primary/60 dark:text-primary/40 font-japanese uppercase tracking-[0.4em] font-medium">
            コミュニティギャラリー
          </p>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Explore stunning anime transformations created by our community
          </p>
        </div>

        {headerDecoration}
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? skeletonGrid : null}

        {!isLoading && images.length === 0 ? emptyState : null}

        {/* Masonry grid */}
        {!isLoading && images.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {images.map((item) => (
              <ImageCard
                key={item.id}
                item={item}
                onClick={handleCardClick}
              />
            ))}
          </div>
        ) : null}

        {isLoadingMore ? loadingMoreSpinner : null}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />
      </div>

      {/* Detail dialog */}
      <ImageDetailDialog
        item={selectedImage}
        open={dialogOpen}
        onClose={handleDialogClose}
      />
    </div>
  );
}
