/** UI mode on the Create page */
export type CreateMode = "anime" | "emoji";

/** Stages of the generation flow */
export const GENERATION_STAGE = {
  INPUT:   "input",
  LOADING: "loading",
  RESULT:  "result",
} as const;

export type GenerationStage = typeof GENERATION_STAGE[keyof typeof GENERATION_STAGE];

/** Matches Go SubmitJobResponse */
export interface SubmitJobResponse {
  job_id: string;
  message: string;
}

/** Preview of a reference image the user attaches */
export interface ReferenceImagePreview {
  file: File;
  previewUrl: string;
}

/** SSE event for job status updates */
export interface StatusEvent {
  status: 'completed' | 'failed';
  job_id?: string;
  original_url?: string;
  result_url?: string;
  iteration_num?: number;
  error?: string;
}

/** Result of a completed generation */
export interface GenerationResult {
  prompt: string;
  originalImageUrl: string;
  generatedImageUrl: string;
  timestamp: number;
  iterationNum: number;
  publishedImageId?: string; // Set after successful publish
}

/** Response from POST /images/{job_id}/publish */
export interface PublishImageResponse {
  message: string;
  image_id: string;
  visibility: string;
}
