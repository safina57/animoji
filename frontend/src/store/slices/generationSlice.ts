import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { GenerationStage, GenerationResult } from "@customTypes/generation";

interface GenerationState {
  stage: GenerationStage;
  prompt: string;
  referenceImage: File | null;
  referencePreviewUrl: string | null;
  jobId: string | null;
  error: string | null;
  results: GenerationResult[]; // Array of all generation results
  currentPrompt: string; // The prompt used for current generation
}

const initialState: GenerationState = {
  stage: "input",
  prompt: "",
  referenceImage: null,
  referencePreviewUrl: null,
  jobId: null,
  error: null,
  results: [],
  currentPrompt: "",
};

const generationSlice = createSlice({
  name: "generation",
  initialState,
  reducers: {
    setPrompt(state, action: PayloadAction<string>) {
      state.prompt = action.payload;
    },

    setReferenceImage(
      state,
      action: PayloadAction<{ file: File; previewUrl: string } | null>
    ) {
      if (action.payload) {
        state.referenceImage = action.payload.file;
        state.referencePreviewUrl = action.payload.previewUrl;
      } else {
        state.referenceImage = null;
        state.referencePreviewUrl = null;
      }
    },

    startGeneration(state) {
      state.stage = "loading";
      state.error = null;
      state.jobId = null;
      state.currentPrompt = state.prompt; // Save current prompt
      if (state.referencePreviewUrl) {
        URL.revokeObjectURL(state.referencePreviewUrl);
        state.referencePreviewUrl = null;
        state.referenceImage = null;
      }
    },

    setJobId(state, action: PayloadAction<string>) {
      state.jobId = action.payload;
    },

    completeGeneration(
      state,
      action: PayloadAction<{
        jobId: string;
        originalImageUrl: string;
        generatedImageUrl: string;
      }>
    ) {
      state.stage = "result";
      state.jobId = action.payload.jobId;

      // Add new result to the array
      state.results.push({
        jobId: action.payload.jobId,
        prompt: state.currentPrompt,
        originalImageUrl: action.payload.originalImageUrl,
        generatedImageUrl: action.payload.generatedImageUrl,
        timestamp: Date.now(),
      });

      // Clear prompt for next refinement
      state.prompt = "";
    },

    failGeneration(state, action: PayloadAction<string | null>) {
      if (action.payload) {
        state.stage = "input";
      }
      state.error = action.payload;
    },

    resetGeneration() {
      return initialState;
    },
  },
});

export const {
  setPrompt,
  setReferenceImage,
  startGeneration,
  setJobId,
  completeGeneration,
  failGeneration,
  resetGeneration,
} = generationSlice.actions;

export default generationSlice.reducer;
