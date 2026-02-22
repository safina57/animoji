import { useAppSelector, useAppDispatch } from "@hooks/redux";
import { useJobStatus } from "@components/generation/hooks/useJobStatus";
import GenerationInput from "@components/generation/GenerationInput";
import LoadingDialog from "@components/generation/LoadingDialog";
import ResultView from "@components/generation/ResultView";
import PageDecorations from "@lib/decorations/PageDecorations/PageDecorations";
import { Alert, AlertTitle, AlertDescription } from "@lib/ui/alert";
import { Button } from "@lib/ui/button";
import { failGeneration } from "@store/slices/generationSlice";
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

      {/* ── Stage: Input (always visible when not in result) ── */}
      {(stage === "input" || stage === "loading") && <GenerationInput />}

      {/* ── Stage: Loading dialog (overlays the input) ── */}
      {stage === "loading" && <LoadingDialog />}

      {/* ── Stage: Result ── */}
      {stage === "result" && (
        <div className="flex-1 max-w-[1440px] mx-auto w-full p-4 md:p-6 flex flex-col gap-6 overflow-hidden">
          <ResultView />
          <GenerationInput />
        </div>
      )}

      {/* Decorative elements */}
      <PageDecorations />
    </main>
  );
}
