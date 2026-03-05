import { memo, useState, useCallback } from "react"
import { Heart, Share2, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@lib/ui/avatar"
import { Button } from "@lib/ui/button"
import { cn } from "@lib/utils"
import { imageService } from "@services/imageService"
import { useAppDispatch, useAppSelector } from "@hooks/redux"
import { updateLikedStatus } from "@store/slices/feedSlice"
import type { ImageFeedItem } from "@customTypes/image"

interface ImageCardProps {
  item: ImageFeedItem
  onClick: (item: ImageFeedItem) => void
  onLikeToggle?: (imageId: string, liked: boolean) => void
}

export const ImageCard = memo(function ImageCard({ item, onClick, onLikeToggle }: ImageCardProps) {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)

  const [loaded, setLoaded] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  const isLiked = item.is_liked_by_user === true

  const handleLike = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!isAuthenticated) {
        window.location.href = "/login"
        return
      }
      if (likeLoading) return
      setLikeLoading(true)
      const newLiked = !isLiked
      if (onLikeToggle) {
        onLikeToggle(item.id, newLiked)
      } else {
        dispatch(updateLikedStatus({ imageId: item.id, liked: newLiked }))
      }
      try {
        if (isLiked) {
          await imageService.unlikeImage(item.id)
        } else {
          await imageService.likeImage(item.id)
        }
      } catch {
        if (onLikeToggle) {
          onLikeToggle(item.id, isLiked)
        } else {
          dispatch(updateLikedStatus({ imageId: item.id, liked: isLiked }))
        }
      } finally {
        setLikeLoading(false)
      }
    },
    [dispatch, isAuthenticated, isLiked, item.id, likeLoading, onLikeToggle]
  )

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/community?image=${item.id}`)
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 2000)
      } catch {
        // clipboard unavailable — fail silently
      }
    },
    [item.id]
  )

  const actionBase =
    "rounded-full backdrop-blur-sm shadow-lg h-8 w-8 active:scale-95 border transition-all"
  const actionIdle =
    "bg-white/90 dark:bg-paper-dark/90 text-primary border-primary/10 hover:bg-primary hover:text-white hover:border-transparent"
  const actionActive = "bg-primary text-white hover:bg-primary/90 border-transparent"

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick(item)
        }
      }}
      className="group relative w-full text-left break-inside-avoid rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-md hover:shadow-xl hover:border-primary/20 border border-transparent transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
    >
      {/* Image with blur-up fade-in */}
      <div className="relative overflow-hidden">
        <img
          src={item.thumbnail_url}
          alt="Anime transformation"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={cn(
            "w-full h-auto object-cover transition-all duration-500",
            loaded ? "blur-0 scale-100 opacity-100" : "blur-sm scale-105 opacity-0"
          )}
        />

        {/* Gradient scrim for button legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Action row — split left/right, hover only */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Left: like */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleLike}
            disabled={likeLoading}
            className={cn(actionBase, isLiked ? actionActive : actionIdle)}
            aria-label="Like"
          >
            <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-white")} />
          </Button>

          {/* Right: share */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className={cn(actionBase, shareCopied ? actionActive : actionIdle)}
            aria-label="Share"
          >
            {shareCopied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Bottom bar — user info only */}
      <div className="px-3 py-2 flex items-center gap-2">
        <Avatar size="sm">
          <AvatarImage src={item.user.avatar_url} alt={item.user.name} />
          <AvatarFallback className="text-[10px]">
            {item.user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
          {item.user.name}
        </span>
      </div>
    </div>
  )
})
