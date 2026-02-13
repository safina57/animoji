import { useAppSelector } from "@shared/hooks/redux";
import { useJobStatus } from "../hooks/useJobStatus";
import GenerationInput from "../components/GenerationInput";
import { LoadingScreen } from "../components/loading-screen";
import ResultView from "../components/ResultView";
import SakuraDecorationIcon from "@assets/icons/sakura-decoration.svg?react";

export default function GenerationPage() {
  const stage = useAppSelector((s) => s.generation.stage);
  const jobId = useAppSelector((s) => s.generation.jobId);

  // Listen for SSE status updates during the loading stage.
  useJobStatus(jobId, stage === "loading");

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
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

      {/* Circle bottom-right */}
      <div className="fixed bottom-1/4 right-10 pointer-events-none opacity-10 dark:opacity-5 hidden xl:block">
        <div className="w-32 h-32 rounded-full border-2 border-primary" />
      </div>
    </>
  );
}
