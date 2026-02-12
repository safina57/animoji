import { useEffect } from 'react';
import { useAppDispatch } from './redux';
import { completeGeneration, failGeneration } from '../../store/slices/generationSlice';
import { createJobStatusStream, type StatusEvent } from '../services/apiClient';

export function useJobStatusStream(jobId: string | null, enabled: boolean) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!enabled || !jobId) {
      console.log('[SSE] Not connecting:', { enabled, jobId });
      return;
    }

    console.log('[SSE] Connecting to job status stream:', jobId);

    const cleanup = createJobStatusStream(
      jobId,
      (event: StatusEvent) => {
        console.log('[SSE] Received event:', event);
        if (event.status === 'completed') {
          dispatch(
            completeGeneration({
              jobId: event.job_id!,
              originalImageUrl: event.original_url!,
              generatedImageUrl: event.result_url!,
            })
          );
        } else if (event.status === 'failed') {
          dispatch(failGeneration(event.error || 'Generation failed'));
        }
      },
      (error: string) => {
        console.error('[SSE] Error:', error);
        dispatch(failGeneration(error));
      }
    );

    return cleanup;
  }, [jobId, enabled, dispatch]);
}
