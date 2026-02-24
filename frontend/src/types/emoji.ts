export const EMOJI_STAGE = {
  INPUT:      'input',
  LOADING:    'loading',
  GENERATING: 'generating',
  COMPLETE:   'complete',
} as const;

export type EmojiStage = typeof EMOJI_STAGE[keyof typeof EMOJI_STAGE];

export interface EmojiVariant {
  emotion: string;
  variantId?: string;
  variantUrl: string;
  status: 'completed' | 'failed';
  publishedUrl?: string;
}

export interface PublishEmojiVariantResponse {
  message: string;
  emotion: string;
  url: string;
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
  variant_id: string;
  completed: number;
  total: number;
}

export interface EmojiAllCompleteEvent {
  type: 'all_complete';
  variant_urls: Record<string, string>;
  variant_ids: Record<string, string>;
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
