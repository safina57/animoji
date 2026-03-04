import { useCallback, useEffect, useRef, useState } from "react"
import { useAppDispatch, useAppSelector } from "@hooks/redux"
import { loadFeed, loadMoreFeed } from "@store/slices/feedSlice"
import { imageService } from "@services/imageService"
import { ImageCard } from "@components/community/ImageCard"
import { ImageDetailDialog } from "@components/community/ImageDetailDialog"
import CommunityHeader from "@components/community/CommunityHeader"
import FeedEmptyState from "@components/community/FeedEmptyState"
import FeedEndMarker from "@components/community/FeedEndMarker"
import SkeletonGrid from "@components/community/SkeletonGrid"
import SeigaihaOverlay from "@lib/decorations/SeigaihaOverlay/SeigaihaOverlay"
import type { ImageFeedItem } from "@customTypes/image"

const loadingMoreSpinner = (
  <div className="flex justify-center mt-8">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

export default function CommunityPage() {
  const dispatch = useAppDispatch()
  const { images, hasMore, isLoading, isLoadingMore, error } = useAppSelector((s) => s.feed)

  const [selectedImage, setSelectedImage] = useState<ImageFeedItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)

  const hasMoreRef = useRef(hasMore)
  const isLoadingRef = useRef(isLoading)
  const isLoadingMoreRef = useRef(isLoadingMore)
  const errorRef = useRef(error)

  useEffect(() => {
    hasMoreRef.current = hasMore
    isLoadingRef.current = isLoading
    isLoadingMoreRef.current = isLoadingMore
    errorRef.current = error
  })

  // Initial load + deep-link: open the dialog for ?image={id} on page load
  useEffect(() => {
    dispatch(loadFeed())

    const imageId = new URLSearchParams(window.location.search).get("image")
    if (imageId) {
      imageService
        .fetchImageDetail(imageId)
        .then((img) => {
          setSelectedImage(img)
          setDialogOpen(true)
        })
        .catch(() => {
          // Unknown or private image — silently ignore
        })
    }
  }, [dispatch])

  // Infinite scroll sentinel — created once; reads live state via refs so that
  // loading-state changes never trigger observer recreation (and an immediate
  // spurious callback that would cause infinite retries on error).
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !isLoadingMoreRef.current &&
          !isLoadingRef.current &&
          !errorRef.current
        ) {
          dispatch(loadMoreFeed())
        }
      },
      { rootMargin: "100px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [dispatch])

  const handleCardClick = useCallback((item: ImageFeedItem) => {
    setSelectedImage(item)
    setDialogOpen(true)
    window.history.replaceState({}, "", `?image=${item.id}`)
  }, [])

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false)
    window.history.replaceState({}, "", window.location.pathname)
  }, [])

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark overflow-y-auto relative">
      <SeigaihaOverlay className="fixed opacity-30 dark:opacity-20" />

      <CommunityHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {isLoading && <SkeletonGrid />}
        {!isLoading && images.length === 0 && <FeedEmptyState />}

        {!isLoading && images.length > 0 && (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {images.map((item) => (
              <ImageCard key={item.id} item={item} onClick={handleCardClick} />
            ))}
          </div>
        )}

        {isLoadingMore && loadingMoreSpinner}
        {!isLoading && !isLoadingMore && !hasMore && images.length > 0 && <FeedEndMarker />}

        <div ref={sentinelRef} className="h-1" />
      </div>

      <ImageDetailDialog item={selectedImage} open={dialogOpen} onClose={handleDialogClose} />
    </div>
  )
}
