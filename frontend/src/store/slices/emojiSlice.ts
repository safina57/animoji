import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { EMOJI_STAGE } from "@customTypes/emoji"
import type { EmojiStage, EmojiVariant } from "@customTypes/emoji"

interface EmojiState {
  stage: EmojiStage
  jobId: string | null
  prompt: string
  referenceImage: File | null
  referencePreviewUrl: string | null
  totalVariants: number
  variants: EmojiVariant[]
  error: string | null
}

const initialState: EmojiState = {
  stage: EMOJI_STAGE.INPUT,
  jobId: null,
  prompt: "",
  referenceImage: null,
  referencePreviewUrl: null,
  totalVariants: 0,
  variants: [],
  error: null,
}

const emojiSlice = createSlice({
  name: "emoji",
  initialState,
  reducers: {
    setEmojiPrompt(state, action: PayloadAction<string>) {
      state.prompt = action.payload
    },

    setEmojiReferenceImage(
      state,
      action: PayloadAction<{ file: File; previewUrl: string } | null>
    ) {
      if (action.payload) {
        state.referenceImage = action.payload.file
        state.referencePreviewUrl = action.payload.previewUrl
      } else {
        state.referenceImage = null
        state.referencePreviewUrl = null
      }
    },

    // Fresh submission: clear all previous state and go to loading
    startEmojiGeneration(state) {
      state.stage = EMOJI_STAGE.LOADING
      state.error = null
      state.jobId = null
      state.variants = []
      state.totalVariants = 0
      if (state.referencePreviewUrl) {
        URL.revokeObjectURL(state.referencePreviewUrl)
        state.referencePreviewUrl = null
        state.referenceImage = null
      }
    },

    // URL restore on page refresh: set jobId + go to loading so SSE seeds from Redis
    startEmojiGenerationFromUrl(state, action: PayloadAction<string>) {
      state.stage = EMOJI_STAGE.LOADING
      state.jobId = action.payload
      state.variants = []
      state.totalVariants = 0
      state.error = null
    },

    setEmojiJobId(state, action: PayloadAction<string>) {
      state.jobId = action.payload
    },

    // Called for the "started" SSE event — transitions to 'generating' and sets skeleton count
    variantsInitialized(state, action: PayloadAction<number>) {
      if (state.stage === EMOJI_STAGE.LOADING) {
        state.stage = EMOJI_STAGE.GENERATING
      }
      if (state.totalVariants === 0) {
        state.totalVariants = action.payload
      }
    },

    // Called for each variant_ready SSE event
    variantReady(
      state,
      action: PayloadAction<{
        emotion: string
        variantId?: string
        variantUrl: string
        total: number
      }>
    ) {
      // Transition from loading to generating on first variant
      if (state.stage === EMOJI_STAGE.LOADING) {
        state.stage = EMOJI_STAGE.GENERATING
        state.totalVariants = action.payload.total
      }
      // Guard against duplicates (can happen on SSE reconnect)
      const exists = state.variants.find((v) => v.emotion === action.payload.emotion)
      if (!exists) {
        state.variants.push({
          emotion: action.payload.emotion,
          variantId: action.payload.variantId,
          variantUrl: action.payload.variantUrl,
          status: "completed",
        })
      }
    },

    variantFailed(state, action: PayloadAction<string>) {
      if (state.stage === EMOJI_STAGE.LOADING) {
        state.stage = EMOJI_STAGE.GENERATING
      }
      const exists = state.variants.find((v) => v.emotion === action.payload)
      if (!exists) {
        state.variants.push({
          emotion: action.payload,
          variantUrl: "",
          status: "failed",
        })
      }
    },

    // Called for all_complete SSE event; fills any variants missed by individual events
    allVariantsComplete(
      state,
      action: PayloadAction<{
        variantUrls: Record<string, string>
        variantIds: Record<string, string>
      }>
    ) {
      const existingEmotions = new Set(state.variants.map((v) => v.emotion))
      Object.entries(action.payload.variantUrls).forEach(([emotion, url]) => {
        if (!existingEmotions.has(emotion)) {
          state.variants.push({
            emotion,
            variantId: action.payload.variantIds[emotion],
            variantUrl: url,
            status: "completed",
          })
        }
      })
      state.stage = EMOJI_STAGE.COMPLETE
    },

    failEmojiGeneration(state, action: PayloadAction<string | null>) {
      if (action.payload) {
        state.stage = EMOJI_STAGE.INPUT
      }
      state.error = action.payload
    },

    // Stamps a permanent URL onto a single variant after it is published.
    variantPublished(state, action: PayloadAction<{ emotion: string; url: string }>) {
      const variant = state.variants.find((v) => v.emotion === action.payload.emotion)
      if (variant) {
        variant.publishedUrl = action.payload.url
      }
    },

    resetEmoji() {
      return initialState
    },
  },
})

export const {
  setEmojiPrompt,
  setEmojiReferenceImage,
  startEmojiGeneration,
  startEmojiGenerationFromUrl,
  setEmojiJobId,
  variantsInitialized,
  variantReady,
  variantFailed,
  allVariantsComplete,
  failEmojiGeneration,
  variantPublished,
  resetEmoji,
} = emojiSlice.actions

export default emojiSlice.reducer
