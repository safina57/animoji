/**
 * Lottie-compatible JSON animation data for a Japanese traditional house
 * with chimney smoke. This is a hand-crafted simple Lottie spec so it
 * works without requiring an external .json download.
 *
 * We render an inline SVG animation instead for reliability and smaller
 * bundle size. The Lottie player wraps it.
 */

import Lottie from "lottie-react";
import houseAnimation from "../../assets/loading-house.json";

const LOADING_MESSAGES = [
  "調理中…",
  "Creating your masterpiece…",
  "Channeling anime energy…",
  "Almost there…",
];

export default function LoadingScreen() {
  const message =
    LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-fade-in select-none">
      {/* Animation container */}
      <div className="relative w-64 h-64 md:w-80 md:h-80">
        <Lottie
          animationData={houseAnimation}
          loop
          className="w-full h-full"
        />
      </div>

      {/* Loading text */}
      <div className="text-center space-y-2">
        <p className="text-lg font-display font-bold text-slate-700 dark:text-slate-200">
          {message}
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
