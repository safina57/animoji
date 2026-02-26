import { useCallback, useEffect, useRef, useState } from "react"
import { useAppDispatch, useAppSelector } from "@hooks/redux"
import {
  loadGallery,
  loadMoreGallery,
  setVisibility,
  updateGalleryLikedStatus,
} from "@store/slices/gallerySlice"
import { loadEmojiGallery, loadMoreEmojiGallery } from "@store/slices/emojiGallerySlice"
import { ImageCard } from "@components/community/ImageCard"
import { ImageDetailDialog } from "@components/community/ImageDetailDialog"
import GalleryHeader from "@components/community/GalleryHeader"
import GallerySidebar from "@components/community/GallerySidebar"
import GalleryEmptyState from "@components/community/GalleryEmptyState"
import FeedEndMarker from "@components/community/FeedEndMarker"
import SkeletonGrid from "@components/community/SkeletonGrid"
import EmojiPackCard from "@components/emoji/EmojiPackCard"
import { EmojiPackDetailDialog } from "@components/emoji/EmojiPackDetailDialog"
import SeigaihaOverlay from "@lib/decorations/SeigaihaOverlay/SeigaihaOverlay"
import { GALLERY_SECTION } from "@store/slices/gallerySlice"
import type { GallerySection, GalleryVisibility } from "@store/slices/gallerySlice"
import type { ImageFeedItem } from "@customTypes/image"
import type { EmojiPackGalleryItem } from "@customTypes/emoji"

const loadingMoreSpinner = (
  <div className="flex justify-center mt-8">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

export default function GalleryPage() {
  const dispatch = useAppDispatch()
  const { images, hasMore, isLoading, isLoadingMore, visibility } = useAppSelector((s) => s.gallery)
  const {
    packs,
    hasMore: emojiHasMore,
    isLoading: emojiIsLoading,
    isLoadingMore: emojiIsLoadingMore,
  } = useAppSelector((s) => s.emojiGallery)
  const user = useAppSelector((s) => s.auth.user)

  const [section, setSection] = useState<GallerySection>(GALLERY_SECTION.PUBLIC)
  const [selectedImage, setSelectedImage] = useState<ImageFeedItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPack, setSelectedPack] = useState<EmojiPackGalleryItem | null>(null)
  const [packDialogOpen, setPackDialogOpen] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)

  // Load images on mount and when visibility changes (public / private sections)
  useEffect(() => {
    dispatch(loadGallery(visibility))
  }, [dispatch, visibility])

  // Load emoji gallery when switching to the emojis section — skip if already loaded
  useEffect(() => {
    if (section === GALLERY_SECTION.EMOJIS && packs.length === 0 && !emojiIsLoading) {
      dispatch(loadEmojiGallery())
    }
  }, [dispatch, section, packs.length, emojiIsLoading])

  // Infinite scroll — delegates to the correct thunk based on active section
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        if (section === GALLERY_SECTION.EMOJIS) {
          if (emojiHasMore && !emojiIsLoadingMore && !emojiIsLoading) {
            dispatch(loadMoreEmojiGallery())
          }
        } else {
          if (hasMore && !isLoadingMore && !isLoading) {
            dispatch(loadMoreGallery())
          }
        }
      },
      { rootMargin: "100px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [
    dispatch,
    section,
    hasMore,
    isLoading,
    isLoadingMore,
    emojiHasMore,
    emojiIsLoading,
    emojiIsLoadingMore,
  ])

  const handleSectionChange = useCallback(
    (s: GallerySection) => {
      setSection(s)
      if (s === GALLERY_SECTION.PUBLIC || s === GALLERY_SECTION.PRIVATE) {
        dispatch(setVisibility(s as GalleryVisibility))
      }
    },
    [dispatch]
  )

  const handleCardClick = useCallback((item: ImageFeedItem) => {
    setSelectedImage(item)
    setDialogOpen(true)
  }, [])

  const handleDialogClose = useCallback(() => setDialogOpen(false), [])

  const handleLikeToggle = useCallback(
    (imageId: string, liked: boolean) => {
      dispatch(updateGalleryLikedStatus({ imageId, liked }))
    },
    [dispatch]
  )

  const handlePackClick = useCallback((pack: EmojiPackGalleryItem) => {
    setSelectedPack(pack)
    setPackDialogOpen(true)
  }, [])

  const isEmojis = section === GALLERY_SECTION.EMOJIS

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark relative">
      <SeigaihaOverlay className="fixed opacity-30 dark:opacity-20" />

      <GalleryHeader userName={user?.name} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-8 items-start">
        <div className="md:sticky md:top-20 w-full md:w-52 shrink-0">
          <GallerySidebar value={section} onChange={handleSectionChange} />
        </div>

        <div className="flex-1 min-w-0">
          {/* ── Images section (public / private) ── */}
          {!isEmojis && (
            <>
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
            </>
          )}

          {/* ── Emoji stickers section ── */}
          {isEmojis && (
            <>
              {emojiIsLoading && <SkeletonGrid />}
              {!emojiIsLoading && packs.length === 0 && <EmojiEmptyState />}

              {!emojiIsLoading && packs.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {packs.map((pack) => (
                    <EmojiPackCard
                      key={pack.id}
                      pack={pack}
                      onClick={() => handlePackClick(pack)}
                    />
                  ))}
                </div>
              )}

              {emojiIsLoadingMore && loadingMoreSpinner}
              {!emojiIsLoading && !emojiIsLoadingMore && !emojiHasMore && packs.length > 0 && (
                <FeedEndMarker message="All your sticker packs are loaded." />
              )}
            </>
          )}

          <div ref={sentinelRef} className="h-1" />
        </div>
      </div>

      <ImageDetailDialog item={selectedImage} open={dialogOpen} onClose={handleDialogClose} />
      <EmojiPackDetailDialog
        pack={selectedPack}
        open={packDialogOpen}
        onClose={() => setPackDialogOpen(false)}
      />
    </div>
  )
}

function EmojiEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
      <span className="material-symbols-outlined text-7xl text-primary opacity-10">
        emoji_emotions
      </span>
      <div className="space-y-2">
        <p className="text-lg font-japanese text-slate-400 dark:text-slate-500">
          スタンプはまだありません
        </p>
        <p className="text-slate-500 dark:text-slate-400">
          You haven't published any sticker packs yet.
        </p>
      </div>
    </div>
  )
}
