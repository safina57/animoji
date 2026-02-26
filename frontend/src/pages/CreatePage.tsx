import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useAppSelector, useAppDispatch } from "@hooks/redux"
import { useJobStatus } from "@components/generation/hooks/useJobStatus"
import { useEmojiStatus } from "@components/emoji/hooks/useEmojiStatus"
import UnifiedInput from "@components/generation/UnifiedInput"
import LoadingDialog from "@components/generation/LoadingDialog"
import ResultView from "@components/generation/ResultView"
import { EmojiResultGrid } from "@components/emoji"
import PageDecorations from "@lib/decorations/PageDecorations/PageDecorations"
import { Alert, AlertTitle, AlertDescription } from "@lib/ui/alert"
import { Button } from "@lib/ui/button"
import { failGeneration } from "@store/slices/generationSlice"
import {
  failEmojiGeneration,
  resetEmoji,
  startEmojiGenerationFromUrl,
  variantPublished,
} from "@store/slices/emojiSlice"
import { publishEmojiVariant } from "@services/emojiService"
import { GENERATION_STAGE } from "@customTypes/generation"
import { EMOJI_STAGE } from "@customTypes/emoji"
import type { CreateMode } from "@customTypes/generation"
import { X } from "lucide-react"

const PARAM_MODE = "mode" as const
const PARAM_JOB_ID = "jobId" as const
const MODE_ANIME = "anime" as const
const MODE_EMOJI = "emoji" as const

const EMOJI_LOADING_MESSAGES = [
  "Creating your stickers...",
  "Removing backgrounds...",
  "Adding emotions...",
  "Almost there...",
]

export default function CreatePage() {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()

  const [mode, setMode] = useState<CreateMode>(() =>
    searchParams.get(PARAM_MODE) === MODE_EMOJI ? MODE_EMOJI : MODE_ANIME
  )

  /* ── Slice state ── */
  const {
    stage: animeStage,
    jobId: animeJobId,
    error: animeError,
  } = useAppSelector((s) => s.generation)
  const {
    stage: emojiStage,
    jobId: emojiJobId,
    error: emojiError,
    variants,
    totalVariants,
  } = useAppSelector((s) => s.emoji)

  /* ── Derived stage flags ── */
  const isAnimeInputStage =
    animeStage === GENERATION_STAGE.INPUT || animeStage === GENERATION_STAGE.LOADING
  const isAnimeLoadingStage = animeStage === GENERATION_STAGE.LOADING
  const isAnimeResultStage = animeStage === GENERATION_STAGE.RESULT

  const isEmojiInputStage = emojiStage === EMOJI_STAGE.INPUT || emojiStage === EMOJI_STAGE.LOADING
  const isEmojiLoadingStage = emojiStage === EMOJI_STAGE.LOADING
  const isEmojiGeneratingStage =
    emojiStage === EMOJI_STAGE.GENERATING || emojiStage === EMOJI_STAGE.COMPLETE
  const isEmojiComplete = emojiStage === EMOJI_STAGE.COMPLETE

  const isAnime = mode === MODE_ANIME
  const error = isAnime ? animeError : emojiError

  /* ── SSE hooks (called unconditionally per Rules of Hooks) ── */
  useJobStatus(animeJobId, isAnime && isAnimeLoadingStage)
  useEmojiStatus(
    emojiJobId,
    !isAnime && (isEmojiLoadingStage || emojiStage === EMOJI_STAGE.GENERATING)
  )

  /* ── URL sync ── */
  useEffect(() => {
    const params: Record<string, string> = { [PARAM_MODE]: mode }
    if (mode === MODE_EMOJI && emojiJobId) params[PARAM_JOB_ID] = emojiJobId
    setSearchParams(params, { replace: true })
  }, [mode, emojiJobId, setSearchParams])

  /* ── Emoji job restore on page refresh ── */
  useEffect(() => {
    const urlJobId = searchParams.get(PARAM_JOB_ID)
    const isEmojiMode = searchParams.get(PARAM_MODE) === MODE_EMOJI
    if (isEmojiMode && urlJobId && emojiStage === EMOJI_STAGE.INPUT) {
      dispatch(startEmojiGenerationFromUrl(urlJobId))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleMode() {
    setMode((m) => (m === MODE_ANIME ? MODE_EMOJI : MODE_ANIME))
  }

  function dismissError() {
    if (isAnime) {
      dispatch(failGeneration(null))
    } else {
      dispatch(failEmojiGeneration(null))
    }
  }

  function handleEmojiReset() {
    dispatch(resetEmoji())
    setSearchParams({ [PARAM_MODE]: MODE_EMOJI }, { replace: true })
  }

  async function handlePublishVariant(variantId: string) {
    if (!emojiJobId) throw new Error("No active emoji job")
    const result = await publishEmojiVariant(emojiJobId, variantId)
    dispatch(variantPublished({ emotion: result.emotion, url: result.url }))
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden relative">
      {/* Error alert */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-slide-down">
          <Alert variant="destructive" className="pr-12">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6"
              onClick={dismissError}
            >
              <X className="h-4 w-4" />
            </Button>
            <AlertTitle>Generation Failed</AlertTitle>
            <AlertDescription>
              {error}
              <Button variant="ghost" size="sm" className="mt-2 h-8" onClick={dismissError}>
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* ── Anime mode ── */}
      {isAnime && isAnimeInputStage && <UnifiedInput mode={mode} onModeToggle={toggleMode} />}
      {isAnime && isAnimeLoadingStage && <LoadingDialog />}
      {isAnime && isAnimeResultStage && (
        <div className="flex-1 max-w-[1440px] mx-auto w-full p-4 md:p-6 flex flex-col gap-6 overflow-hidden">
          <ResultView />
          <UnifiedInput mode={mode} onModeToggle={toggleMode} />
        </div>
      )}

      {/* ── Emoji mode ── */}
      {!isAnime && isEmojiInputStage && <UnifiedInput mode={mode} onModeToggle={toggleMode} />}
      {!isAnime && isEmojiLoadingStage && <LoadingDialog messages={EMOJI_LOADING_MESSAGES} />}
      {!isAnime && isEmojiGeneratingStage && (
        <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto py-10 px-4 md:px-8">
          <EmojiResultGrid
            variants={variants}
            totalVariants={totalVariants}
            isComplete={isEmojiComplete}
            onReset={handleEmojiReset}
            onPublishVariant={handlePublishVariant}
          />
        </div>
      )}

      <PageDecorations />
    </main>
  )
}
