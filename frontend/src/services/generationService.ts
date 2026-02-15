import type { SubmitJobResponse } from "@customTypes/generation";

const API_URL = import.meta.env.VITE_API_URL;

export function getJobStatusStreamUrl(jobId: string): string {
  return `${API_URL}/job-status/${jobId}/stream`;
}

export async function submitJob(image: File, prompt: string): Promise<SubmitJobResponse> {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('prompt', prompt);

  const response = await fetch(`${API_URL}/submit-job`, {
    method: 'POST',
    credentials: 'include', // Send cookies with request
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to submit job' }));
    throw new Error(error.error || 'Failed to submit job');
  }

  return response.json();
}
