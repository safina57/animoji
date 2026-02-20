import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@hooks/redux";
import {
  loadGallery,
  loadMoreGallery,
  setVisibility,
  updateGalleryLikedStatus,
  type GalleryVisibility,
} from "@store/slices/gallerySlice";
import { ImageCard } from "@components/community/ImageCard";
import { ImageDetailDialog } from "@components/community/ImageDetailDialog";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@lib/ui/navigation-menu";
import { cn } from "@lib/utils";
import type { ImageFeedItem } from "@customTypes/image";

/* ── Torii Gate SVG (reused from CommunityPage pattern) ── */
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

const skeletonGrid = (
  <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
    {SKELETON_HEIGHTS.map((tall, i) => (
      <SkeletonCard key={i} tall={tall} />
    ))}
  </div>
);

const loadingMoreSpinner = (
  <div className="flex justify-center mt-8">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

/* ── Sidebar nav using shadcn NavigationMenu ── */

const NAV_ITEMS: { value: GalleryVisibility; icon: string; label: string; labelJa: string }[] = [
  { value: "public",  icon: "public", label: "Public",  labelJa: "公開" },
  { value: "private", icon: "lock",   label: "Private", labelJa: "非公開" },
];

interface GallerySidebarProps {
  value: GalleryVisibility;
  onChange: (v: GalleryVisibility) => void;
}

function GallerySidebar({ value, onChange }: GallerySidebarProps) {
  return (
    <aside className="w-full md:w-52 shrink-0">
      {/* Section label */}
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
        My Images
      </p>

      <NavigationMenu orientation="vertical" className="max-w-none w-full">
        <NavigationMenuList className="flex-col items-stretch gap-0.5 space-x-0 w-full">
          {NAV_ITEMS.map(({ value: v, icon, label, labelJa }) => (
            <NavigationMenuItem key={v} className="w-full">
              <NavigationMenuLink
                onClick={() => onChange(v)}
                className={cn(
                  navigationMenuTriggerStyle(),
                  "w-full justify-start gap-3 px-3 h-10 rounded-lg cursor-pointer transition-all",
                  value === v
                    ? "bg-primary/8 dark:bg-primary/12 text-primary border border-primary/15"
                    : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-primary border border-transparent"
                )}
              >
                <span className="material-symbols-outlined text-[18px] shrink-0">{icon}</span>
                <span className="flex-1 text-xs font-semibold tracking-wide">{label}</span>
                <span className="text-[10px] font-japanese text-muted-foreground/60 hidden md:block">{labelJa}</span>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </aside>
  );
}

/* ── Empty state ── */
function EmptyState({ visibility }: { visibility: GalleryVisibility }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
      <ToriiGate className="w-32 h-32 text-primary opacity-10" />
      <div className="space-y-2">
        {visibility === "public" ? (
          <>
            <p className="text-lg font-japanese text-slate-400 dark:text-slate-500">
              公開された作品はありません
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              You haven't published any public creations yet.
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-japanese text-slate-400 dark:text-slate-500">
              非公開の作品はありません
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              You haven't saved any private creations yet.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ── End of feed ── */
const endOfFeed = (
  <div className="flex flex-col items-center justify-center py-16 text-center gap-5">
    <div className="flex items-center gap-4 w-full max-w-sm">
      <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
      <ToriiGate className="w-10 h-10 text-primary opacity-20" />
      <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
    </div>
    <div className="space-y-1.5">
      <p className="text-sm font-japanese text-slate-400 dark:text-slate-500">
        以上です
      </p>
      <p className="text-sm text-slate-400 dark:text-slate-500">
        All your creations are loaded.
      </p>
    </div>
  </div>
);

/* ── GalleryPage ── */
export default function GalleryPage() {
  const dispatch = useAppDispatch();
  const { images, hasMore, isLoading, isLoadingMore, visibility } =
    useAppSelector((s) => s.gallery);
  const user = useAppSelector((s) => s.auth.user);

  const [selectedImage, setSelectedImage] = useState<ImageFeedItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Load on mount and on visibility change
  useEffect(() => {
    dispatch(loadGallery(visibility));
  }, [dispatch, visibility]);

  // Switch visibility tab
  const handleVisibilityChange = useCallback(
    (v: GalleryVisibility) => {
      if (v === visibility) return;
      dispatch(setVisibility(v));
    },
    [dispatch, visibility]
  );

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          !isLoading
        ) {
          dispatch(loadMoreGallery());
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [dispatch, hasMore, isLoading, isLoadingMore]);

  const handleCardClick = useCallback((item: ImageFeedItem) => {
    setSelectedImage(item);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleLikeToggle = useCallback(
    (imageId: string, liked: boolean) => {
      dispatch(updateGalleryLikedStatus({ imageId, liked }));
    },
    [dispatch]
  );

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark relative">
      {/* Seigaiha pattern overlay */}
      <div className="fixed inset-0 pattern-seigaiha pointer-events-none opacity-30 dark:opacity-20" />

      {/* Header */}
      <div className="relative bg-gradient-to-r from-primary/10 via-fuji-blue/10 to-sakura-pink/10 border-b border-primary/10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">
          <div className="space-y-1">
            <p className="text-xs text-primary/60 dark:text-primary/40 font-japanese uppercase tracking-[0.4em] font-medium">
              マイギャラリー
            </p>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white">
              My Gallery
            </h1>
            {user && (
              <p className="text-slate-600 dark:text-slate-400 pt-1">
                Your anime creations,{" "}
                <span className="text-primary font-medium">{user.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Decorative torii */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block opacity-10 pointer-events-none text-primary">
          <ToriiGate className="w-24 h-24" />
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar — sticks while content scrolls */}
        <div className="md:sticky md:top-20 w-full md:w-52 shrink-0">
          <GallerySidebar value={visibility} onChange={handleVisibilityChange} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isLoading ? skeletonGrid : null}

          {!isLoading && images.length === 0 ? (
            <EmptyState visibility={visibility} />
          ) : null}

          {/* Masonry grid */}
          {!isLoading && images.length > 0 ? (
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
          ) : null}

          {isLoadingMore ? loadingMoreSpinner : null}

          {!isLoading && !isLoadingMore && !hasMore && images.length > 0
            ? endOfFeed
            : null}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />
        </div>
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
