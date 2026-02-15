/**
 * Real API client for communicating with the Gateway backend.
 * Handles job submission and SSE-based status updates.
 */

const API_URL = import.meta.env.VITE_API_URL;

export interface SubmitJobResponse {
  job_id: string;
  message: string;
}

export interface StatusEvent {
  status: 'completed' | 'failed';
  job_id?: string;
  original_url?: string;
  result_url?: string;
  error?: string;
}

export function getJobStatusStreamUrl(jobId: string): string {
  return `${API_URL}/job-status/${jobId}/stream`;
}

export async function submitJob(image: File, prompt: string): Promise<SubmitJobResponse> {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('prompt', prompt);

  const response = await fetch(`${API_URL}/submit-job`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to submit job' }));
    throw new Error(error.error || 'Failed to submit job');
  }

  return response.json();
}
