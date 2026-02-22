export type EmojiStage = 'input' | 'loading' | 'generating' | 'complete';

export interface EmojiVariant {
  emotion: string;
  variantUrl: string;
  status: 'completed' | 'failed';
}

export interface SubmitEmojiJobResponse {
  job_id: string;
  message: string;
}

// SSE event types emitted by /emoji-job-status/{job_id}/stream
export interface EmojiStartedEvent {
  type: 'started';
  total: number;
}

export interface EmojiVariantReadyEvent {
  type: 'variant_ready';
  emotion: string;
  variant_url: string;
  completed: number;
  total: number;
}

export interface EmojiAllCompleteEvent {
  type: 'all_complete';
  variants: Record<string, string>; // emotion → presigned URL
}

export interface EmojiVariantFailedEvent {
  type: 'variant_failed';
  emotion: string;
}

export interface EmojiTimeoutEvent {
  type: 'timeout';
}

export type EmojiSSEEvent =
  | EmojiStartedEvent
  | EmojiVariantReadyEvent
  | EmojiAllCompleteEvent
  | EmojiVariantFailedEvent
  | EmojiTimeoutEvent;
