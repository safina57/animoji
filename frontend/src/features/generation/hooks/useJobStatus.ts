import { useEffect, useRef } from 'react';
import { useSSE } from '../../../shared/hooks/useSSE';
import { useAppDispatch } from '../../../shared/hooks/redux';
import { completeGeneration, failGeneration } from '../../../store/slices/generationSlice';
import { getJobStatusStreamUrl, type StatusEvent } from '../../../shared/services/apiClient';

export function useJobStatus(jobId: string | null, enabled: boolean) {
  const dispatch = useAppDispatch();
  const handledJobRef = useRef<string | null>(null);

  // Determine URL based on enabled state and jobId
  const url = enabled && jobId ? getJobStatusStreamUrl(jobId) : null;

  useEffect(() => {
    // Reset handled job when disabled
    if (!enabled) {
      handledJobRef.current = null;
    }
  }, [enabled]);

  useEffect(() => {
    // Prevent duplicate connections for the same job
    if (enabled && jobId && handledJobRef.current === jobId) {
      console.log('[useJobStatus] Already handling this job, skipping:', jobId);
      return;
    }

    if (enabled && jobId) {
      handledJobRef.current = jobId;
    }
  }, [jobId, enabled]);

  const { isConnected, disconnect } = useSSE(url, {
    onOpen: () => {
      console.log('[useJobStatus] Connected to job status stream:', jobId);
    },

    onMessage: (data: StatusEvent) => {
      console.log('[useJobStatus] Received status event:', data);

      if (data.status === 'completed') {
        dispatch(
          completeGeneration({
            jobId: data.job_id!,
            originalImageUrl: data.original_url!,
            generatedImageUrl: data.result_url!,
          })
        );
        handledJobRef.current = null;
        disconnect();
      } else if (data.status === 'failed') {
        dispatch(failGeneration(data.error || 'Generation failed'));
        handledJobRef.current = null;
        disconnect();
      }
    },

    onError: (error: string) => {
      console.error('[useJobStatus] SSE error:', error);
      dispatch(failGeneration(error));
      handledJobRef.current = null;
    },
  });

  return { isConnected };
}
