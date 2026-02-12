/**
 * Real API client for communicating with the Gateway backend.
 * Handles job submission and SSE-based status updates.
 */

const API_URL = import.meta.env.VITE_API_URL;

export interface SubmitJobResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface StatusEvent {
  status: 'completed' | 'failed';
  job_id?: string;
  original_url?: string;
  result_url?: string;
  error?: string;
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

export function createJobStatusStream(
  jobId: string,
  onStatus: (event: StatusEvent) => void,
  onError: (error: string) => void
): () => void {
  const url = `${API_URL}/job-status/${jobId}/stream`;
  console.log('[SSE] Creating EventSource:', url);

  const eventSource = new EventSource(url);

  eventSource.addEventListener('open', () => {
    console.log('[SSE] Connection opened');
  });

  eventSource.addEventListener('status', (e) => {
    console.log('[SSE] Received status event:', e.data);
    try {
      const data: StatusEvent = JSON.parse(e.data);
      onStatus(data);

      // Close connection on terminal states
      if (data.status === 'completed' || data.status === 'failed') {
        console.log('[SSE] Closing connection (terminal state)');
        eventSource.close();
      }
    } catch (err) {
      console.error('[SSE] Failed to parse event:', err);
      onError('Failed to parse status event');
      eventSource.close();
    }
  });

  eventSource.addEventListener('error', (e) => {
    console.error('[SSE] Connection error:', e);
    onError('Failed to connect to status stream');
    eventSource.close();
  });

  // Return cleanup function
  return () => {
    console.log('[SSE] Cleaning up connection');
    eventSource.close();
  };
}
