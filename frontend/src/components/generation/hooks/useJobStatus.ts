import { useEffect, useRef } from 'react';
import { useSSE } from '@hooks/useSSE';
import { useAppDispatch } from '@hooks/redux';
import { completeGeneration, failGeneration } from '@store/slices/generationSlice';
import { getJobStatusStreamUrl } from '@services/generationService';
import type { StatusEvent } from '@customTypes/generation';

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
      return;
    }

    if (enabled && jobId) {
      handledJobRef.current = jobId;
    }
  }, [jobId, enabled]);

  const { isConnected, disconnect } = useSSE(url, {
    onMessage: (data: StatusEvent) => {
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
      dispatch(failGeneration(error));
      handledJobRef.current = null;
    },
  });

  return { isConnected };
}
