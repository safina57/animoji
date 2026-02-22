import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@hooks/redux";
import { loadFeed, loadMoreFeed } from "@store/slices/feedSlice";
import { imageService } from "@services/imageService";
import { ImageCard } from "@components/community/ImageCard";
import { ImageDetailDialog } from "@components/community/ImageDetailDialog";
import SkeletonGrid from "@components/community/SkeletonGrid";
import ToriiGateIcon from "@lib/decorations/ToriiGateIcon/ToriiGateIcon";
import SeigaihaOverlay from "@lib/decorations/SeigaihaOverlay/SeigaihaOverlay";
import type { ImageFeedItem } from "@customTypes/image";

const emptyState = (
  <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
    <ToriiGateIcon className="w-32 h-32 text-primary opacity-10" />
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

const endOfFeed = (
  <div className="flex flex-col items-center justify-center py-16 text-center gap-5">
    <div className="flex items-center gap-4 w-full max-w-sm">
      <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
      <ToriiGateIcon className="w-10 h-10 text-primary opacity-20" />
      <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
    </div>
    <div className="space-y-1.5">
      <p className="text-sm font-japanese text-slate-400 dark:text-slate-500">
        以上です
      </p>
      <p className="text-sm text-slate-400 dark:text-slate-500">
        That's everything — now go make your own art!
      </p>
    </div>
  </div>
);

const headerDecoration = (
  <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block opacity-10 pointer-events-none text-primary">
    <ToriiGateIcon className="w-24 h-24" />
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
      <SeigaihaOverlay className="fixed opacity-30 dark:opacity-20" />
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
        {isLoading ? <SkeletonGrid /> : null}

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

        {!isLoading && !isLoadingMore && !hasMore && images.length > 0
          ? endOfFeed
          : null}

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
