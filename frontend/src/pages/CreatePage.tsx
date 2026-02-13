import { useAppSelector, useAppDispatch } from "@hooks/redux";
import { useJobStatus } from "@components/generation/hooks/useJobStatus";
import GenerationInput from "@components/generation/GenerationInput";
import LoadingScreen from "@components/generation/LoadingScreen";
import ResultView from "@components/generation/ResultView";
import SakuraDecorationIcon from "@assets/icons/sakura-decoration.svg?react";
import { Alert, AlertTitle, AlertDescription } from "@lib/ui/alert";
import { Button } from "@lib/ui/button";
import { failGeneration } from "@store/slices/generationSlice";
import CherryBlossom from "@lib/decorations/CherryBlossom/CherryBlossom";
import { X } from "lucide-react";

export default function CreatePage() {
  const dispatch = useAppDispatch();
  const stage = useAppSelector((s) => s.generation.stage);
  const jobId = useAppSelector((s) => s.generation.jobId);
  const error = useAppSelector((s) => s.generation.error);

  // Listen for SSE status updates during the loading stage.
  useJobStatus(jobId, stage === "loading");

  return (
    <main className="flex-1 flex flex-col overflow-hidden relative">
      {/* Error Alert */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-slide-down">
          <Alert variant="destructive" className="pr-12">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6"
              onClick={() => dispatch(failGeneration(null))}
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
                onClick={() => dispatch(failGeneration(null))}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* ── Stage: Input (centered) ── */}
      {stage === "input" && <GenerationInput />}

      {/* ── Stage: Loading ── */}
      {stage === "loading" && <LoadingScreen />}

      {/* ── Stage: Result ── */}
      {stage === "result" && (
        <div className="flex-1 max-w-[1440px] mx-auto w-full p-4 md:p-6 flex flex-col gap-6 overflow-hidden">
          <ResultView />
          <GenerationInput />
        </div>
      )}

      {/* Decorative elements */}
      <DecorationOrbs />
    </main>
  );
}

function DecorationOrbs() {
  return (
    <>
      {/* Bottom gradient line */}
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none" />

      {/* Sakura petal top-left */}
      <div className="fixed top-1/4 left-10 pointer-events-none opacity-10 dark:opacity-5 hidden xl:block">
        <SakuraDecorationIcon />
      </div>

      {/* Cherry blossom bottom-left */}
      <div className="fixed bottom-20 left-10 pointer-events-none text-sakura-pink hidden xl:block w-48 opacity-30 dark:opacity-15">
        <CherryBlossom />
      </div>

      {/* Circle bottom-right */}
      <div className="fixed bottom-1/4 right-10 pointer-events-none opacity-10 dark:opacity-5 hidden xl:block">
        <div className="w-32 h-32 rounded-full border-2 border-primary" />
      </div>

      {/* Japanese pattern overlay */}
      <div className="fixed inset-0 pattern-seigaiha pointer-events-none opacity-30 dark:opacity-20" />
    </>
  );
}
