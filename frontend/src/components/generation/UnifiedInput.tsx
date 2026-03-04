import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react"
import { Send } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@hooks/redux"
import {
  setPrompt,
  setReferenceImage,
  startGeneration,
  setJobId,
  failGeneration,
} from "@store/slices/generationSlice"
import {
  setEmojiPrompt,
  setEmojiReferenceImage,
  startEmojiGeneration,
  setEmojiJobId,
  failEmojiGeneration,
} from "@store/slices/emojiSlice"
import { submitJob, submitRefinement } from "@services/generationService"
import { submitEmojiJob } from "@services/emojiService"
import { RateLimitError } from "@services/errors"
import RateLimitModal from "@components/generation/RateLimitModal"
import { Button } from "@lib/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@lib/ui/dropdown-menu"
import { GENERATION_STAGE } from "@customTypes/generation"
import { EMOJI_STAGE } from "@customTypes/emoji"
import type { CreateMode } from "@customTypes/generation"
import InputHero from "@components/generation/InputHero"
import SuggestionChips from "@components/generation/SuggestionChips"
import ReferenceImagePreview from "@components/generation/ReferenceImagePreview"
import SeigaihaOverlay from "@lib/decorations/SeigaihaOverlay/SeigaihaOverlay"

const CONFIG = {
  anime: {
    hero: "What shall we create today?",
    heroJa: "今日は何を作りましょうか",
    placeholder: "Describe your anime vision...",
    placeholderBottom: "Change the lighting to sunset...",
    verticalText: "想像力",
    suggestions: ["Cyberpunk Tokyo", "Studio Ghibli Forest", "90s Retro Anime"],
    suggestionsLabel: "Suggestions:",
    submitLabel: "Generate image",
    subtitleBottom: "Refine your vision or start a new prompt",
    switchLabel: "stickers",
  },
  emoji: {
    hero: "Turn yourself into stickers",
    heroJa: "あなたをステッカーに変えましょう",
    placeholder: "Describe your character...",
    placeholderBottom: "Describe your character...",
    verticalText: "表現力",
    suggestions: ["Cute bunny character", "Anime girl with cat ears", "Chubby bear"],
    suggestionsLabel: "Try:",
    submitLabel: "Generate stickers",
    subtitleBottom: null,
    switchLabel: "anime",
  },
} as const

interface UnifiedInputProps {
  mode: CreateMode
  onModeToggle: () => void
}

interface RateLimitInfo {
  limit: number
  resetAt: string
  mode: CreateMode
}

export default function UnifiedInput({ mode, onModeToggle }: UnifiedInputProps) {
  const dispatch = useAppDispatch()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null)

  const {
    prompt: animePrompt,
    referencePreviewUrl: animePreview,
    referenceImage: animeImage,
    stage: animeStage,
    jobId: animeJobId,
    results: animeResults,
  } = useAppSelector((s) => s.generation)

  const {
    prompt: emojiPrompt,
    referencePreviewUrl: emojiPreview,
    referenceImage: emojiImage,
    stage: emojiStage,
  } = useAppSelector((s) => s.emoji)

  const isAnime = mode === "anime"
  const prompt = isAnime ? animePrompt : emojiPrompt
  const referencePreviewUrl = isAnime ? animePreview : emojiPreview
  const referenceImage = isAnime ? animeImage : emojiImage
  const isBottom = isAnime && animeStage === GENERATION_STAGE.RESULT
  const isRefinement = isBottom && animeResults.length > 0
  const canToggleMode = isAnime
    ? animeStage === GENERATION_STAGE.INPUT
    : emojiStage === EMOJI_STAGE.INPUT

  const config = CONFIG[mode]

  /* ── Dispatch helpers ── */
  function handleSetPrompt(value: string) {
    if (isAnime) {
      dispatch(setPrompt(value))
    } else {
      dispatch(setEmojiPrompt(value))
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (referencePreviewUrl) URL.revokeObjectURL(referencePreviewUrl)
    const previewUrl = URL.createObjectURL(file)
    if (isAnime) {
      dispatch(setReferenceImage({ file, previewUrl }))
    } else {
      dispatch(setEmojiReferenceImage({ file, previewUrl }))
    }
  }

  function removeImage() {
    if (referencePreviewUrl) URL.revokeObjectURL(referencePreviewUrl)
    if (isAnime) {
      dispatch(setReferenceImage(null))
    } else {
      dispatch(setEmojiReferenceImage(null))
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  /* ── Submit ── */
  async function generate() {
    if (!prompt.trim()) return

    if (isAnime) {
      if (isRefinement) {
        if (!animeJobId) {
          dispatch(failGeneration("No active job to refine"))
          return
        }
        dispatch(startGeneration())
        try {
          await submitRefinement(animeJobId, prompt)
        } catch (err) {
          if (err instanceof RateLimitError) {
            dispatch(failGeneration("__rl__"))
            dispatch(failGeneration(null))
            setRateLimitInfo({ limit: err.limit, resetAt: err.resetAt, mode: "anime" })
          } else {
            dispatch(
              failGeneration(err instanceof Error ? err.message : "Failed to submit refinement")
            )
          }
        }
      } else {
        if (!referenceImage) {
          dispatch(failGeneration("Please upload an image first"))
          return
        }
        dispatch(startGeneration())
        try {
          const res = await submitJob(referenceImage, prompt)
          dispatch(setJobId(res.job_id))
        } catch (err) {
          if (err instanceof RateLimitError) {
            dispatch(failGeneration("__rl__"))
            dispatch(failGeneration(null))
            setRateLimitInfo({ limit: err.limit, resetAt: err.resetAt, mode: "anime" })
          } else {
            dispatch(
              failGeneration(
                err instanceof Error ? err.message : "Something went wrong. Please try again."
              )
            )
          }
        }
      }
    } else {
      if (!referenceImage) {
        dispatch(failEmojiGeneration("Please upload an image first"))
        return
      }
      dispatch(startEmojiGeneration())
      try {
        const res = await submitEmojiJob(referenceImage, prompt)
        dispatch(setEmojiJobId(res.job_id))
      } catch (err) {
        if (err instanceof RateLimitError) {
          dispatch(failEmojiGeneration("__rl__"))
          dispatch(failEmojiGeneration(null))
          setRateLimitInfo({ limit: err.limit, resetAt: err.resetAt, mode: "emoji" })
        } else {
          dispatch(
            failEmojiGeneration(
              err instanceof Error ? err.message : "Something went wrong. Please try again."
            )
          )
        }
      }
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      generate()
    }
  }

  return (
    <>
      {rateLimitInfo && (
        <RateLimitModal
          limit={rateLimitInfo.limit}
          resetAt={rateLimitInfo.resetAt}
          mode={rateLimitInfo.mode}
          onClose={() => setRateLimitInfo(null)}
        />
      )}
    <div
      className={
        isBottom
          ? "w-full max-w-4xl mx-auto pb-6 pt-2 shrink-0 animate-slide-down"
          : "flex-1 flex flex-col items-center justify-center p-6 md:p-12"
      }
    >
      <div className={isBottom ? "" : "w-full max-w-3xl space-y-12"}>
        {/* Hero text — initial stage only */}
        {!isBottom && <InputHero title={config.hero} titleJa={config.heroJa} />}

        {/* Input card */}
        <div className="relative group">
          {/* Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />

          <div className="relative bg-paper-light dark:bg-paper-dark paper-texture rounded-3xl border border-primary/10 shadow-xl shadow-primary/5 p-2 flex flex-col gap-2 transition-all duration-300 focus-within:border-primary/30 focus-within:shadow-primary/10">
            {/* Reference image preview */}
            {referencePreviewUrl && (
              <ReferenceImagePreview src={referencePreviewUrl} onRemove={removeImage} />
            )}

            {/* Input row */}
            <div className="flex items-center gap-2">
              {/* Refinement wand decoration — shown instead of dropdown when refining */}
              {isRefinement ? (
                <div className="flex items-center justify-center w-9 h-9 rounded-2xl text-primary/30 shrink-0">
                  <span className="material-symbols-outlined text-2xl">auto_fix_high</span>
                </div>
              ) : (
                /* Combined actions dropdown */
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className="shrink-0 bg-white dark:bg-paper-dark border border-primary/10 rounded-2xl text-primary hover:border-primary/30 hover:bg-primary hover:text-white transition-all"
                      aria-label="Actions"
                    >
                      <span className="material-symbols-outlined text-[20px]">tune</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-52 p-0 bg-paper-light dark:bg-paper-dark paper-texture bg-cover bg-center border border-primary/10 shadow-xl shadow-primary/5 overflow-hidden rounded-xl"
                  >
                    <div className="h-0.5 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
                    <SeigaihaOverlay className="absolute opacity-60 dark:opacity-25" />
                    <div className="relative p-2">
                      <DropdownMenuItem
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isRefinement}
                        className="cursor-pointer rounded-lg px-3 py-2.5 gap-2.5 hover:bg-primary/8 dark:hover:bg-primary/12 data-[highlighted]:bg-primary/8 dark:data-[highlighted]:bg-primary/12 focus:bg-primary/8"
                      >
                        <span className="material-symbols-outlined text-[18px] font-display text-slate-900 dark:text-white">
                          add_photo_alternate
                        </span>
                        <span className="font-display text-sm text-slate-900 dark:text-white truncate">
                          Upload photo
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1 bg-primary/10" />
                      <DropdownMenuItem
                        onClick={onModeToggle}
                        disabled={!canToggleMode}
                        className="cursor-pointer rounded-lg px-3 py-2.5 gap-2.5 hover:bg-primary/8 dark:hover:bg-primary/12 data-[highlighted]:bg-primary/8 dark:data-[highlighted]:bg-primary/12 focus:bg-primary/8"
                      >
                        <span className="material-symbols-outlined text-[18px] font-display text-slate-900 dark:text-white">
                          {isAnime ? "emoji_emotions" : "auto_fix_high"}
                        </span>
                        <span className="font-display text-sm text-slate-900 dark:text-white truncate">
                          Switch to {config.switchLabel}
                        </span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileChange}
              />

              <textarea
                value={prompt}
                onChange={(e) => handleSetPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-lg md:text-xl font-display placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none py-3"
                placeholder={isBottom ? config.placeholderBottom : config.placeholder}
                rows={1}
              />

              <Button
                onClick={generate}
                disabled={!prompt.trim()}
                size="icon"
                variant="outline"
                className="shrink-0 -ml-1 bg-white dark:bg-paper-dark border border-primary/10 rounded-2xl text-primary hover:border-primary/30 hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-primary disabled:hover:border-primary/10 dark:disabled:hover:bg-paper-dark transition-all"
                aria-label={config.submitLabel}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>

            {/* Current mode badge */}
            <div className="flex items-center gap-1.5 px-3 pb-1">
              <span className="material-symbols-outlined text-[13px] text-primary/45">
                {isAnime ? "auto_fix_high" : "emoji_emotions"}
              </span>
              <span className="font-display text-[10px] text-primary/45 uppercase tracking-widest">
                {isAnime ? "Anime mode" : "Sticker mode"}
              </span>
            </div>
          </div>

          {/* Vertical Japanese decoration — initial stage only */}
          {!isBottom && (
            <div className="absolute -right-16 top-1/2 -translate-y-1/2 hidden xl:block pointer-events-none">
              <p className="[writing-mode:vertical-rl] text-primary/20 font-japanese text-2xl tracking-[0.5em] font-bold">
                {config.verticalText}
              </p>
            </div>
          )}
        </div>

        {/* Suggestion chips — initial stage only */}
        {!isBottom && (
          <SuggestionChips
            label={config.suggestionsLabel}
            items={config.suggestions}
            onSelect={handleSetPrompt}
          />
        )}

        {/* Subtitle for anime refinement */}
        {isBottom && config.subtitleBottom && (
          <p className="text-center text-[10px] text-slate-400 mt-3 uppercase tracking-widest font-medium">
            {config.subtitleBottom}
          </p>
        )}
      </div>
    </div>
    </>
  )
}
