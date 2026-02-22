import { useEffect, useState } from "react";
import FallingPetals from "@lib/decorations/FallingPetals/FallingPetals";
import ToriiGate from "@lib/decorations/ToriiGate/ToriiGate";
import SakuraTree from "@lib/decorations/SakuraTree/SakuraTree";
import StonePath from "@lib/decorations/StonePath/StonePath";
import Pond from "@lib/decorations/Pond/Pond";

const LOADING_MESSAGES = [
  "Creating your masterpiece...",
  "Channeling anime energy...",
  "Almost there...",
  "Painting every pixel...",
];

export default function LoadingModal() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-fade-in select-none relative overflow-hidden bg-transparent">
      {/* Background falling petals (z-0) */}
      <FallingPetals count={10} className="absolute inset-0 pointer-events-none z-0 overflow-hidden" />

      {/* Main scene container */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl h-[500px] justify-end pb-0 mb-8">
        {/* Trees - positioned inside scene */}
        <SakuraTree position="left" />
        <SakuraTree position="right" />

        {/* Central Architecture */}
        <div className="flex flex-col items-center transform translate-y-8 md:translate-y-6 z-30">
          <ToriiGate />
          {/* Stone Path - positioned below torii, on water */}
          <div className="mt-6">
            <StonePath />
          </div>
        </div>

        {/* Pond (background water, extends to bottom) */}
        <div className="w-full absolute bottom-0 z-10">
          <Pond />
        </div>
      </div>

      {/* Front falling petals (z-40) - hidden on mobile, visible on lg+ */}
      <FallingPetals count={10} className="hidden lg:block absolute inset-0 pointer-events-none z-40 overflow-hidden" />

      {/* Loading text (bottom, z-50) */}
      <div className="relative text-center space-y-2 z-50 mb-8">
        <p className="text-lg font-display font-bold text-slate-700 dark:text-slate-200">
          {LOADING_MESSAGES[msgIndex]}
        </p>
        <div className="flex justify-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        <p className="text-xs text-primary/40 font-japanese tracking-widest mt-4">
          しばらくお待ちください
        </p>
      </div>
    </div>
  );
}
