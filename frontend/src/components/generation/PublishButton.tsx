import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAppDispatch } from "@hooks/redux"
import { resetGeneration, markResultAsPublished } from "@store/slices/generationSlice"
import { publishImage } from "@services/generationService"
import { Button } from "@lib/ui/button"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@lib/ui/dialog"
import type { GenerationResult } from "@customTypes/generation"

interface PublishButtonProps {
  jobId: string | null
  result: GenerationResult
}

export default function PublishButton({ jobId, result }: PublishButtonProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [visibility, setVisibility] = useState<"public" | "private">("public")
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPublished = !!result.publishedImageId

  async function handleConfirm() {
    if (!jobId || isPublishing) return
    setIsPublishing(true)
    setError(null)
    try {
      const response = await publishImage(jobId, visibility)
      dispatch(
        markResultAsPublished({ iterationNum: result.iterationNum, imageId: response.image_id })
      )
      setOpen(false)
      dispatch(resetGeneration())
      navigate(`/community?image=${response.image_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish")
    } finally {
      setIsPublishing(false)
    }
  }

  if (isPublished) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white shadow-lg">
        <span className="material-symbols-outlined text-sm">check_circle</span>
        <span className="text-xs font-semibold">Published</span>
      </div>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setError(null)
      }}
    >
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="flex items-center gap-1.5 bg-white/90 dark:bg-paper-dark/90 border border-primary/10 rounded-2xl text-primary hover:border-primary/30 hover:bg-primary hover:text-white backdrop-blur-sm shadow-lg transition-all"
      >
        <span className="material-symbols-outlined text-sm">cloud_upload</span>
        <span className="text-xs font-semibold">Publish</span>
      </Button>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-primary/10 bg-paper-light dark:bg-paper-dark paper-texture p-0 overflow-hidden shadow-xl shadow-primary/10 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

          <div className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-base font-display font-bold text-slate-900 dark:text-white">
                Publish to Gallery
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 font-japanese">
                ギャラリーに公開する
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Visibility
              </p>
              <div className="grid grid-cols-2 gap-2">
                <VisibilityOption
                  value="public"
                  selected={visibility === "public"}
                  onSelect={() => setVisibility("public")}
                  icon="public"
                  label="Public"
                  description="Anyone can see it"
                />
                <VisibilityOption
                  value="private"
                  selected={visibility === "private"}
                  onSelect={() => setVisibility("private")}
                  icon="lock"
                  label="Private"
                  description="Only you can see it"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </p>
            )}

            <DialogFooter className="gap-2 sm:gap-2">
              <DialogClose asChild>
                <Button variant="outline" size="sm" disabled={isPublishing} className="flex-1">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={isPublishing}
                className="flex-1 gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20"
              >
                {isPublishing ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                    Publishing…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">cloud_upload</span>
                    Confirm
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  )
}

/* ── Visibility option card ── */

interface VisibilityOptionProps {
  value: "public" | "private"
  selected: boolean
  onSelect: () => void
  icon: string
  label: string
  description: string
}

function VisibilityOption({ selected, onSelect, icon, label, description }: VisibilityOptionProps) {
  return (
    <button
      onClick={onSelect}
      className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5 dark:bg-primary/10"
          : "border-slate-200 dark:border-slate-700 hover:border-primary/40"
      }`}
    >
      <span
        className={`material-symbols-outlined text-lg ${selected ? "text-primary" : "text-slate-400"}`}
      >
        {icon}
      </span>
      <span
        className={`text-xs font-semibold ${selected ? "text-primary" : "text-slate-600 dark:text-slate-300"}`}
      >
        {label}
      </span>
      <span className="text-[10px] text-slate-400 leading-tight">{description}</span>
    </button>
  )
}
