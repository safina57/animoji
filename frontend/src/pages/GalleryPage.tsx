import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@hooks/redux";
import {
  loadGallery,
  loadMoreGallery,
  setVisibility,
  updateGalleryLikedStatus,
} from "@store/slices/gallerySlice";
import { ImageCard } from "@components/community/ImageCard";
import { ImageDetailDialog } from "@components/community/ImageDetailDialog";
import GalleryHeader from "@components/community/GalleryHeader";
import GallerySidebar from "@components/community/GallerySidebar";
import GalleryEmptyState from "@components/community/GalleryEmptyState";
import FeedEndMarker from "@components/community/FeedEndMarker";
import SkeletonGrid from "@components/community/SkeletonGrid";
import SeigaihaOverlay from "@lib/decorations/SeigaihaOverlay/SeigaihaOverlay";
import type { GalleryVisibility } from "@store/slices/gallerySlice";
import type { ImageFeedItem } from "@customTypes/image";

const loadingMoreSpinner = (
  <div className="flex justify-center mt-8">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function GalleryPage() {
  const dispatch = useAppDispatch();
  const { images, hasMore, isLoading, isLoadingMore, visibility } = useAppSelector((s) => s.gallery);
  const user = useAppSelector((s) => s.auth.user);

  const [selectedImage, setSelectedImage] = useState<ImageFeedItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Load on mount and on visibility change
  useEffect(() => {
    dispatch(loadGallery(visibility));
  }, [dispatch, visibility]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          dispatch(loadMoreGallery());
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [dispatch, hasMore, isLoading, isLoadingMore]);

  const handleVisibilityChange = useCallback(
    (v: GalleryVisibility) => {
      if (v === visibility) return;
      dispatch(setVisibility(v));
    },
    [dispatch, visibility]
  );

  const handleCardClick = useCallback((item: ImageFeedItem) => {
    setSelectedImage(item);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => setDialogOpen(false), []);

  const handleLikeToggle = useCallback(
    (imageId: string, liked: boolean) => {
      dispatch(updateGalleryLikedStatus({ imageId, liked }));
    },
    [dispatch]
  );

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark relative">
      <SeigaihaOverlay className="fixed opacity-30 dark:opacity-20" />

      <GalleryHeader userName={user?.name} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-8 items-start">
        <div className="md:sticky md:top-20 w-full md:w-52 shrink-0">
          <GallerySidebar value={visibility} onChange={handleVisibilityChange} />
        </div>

        <div className="flex-1 min-w-0">
          {isLoading && <SkeletonGrid />}
          {!isLoading && images.length === 0 && <GalleryEmptyState visibility={visibility} />}

          {!isLoading && images.length > 0 && (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {images.map((item) => (
                <ImageCard
                  key={item.id}
                  item={item}
                  onClick={handleCardClick}
                  onLikeToggle={handleLikeToggle}
                />
              ))}
            </div>
          )}

          {isLoadingMore && loadingMoreSpinner}
          {!isLoading && !isLoadingMore && !hasMore && images.length > 0 && (
            <FeedEndMarker message="All your creations are loaded." />
          )}

          <div ref={sentinelRef} className="h-1" />
        </div>
      </div>

      <ImageDetailDialog item={selectedImage} open={dialogOpen} onClose={handleDialogClose} />
    </div>
  );
}
