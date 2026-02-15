import type { SubmitJobResponse } from "@customTypes/generation";

const API_URL = import.meta.env.VITE_API_URL;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
    };
  }
  return {};
}

export function getJobStatusStreamUrl(jobId: string): string {
  // Note: EventSource doesn't support custom headers, so we can't add Authorization header
  // For production, consider using token in query param or websocket with auth handshake
  return `${API_URL}/job-status/${jobId}/stream`;
}

export async function submitJob(image: File, prompt: string): Promise<SubmitJobResponse> {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('prompt', prompt);

  const response = await fetch(`${API_URL}/submit-job`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to submit job' }));
    throw new Error(error.error || 'Failed to submit job');
  }

  return response.json();
}
