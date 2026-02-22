import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@hooks/redux';
import {
  failEmojiGeneration,
  resetEmoji,
  startEmojiGenerationFromUrl,
} from '@store/slices/emojiSlice';
import { EmojiInput, EmojiResultGrid, useEmojiStatus } from '@components/emoji';
import LoadingDialog from '@components/generation/LoadingDialog';
import PageDecorations from '@lib/decorations/PageDecorations/PageDecorations';
import { EMOJI_STAGE } from '@customTypes/emoji';
import { Alert, AlertTitle, AlertDescription } from '@lib/ui/alert';
import { Button } from '@lib/ui/button';
import { X } from 'lucide-react';

const EMOJI_LOADING_MESSAGES = [
  'Creating your stickers...',
  'Removing backgrounds...',
  'Adding emotions...',
  'Almost there...',
];

export default function EmojiPage() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const { stage, jobId, error, variants, totalVariants } = useAppSelector(s => s.emoji);

  // On mount: restore job from URL if present (refresh persistence via Redis SSE seed)
  useEffect(() => {
    const urlJobId = searchParams.get('jobId');
    if (urlJobId && stage === EMOJI_STAGE.INPUT) {
      dispatch(startEmojiGenerationFromUrl(urlJobId));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep URL in sync with active job
  useEffect(() => {
    if (jobId) {
      setSearchParams({ jobId }, { replace: true });
    }
  }, [jobId, setSearchParams]);

  const isInputStage      = stage === EMOJI_STAGE.INPUT      || stage === EMOJI_STAGE.LOADING;
  const isLoadingStage    = stage === EMOJI_STAGE.LOADING;
  const isGeneratingStage = stage === EMOJI_STAGE.GENERATING || stage === EMOJI_STAGE.COMPLETE;
  const isComplete        = stage === EMOJI_STAGE.COMPLETE;

  // SSE connection: active during loading and generating stages
  useEmojiStatus(jobId, isLoadingStage || stage === EMOJI_STAGE.GENERATING);

  function handleReset() {
    dispatch(resetEmoji());
    setSearchParams({}, { replace: true });
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden relative">
      {/* Error alert */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-slide-down">
          <Alert variant="destructive" className="pr-12">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6"
              onClick={() => dispatch(failEmojiGeneration(null))}
            >
              <X className="h-4 w-4" />
            </Button>
            <AlertTitle>Generation Failed</AlertTitle>
            <AlertDescription>
              {error}
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-8"
                onClick={() => dispatch(failEmojiGeneration(null))}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {isInputStage && <EmojiInput />}
      {isLoadingStage && <LoadingDialog messages={EMOJI_LOADING_MESSAGES} />}

      {isGeneratingStage && (
        <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto py-10 px-4 md:px-8">
          <EmojiResultGrid
            variants={variants}
            totalVariants={totalVariants}
            isComplete={isComplete}
            onReset={handleReset}
          />
        </div>
      )}

      <PageDecorations />
    </main>
  );
}
