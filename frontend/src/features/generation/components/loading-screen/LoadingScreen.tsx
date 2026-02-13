import { useEffect, useMemo, useState } from "react";
import SakuraPetal, { type PetalProps } from "./SakuraPetal/SakuraPetal";
import ToriiGate from "./ToriiGate/ToriiGate";
import SakuraTree from "./SakuraTree/SakuraTree";
import StonePath from "./StonePath/StonePath";
import Pond from "./Pond/Pond";

const LOADING_MESSAGES = [
  "Creating your masterpiece...",
  "Channeling anime energy...",
  "Almost there...",
  "Painting every pixel...",
];

export default function LoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Generate randomized falling petals once on mount
  const fallingPetals = useMemo(() => {
    const petals: PetalProps[] = [];
    const sizes: Array<"small" | "medium" | "large"> = [
      "small",
      "medium",
      "large",
    ];

    // Background petals (10 petals, lighter, more transparent)
    for (let i = 0; i < 10; i++) {
      petals.push({
        delay: `${Math.random() * 5}s`,
        left: `${Math.random() * 100}%`,
        size: sizes[Math.floor(Math.random() * sizes.length)],
        duration: `${7 + Math.random() * 6}s`,
      });
    }

    // Front petals (10 petals, larger, higher contrast) - only on lg+ screens
    for (let i = 0; i < 10; i++) {
      petals.push({
        delay: `${Math.random() * 5}s`,
        left: `${Math.random() * 100}%`,
        size: sizes[Math.floor(Math.random() * sizes.length)],
        duration: `${7 + Math.random() * 6}s`,
      });
    }

    return petals;
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-fade-in select-none relative overflow-hidden bg-transparent">
      {/* Background falling petals (z-0) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {fallingPetals.slice(0, 10).map((petal, i) => (
          <SakuraPetal key={`bg-${i}`} {...petal} />
        ))}
      </div>

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
      <div className="hidden lg:block absolute inset-0 pointer-events-none z-40">
        {fallingPetals.slice(10, 20).map((petal, i) => (
          <SakuraPetal key={`fg-${i}`} {...petal} />
        ))}
      </div>

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
