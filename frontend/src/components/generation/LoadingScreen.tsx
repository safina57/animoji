import { useEffect, useMemo, useState } from "react";

const LOADING_MESSAGES = [
  "Creating your masterpiece...",
  "Channeling anime energy...",
  "Almost there...",
  "Painting every pixel...",
];

// ─── Falling Sakura Petal Component ─── //
interface PetalProps {
  delay: string;
  left: string;
  size: "small" | "medium" | "large";
  duration: string;
}

function SakuraPetal({ delay, left, size, duration }: PetalProps) {
  const sizeClasses = {
    small: "w-2 h-2",
    medium: "w-3 h-3",
    large: "w-4 h-4",
  };

  return (
    <div
      className={`absolute -top-10 animate-fall ${sizeClasses[size]}`}
      style={{
        left,
        animationDelay: delay,
        animationDuration: duration,
      }}
    >
      <svg
        viewBox="0 0 100 130"
        className="w-full h-full fill-[var(--color-sakura-pink)] drop-shadow-sm"
      >
        <path d="M50 0 C60 30 100 50 100 80 C100 110 80 130 50 130 C20 130 0 110 0 80 C0 50 40 30 50 0 Z" />
      </svg>
    </div>
  );
}

// ─── Floating Petal on Water Component ─── //
interface FloatingPetalProps {
  style: React.CSSProperties;
  delay: string;
}

function FloatingPetal({ style, delay }: FloatingPetalProps) {
  return (
    <div
      className="absolute animate-float opacity-80"
      style={{ ...style, animationDelay: delay }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 100 130"
        className="fill-[var(--color-sakura-pink)] drop-shadow-sm"
      >
        <path d="M50 0 C60 30 100 50 100 80 C100 110 80 130 50 130 C20 130 0 110 0 80 C0 50 40 30 50 0 Z" />
      </svg>
    </div>
  );
}

// ─── Torii Gate Component (from example) ─── //
function ToriiGate() {
  return (
    <div className="relative flex flex-col items-center justify-end z-30 scale-90 md:scale-100 lg:scale-110">
      {/* Top Bar (Kasagi & Shimaki) */}
      <div className="relative">
        <div className="w-64 h-4 bg-[var(--color-torii-red)] rounded-full transform -skew-x-6 shadow-lg relative z-20 flex items-center justify-center">
          <div className="w-60 h-2 bg-black opacity-10 absolute top-1 rounded-full"></div>
        </div>
        {/* Secondary Top Bar (Nuki) */}
        <div className="w-56 h-3 bg-[var(--color-torii-red)] rounded mx-auto mt-6 shadow-md relative z-10"></div>
      </div>

      {/* Pillars (Hashira) */}
      <div className="flex justify-between w-40 -mt-8 relative z-0">
        <div className="w-4 h-48 bg-[var(--color-torii-red)] rounded-t shadow-inner flex flex-col items-center">
          <div className="w-5 h-2 bg-black opacity-10 mt-8"></div>
          <div className="w-full h-full bg-gradient-to-r from-transparent via-red-700 to-transparent opacity-5"></div>
        </div>
        <div className="w-4 h-48 bg-[var(--color-torii-red)] rounded-t shadow-inner flex flex-col items-center">
          <div className="w-5 h-2 bg-black opacity-10 mt-8"></div>
          <div className="w-full h-full bg-gradient-to-r from-transparent via-red-700 to-transparent opacity-5"></div>
        </div>
      </div>

      {/* Gate Base Stones */}
      <div className="flex justify-between w-44 -mt-1 relative z-10">
        <div className="w-6 h-3 bg-[var(--color-stone-gray)] rounded-sm shadow"></div>
        <div className="w-6 h-3 bg-[var(--color-stone-gray)] rounded-sm shadow"></div>
      </div>
    </div>
  );
}

// ─── Sakura Tree Component ─── //
interface TreeProps {
  position: "left" | "right";
}

function SakuraTree({ position }: TreeProps) {
  const isLeft = position === "left";

  // Foliage clusters configuration
  const clusters = [
    { x: 10, y: -20, scale: 1.2, delay: "0s" },
    { x: 40, y: -40, scale: 1.5, delay: "0.5s" },
    { x: -20, y: -30, scale: 1.3, delay: "1s" },
    { x: 60, y: -10, scale: 1.1, delay: "1.5s" },
    { x: 20, y: -60, scale: 1.4, delay: "2s" },
  ];

  return (
    <div
      className={`absolute ${isLeft ? "-left-10" : "-right-10"} bottom-2 z-20 hidden md:block opacity-80`}
      style={{ transform: `scaleX(${isLeft ? 1 : -1}) scale(0.9)` }}
    >
      {/* Organic Trunk & Branches (SVG) */}
      <svg
        width="200"
        height="250"
        viewBox="0 0 200 250"
        className="overflow-visible"
      >
        <defs>
          <linearGradient
            id={`trunkGradient${position}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#3E2723" />
            <stop offset="40%" stopColor="#5D4037" />
            <stop offset="100%" stopColor="#3E2723" />
          </linearGradient>
        </defs>

        {/* Main Trunk with organic curves */}
        <path
          d="M90,250 C100,220 80,200 85,150 C90,100 60,80 50,50"
          fill="none"
          stroke={`url(#trunkGradient${position})`}
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M90,250 C100,220 80,200 85,150 C90,100 120,80 140,40"
          fill="none"
          stroke={`url(#trunkGradient${position})`}
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Sub Branches */}
        <path
          d="M85,150 C90,130 110,130 130,120"
          stroke={`url(#trunkGradient${position})`}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M70,100 C60,90 40,90 20,80"
          stroke={`url(#trunkGradient${position})`}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M120,70 C130,60 150,60 170,50"
          stroke={`url(#trunkGradient${position})`}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Foliage Clusters */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {clusters.map((cluster, i) => (
          <div
            key={i}
            className="absolute animate-sway origin-bottom"
            style={{
              left: `${62 + cluster.x}px`,
              top: `${80 + cluster.y}px`,
              transform: `scale(${cluster.scale})`,
              animationDelay: cluster.delay,
            }}
          >
            {/* Dense cluster of petals using overlapping blobs */}
            <div className="relative">
              {/* Base cloud shape */}
              <div className="w-16 h-12 bg-[var(--color-sakura-pink)] rounded-full opacity-90 blur-[1px] shadow-sm"></div>

              {/* Detailed overlapping blobs for texture */}
              <div className="absolute -top-4 -left-2 w-10 h-10 bg-[#ffcdd2] rounded-full opacity-80"></div>
              <div className="absolute -top-2 left-6 w-12 h-10 bg-[#f8bbd0] rounded-full opacity-80"></div>
              <div className="absolute top-4 -left-4 w-10 h-8 bg-[#f48fb1] rounded-full opacity-70"></div>

              {/* Highlight */}
              <div className="absolute top-2 left-4 w-6 h-4 bg-white opacity-30 rounded-full blur-[2px]"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stone Path Component ─── //
function StonePath() {
  return (
    <div className="flex flex-col items-center relative z-30 transform">
      {/* Path stones getting larger towards bottom with gradients */}
      <div className="w-16 h-4 bg-gradient-to-br from-gray-200 to-[#A0ABA8] rounded-full mb-1 opacity-90 shadow-sm border-b-2 border-gray-400"></div>
      
      <div className="w-20 h-6 bg-gradient-to-br from-gray-100 to-gray-400 rounded-full mb-2 opacity-95 shadow-md flex items-center justify-center border-b-2 border-gray-500">
        <div className="w-10 h-3 bg-gray-500 rounded-full opacity-10 blur-[1px]"></div>
      </div>
      
      <div className="w-24 h-8 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-500 rounded-full mb-2 shadow-lg relative overflow-hidden border-b-4 border-gray-600/30">
        <div className="absolute top-0 right-2 w-10 h-6 bg-white opacity-20 rounded-full blur-[2px]"></div>
      </div>
      
      <div className="w-32 h-10 bg-gradient-to-br from-[#E0E0E0] via-[#BDBDBD] to-[#757575] rounded-full shadow-xl flex items-center justify-center relative border-b-4 border-gray-700/20">
        <div className="absolute top-1 right-6 w-12 h-4 bg-white opacity-10 rounded-full blur-[1px]"></div>
      </div>
    </div>
  );
}

// ─── Pond Component ─── //
function Pond() {
  return (
    <div className="relative w-full h-32 overflow-visible flex justify-center items-end">
      {/* Deep Water Layer (Back) - extends to bottom */}
      <div className="absolute bottom-0 w-[95%] h-40 bg-[#8AB6C7] rounded-[100%_100%_0_0] opacity-90 blur-sm transform scale-y-50 translate-y-12 shadow-inner"></div>

      {/* Mid Water Layer */}
      <div className="absolute bottom-0 w-[85%] h-36 bg-[var(--color-water-blue)] rounded-[100%_100%_0_0] opacity-80 blur-[2px] transform scale-y-50 translate-y-10"></div>

      {/* Top Water Layer (Highlights) */}
      <div className="absolute bottom-0 w-[75%] h-32 bg-[#D5EFF5] rounded-[100%_100%_0_0] opacity-40 blur-md transform scale-y-50 translate-y-8 animate-pulse"></div>

      {/* Ripples */}
      <div
        className="absolute bottom-6 left-1/4 w-20 h-10 border-2 border-white rounded-full opacity-30 animate-ripple"
        style={{ animationDelay: "0s" }}
      ></div>
      <div
        className="absolute bottom-8 right-1/3 w-16 h-8 border-2 border-white rounded-full opacity-30 animate-ripple"
        style={{ animationDelay: "1.5s" }}
      ></div>

      {/* Floating Petals - visible on md+ screens */}
      <FloatingPetal
        style={{ bottom: "1.5rem", left: "20%", transform: "rotate(15deg)" }}
        delay="0s"
      />
      <FloatingPetal
        style={{ bottom: "2rem", right: "30%", transform: "rotate(-45deg)" }}
        delay="1s"
      />
      <FloatingPetal
        style={{ bottom: "1rem", left: "45%", transform: "rotate(90deg)" }}
        delay="2s"
      />
      <div className="hidden md:block">
        <FloatingPetal
          style={{ bottom: "1.8rem", right: "15%", transform: "rotate(30deg)" }}
          delay="3.5s"
        />
        <FloatingPetal
          style={{ bottom: "0.8rem", left: "35%", transform: "rotate(-10deg)" }}
          delay="4s"
        />
      </div>

      {/* Koi Fish 1 - visible on md+ screens */}
      <div className="hidden md:block absolute bottom-6 left-1/3 animate-float opacity-70 z-10">
        <div className="w-6 h-3 bg-gradient-to-r from-orange-600 to-orange-400 rounded-full relative transform rotate-12 shadow-sm">
          <div className="absolute -right-1 top-1 w-2 h-2 bg-white rounded-full opacity-50"></div>
          <div className="absolute -left-1 top-0.5 w-2 h-2 bg-orange-400 rounded-full opacity-80 blur-[1px]"></div>
        </div>
      </div>

      {/* Koi Fish 2 - visible on md+ screens */}
      <div
        className="hidden md:block absolute bottom-4 right-1/4 animate-float opacity-70 z-10"
        style={{ animationDelay: "2s" }}
      >
        <div className="w-5 h-2 bg-gradient-to-r from-red-500 to-red-300 rounded-full relative transform -rotate-12 shadow-sm">
          <div className="absolute -left-1 top-0.5 w-1.5 h-1.5 bg-white rounded-full opacity-50"></div>
          <div className="absolute -right-0.5 top-0.5 w-1.5 h-1.5 bg-red-300 rounded-full opacity-80 blur-[1px]"></div>
        </div>
      </div>

      {/* Lily Pads - visible on md+ screens */}
      <div
        className="hidden md:block absolute bottom-7 left-1/4 w-6 h-4 bg-[var(--color-moss-green)] rounded-full opacity-90 shadow-sm animate-float border-b-2 border-green-800"
        style={{ animationDelay: "3s" }}
      ></div>
      <div
        className="hidden md:block absolute bottom-3 right-[15%] w-7 h-5 bg-[var(--color-moss-green)] rounded-full opacity-90 shadow-sm animate-float border-b-2 border-green-800"
        style={{ animationDelay: "2.5s" }}
      ></div>
    </div>
  );
}

// ─── Main Loading Screen Component ─── //
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
      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl h-[500px] justify-end pb-0 mb-24">
        {/* Trees - positioned inside scene */}
        <SakuraTree position="left" />
        <SakuraTree position="right" />

        {/* Central Architecture */}
        <div className="flex flex-col items-center transform translate-y-12 md:translate-y-12 z-30">
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
