import { validate as isUUID } from "uuid"

import { RateLimitError } from "@services/errors"
import type {
  SubmitEmojiJobResponse,
  PublishEmojiVariantResponse,
  EmojiPacksResponse,
} from "@customTypes/emoji"

export const EMOJI_GALLERY_PAGE_SIZE = 20

const API_URL = import.meta.env.VITE_API_URL

function assertValidId(id: string, name = "id"): void {
  if (!isUUID(id)) throw new Error(`Invalid ${name} format`)
}

export function getEmojiStatusStreamUrl(jobId: string): string {
  assertValidId(jobId, "job_id")
  return `${API_URL}/emojis/jobs/${jobId}/stream`
}

export async function submitEmojiJob(image: File, prompt: string): Promise<SubmitEmojiJobResponse> {
  const formData = new FormData()
  formData.append("image", image)
  formData.append("prompt", prompt)

  const response = await fetch(`${API_URL}/emojis/jobs`, {
    method: "POST",
    credentials: "include",
    body: formData,
  })

  if (!response.ok) {
    if (response.status === 429) {
      const body = await response.json().catch(() => ({ limit: 0, reset_at: "" }))
      throw new RateLimitError(body.limit, body.reset_at)
    }
    const error = await response.json().catch(() => ({ error: "Failed to submit emoji job" }))
    throw new Error(error.error || "Failed to submit emoji job")
  }

  return response.json()
}

export async function fetchMyEmojiPacks(
  limit: number,
  offset: number
): Promise<EmojiPacksResponse> {
  const response = await fetch(`${API_URL}/emojis/me?limit=${limit}&offset=${offset}`, {
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error("Failed to fetch your emoji packs")
  }
  return response.json()
}

export async function publishEmojiVariant(
  jobId: string,
  variantId: string
): Promise<PublishEmojiVariantResponse> {
  assertValidId(jobId, "job_id")
  assertValidId(variantId, "variant_id")
  const response = await fetch(`${API_URL}/emojis/jobs/${jobId}/variants/${variantId}/publish`, {
    method: "POST",
    credentials: "include",
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to publish emoji" }))
    throw new Error(error.error || "Failed to publish emoji")
  }

  return response.json()
}
