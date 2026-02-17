/** Stages of the generation flow */
export type GenerationStage = "input" | "loading" | "result";

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
}
