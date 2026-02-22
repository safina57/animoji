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
import { Alert, AlertTitle, AlertDescription } from '@lib/ui/alert';
import { Button } from '@lib/ui/button';
import { X } from 'lucide-react';
import CherryBlossom from '@lib/decorations/CherryBlossom/CherryBlossom';
import SakuraDecorationIcon from '@assets/icons/sakura-decoration.svg?react';

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
    if (urlJobId && stage === 'input') {
      dispatch(startEmojiGenerationFromUrl(urlJobId));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep URL in sync with active job
  useEffect(() => {
    if (jobId) {
      setSearchParams({ jobId }, { replace: true });
    }
  }, [jobId, setSearchParams]);

  // SSE connection: active during loading and generating stages
  useEmojiStatus(jobId, stage === 'loading' || stage === 'generating');

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

      {/* Input form — shown while waiting to submit */}
      {(stage === 'input' || stage === 'loading') && <EmojiInput />}

      {/* Loading dialog — only until we know the variant count ("started" event) */}
      {stage === 'loading' && <LoadingDialog messages={EMOJI_LOADING_MESSAGES} />}

      {/* Result grid — appears the moment we receive the "started" SSE event */}
      {(stage === 'generating' || stage === 'complete') && (
        <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto py-10 px-4 md:px-8">
          <EmojiResultGrid
            variants={variants}
            totalVariants={totalVariants}
            isComplete={stage === 'complete'}
            onReset={handleReset}
          />
        </div>
      )}

      <DecorationOrbs />
    </main>
  );
}

function DecorationOrbs() {
  return (
    <>
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none" />
      <div className="fixed top-1/4 left-10 pointer-events-none opacity-10 dark:opacity-5 hidden xl:block">
        <SakuraDecorationIcon />
      </div>
      <div className="fixed bottom-20 left-10 pointer-events-none text-sakura-pink hidden xl:block w-48 opacity-30 dark:opacity-15">
        <CherryBlossom />
      </div>
      <div className="fixed bottom-1/4 right-10 pointer-events-none opacity-10 dark:opacity-5 hidden xl:block">
        <div className="w-32 h-32 rounded-full border-2 border-primary" />
      </div>
      <div className="fixed inset-0 pattern-seigaiha pointer-events-none opacity-30 dark:opacity-20" />
    </>
  );
}
