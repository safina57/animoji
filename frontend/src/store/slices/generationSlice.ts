import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { GenerationStage } from "../../types/generation";

interface GenerationState {
  stage: GenerationStage;
  prompt: string;
  referenceImage: File | null;
  referencePreviewUrl: string | null;
  originalImageUrl: string | null;
  generatedImageUrl: string | null;
  jobId: string | null;
  error: string | null;
}

const initialState: GenerationState = {
  stage: "input",
  prompt: "",
  referenceImage: null,
  referencePreviewUrl: null,
  originalImageUrl: null,
  generatedImageUrl: null,
  jobId: null,
  error: null,
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
      state.originalImageUrl = null;
      state.generatedImageUrl = null;
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
      state.originalImageUrl = action.payload.originalImageUrl;
      state.generatedImageUrl = action.payload.generatedImageUrl;
    },

    failGeneration(state, action: PayloadAction<string>) {
      state.stage = "input";
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
