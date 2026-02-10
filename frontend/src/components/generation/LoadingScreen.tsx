import { useEffect, useState } from "react";

const LOADING_MESSAGES = [
  "Creating your masterpiece...",
  "Channeling anime energy...",
  "Almost there...",
  "Painting every pixel...",
];

function ToriiGateSvg() {
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full">
      {/* Ground */}
      <ellipse
        cx="200"
        cy="340"
        rx="180"
        ry="25"
        className="fill-emerald-200/60 dark:fill-emerald-900/40"
      />

      {/* Torii gate - Left pillar */}
      <rect
        x="90"
        y="160"
        width="20"
        height="180"
        rx="2"
        className="fill-red-700 dark:fill-red-800"
      />

      {/* Torii gate - Right pillar */}
      <rect
        x="290"
        y="160"
        width="20"
        height="180"
        rx="2"
        className="fill-red-700 dark:fill-red-800"
      />

      {/* Torii gate - Top horizontal beam (kasagi) */}
      <rect
        x="70"
        y="140"
        width="260"
        height="18"
        rx="4"
        className="fill-red-800 dark:fill-red-900"
      />
      {/* Kasagi top curve effect */}
      <ellipse
        cx="200"
        cy="140"
        rx="130"
        ry="6"
        className="fill-red-900 dark:fill-red-950"
      />

      {/* Torii gate - Lower horizontal beam (nuki) */}
      <rect
        x="85"
        y="200"
        width="230"
        height="14"
        rx="3"
        className="fill-red-700 dark:fill-red-800"
      />

      {/* Decorative rope (shimenawa) on top beam */}
      <path
        d="M 80 150 Q 120 145 160 150 T 240 150 T 320 150"
        stroke="#F4E4C1"
        strokeWidth="3"
        fill="none"
        className="dark:opacity-80"
      />
      {/* Rope tassels */}
      <line
        x1="120"
        y1="150"
        x2="120"
        y2="165"
        className="stroke-amber-100 dark:stroke-amber-200/70"
        strokeWidth="2"
      />
      <line
        x1="200"
        y1="150"
        x2="200"
        y2="165"
        className="stroke-amber-100 dark:stroke-amber-200/70"
        strokeWidth="2"
      />
      <line
        x1="280"
        y1="150"
        x2="280"
        y2="165"
        className="stroke-amber-100 dark:stroke-amber-200/70"
        strokeWidth="2"
      />

      {/* Smoke particles above (like incense) */}
      <circle
        cx="200"
        cy="120"
        r="4"
        className="fill-slate-300/60 dark:fill-slate-500/40 smoke-1"
      />
      <circle
        cx="205"
        cy="115"
        r="3"
        className="fill-slate-300/50 dark:fill-slate-500/30 smoke-2"
      />
      <circle
        cx="195"
        cy="110"
        r="5"
        className="fill-slate-300/40 dark:fill-slate-500/20 smoke-3"
      />
    </svg>
  );
}

export default function LoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-fade-in select-none">
      {/* Animation container */}
      <div className="relative w-64 h-64 md:w-80 md:h-80">
        <ToriiGateSvg />
      </div>

      {/* Loading text */}
      <div className="text-center space-y-2">
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
