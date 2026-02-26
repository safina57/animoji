import ToriiGateIcon from "@lib/decorations/ToriiGateIcon/ToriiGateIcon"
import { GALLERY_SECTION } from "@store/slices/gallerySlice"
import type { GalleryVisibility } from "@store/slices/gallerySlice"

interface GalleryEmptyStateProps {
  visibility: GalleryVisibility
}

export default function GalleryEmptyState({ visibility }: GalleryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
      <ToriiGateIcon className="w-32 h-32 text-primary opacity-10" />
      <div className="space-y-2">
        {visibility === GALLERY_SECTION.PUBLIC ? (
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
  )
}
