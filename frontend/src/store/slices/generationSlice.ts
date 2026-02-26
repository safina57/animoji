import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { GENERATION_STAGE } from "@customTypes/generation"
import type { GenerationStage, GenerationResult } from "@customTypes/generation"

interface GenerationState {
  stage: GenerationStage
  prompt: string
  referenceImage: File | null
  referencePreviewUrl: string | null
  jobId: string | null
  error: string | null
  results: GenerationResult[] // Array of all generation results
  currentPrompt: string // The prompt used for current generation
}

const initialState: GenerationState = {
  stage: GENERATION_STAGE.INPUT,
  prompt: "",
  referenceImage: null,
  referencePreviewUrl: null,
  jobId: null,
  error: null,
  results: [],
  currentPrompt: "",
}

const generationSlice = createSlice({
  name: "generation",
  initialState,
  reducers: {
    setPrompt(state, action: PayloadAction<string>) {
      state.prompt = action.payload
    },

    setReferenceImage(state, action: PayloadAction<{ file: File; previewUrl: string } | null>) {
      if (action.payload) {
        state.referenceImage = action.payload.file
        state.referencePreviewUrl = action.payload.previewUrl
      } else {
        state.referenceImage = null
        state.referencePreviewUrl = null
      }
    },

    startGeneration(state) {
      state.stage = GENERATION_STAGE.LOADING
      state.error = null
      state.currentPrompt = state.prompt // Save current prompt
      // Only clear job_id and reference if this is the first generation
      if (state.results.length === 0) {
        state.jobId = null
        if (state.referencePreviewUrl) {
          URL.revokeObjectURL(state.referencePreviewUrl)
          state.referencePreviewUrl = null
          state.referenceImage = null
        }
      }
    },

    setJobId(state, action: PayloadAction<string>) {
      state.jobId = action.payload
    },

    completeGeneration(
      state,
      action: PayloadAction<{
        originalImageUrl: string
        generatedImageUrl: string
        iterationNum: number
      }>
    ) {
      state.stage = GENERATION_STAGE.RESULT

      // Add new result to the array
      state.results.push({
        prompt: state.currentPrompt,
        originalImageUrl: action.payload.originalImageUrl,
        generatedImageUrl: action.payload.generatedImageUrl,
        timestamp: Date.now(),
        iterationNum: action.payload.iterationNum,
      })

      // Clear prompt for next refinement
      state.prompt = ""
    },

    failGeneration(state, action: PayloadAction<string | null>) {
      if (action.payload) {
        state.stage = GENERATION_STAGE.INPUT
      }
      state.error = action.payload
    },

    markResultAsPublished(state, action: PayloadAction<{ iterationNum: number; imageId: string }>) {
      const result = state.results.find((r) => r.iterationNum === action.payload.iterationNum)
      if (result) {
        result.publishedImageId = action.payload.imageId
      }
    },

    resetGeneration() {
      return initialState
    },
  },
})

export const {
  setPrompt,
  setReferenceImage,
  startGeneration,
  setJobId,
  completeGeneration,
  failGeneration,
  markResultAsPublished,
  resetGeneration,
} = generationSlice.actions

export default generationSlice.reducer
