import type { SubmitEmojiJobResponse } from '@customTypes/emoji';

const API_URL = import.meta.env.VITE_API_URL;

export function getEmojiStatusStreamUrl(jobId: string): string {
  return `${API_URL}/emoji-job-status/${jobId}/stream`;
}

export async function submitEmojiJob(
  image: File,
  prompt: string
): Promise<SubmitEmojiJobResponse> {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('prompt', prompt);

  const response = await fetch(`${API_URL}/submit-emoji-job`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to submit emoji job' }));
    throw new Error(error.error || 'Failed to submit emoji job');
  }

  return response.json();
}
