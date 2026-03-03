import { validate as isUUID } from "uuid"

import type { SubmitJobResponse, PublishImageResponse } from "@customTypes/generation"

const API_URL = import.meta.env.VITE_API_URL

function assertValidId(id: string, name = "id"): void {
  if (!isUUID(id)) throw new Error(`Invalid ${name} format`)
}

export function getJobStatusStreamUrl(jobId: string): string {
  assertValidId(jobId, "job_id")
  return `${API_URL}/images/jobs/${jobId}/stream`
}

export async function submitJob(image: File, prompt: string): Promise<SubmitJobResponse> {
  const formData = new FormData()
  formData.append("image", image)
  formData.append("prompt", prompt)

  const response = await fetch(`${API_URL}/images/jobs`, {
    method: "POST",
    credentials: "include", // Send cookies with request
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to submit job" }))
    throw new Error(error.error || "Failed to submit job")
  }

  return response.json()
}

export async function submitRefinement(
  jobId: string,
  refinementPrompt: string
): Promise<SubmitJobResponse> {
  assertValidId(jobId, "job_id")
  const response = await fetch(`${API_URL}/images/jobs/${jobId}/refine`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt: refinementPrompt }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to submit refinement" }))
    throw new Error(error.error || "Failed to submit refinement")
  }

  // Response contains SAME job_id with updated iteration count
  return response.json()
}

export async function publishImage(
  jobId: string,
  visibility: "public" | "private"
): Promise<PublishImageResponse> {
  assertValidId(jobId, "job_id")
  const response = await fetch(`${API_URL}/images/jobs/${jobId}/publish?visibility=${visibility}`, {
    method: "POST",
    credentials: "include",
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to publish image" }))
    throw new Error(error.error || "Failed to publish image")
  }

  return response.json()
}
