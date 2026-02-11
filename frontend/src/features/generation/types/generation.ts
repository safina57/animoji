/** Stages of the generation flow */
export type GenerationStage = "input" | "loading" | "result";

/** Matches Go SubmitJobResponse */
export interface SubmitJobResponse {
  job_id: string;
  status: string;
  message: string;
}

/** Preview of a reference image the user attaches */
export interface ReferenceImagePreview {
  file: File;
  previewUrl: string;
}
