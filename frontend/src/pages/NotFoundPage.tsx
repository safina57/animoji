import { Link } from "react-router-dom";
import { Button } from "@lib/ui/button";
import { Home, Wand2 } from "lucide-react";
import SakuraPetal from "@lib/decorations/SakuraPetal/SakuraPetal";

/* ─── Static scene data (deterministic, no Math.random) ─── */

const PETALS = [
  { left: "6%",  delay: "0s",    duration: "9s",  size: "medium" },
  { left: "14%", delay: "2.5s",  duration: "11s", size: "small"  },
  { left: "22%", delay: "1.1s",  duration: "10s", size: "large"  },
  { left: "30%", delay: "4.2s",  duration: "8s",  size: "small"  },
  { left: "41%", delay: "0.6s",  duration: "12s", size: "medium" },
  { left: "53%", delay: "3.3s",  duration: "9s",  size: "large"  },
  { left: "62%", delay: "1.8s",  duration: "11s", size: "small"  },
  { left: "70%", delay: "5.1s",  duration: "10s", size: "medium" },
  { left: "78%", delay: "2.0s",  duration: "8s",  size: "large"  },
  { left: "86%", delay: "3.7s",  duration: "11s", size: "small"  },
  { left: "92%", delay: "0.9s",  duration: "9s",  size: "medium" },
  { left: "3%",  delay: "6.2s",  duration: "12s", size: "large"  },
] as const;

const STARS = Array.from({ length: 58 }, (_, i) => ({
  left: `${((i * 37 + 13) % 96) + 2}%`,
  top:  `${((i * 61 + 7)  % 58) + 1}%`,
  size: (i % 3) + 1,
  delay:    `${((i * 0.41) % 4).toFixed(1)}s`,
  duration: `${(2.2 + (i % 4) * 0.55).toFixed(1)}s`,
}));


/* ─── Torii gate SVG (detailed outline) ─── */
function BackgroundTorii() {
  return (
    <svg
      viewBox="0 0 511.999 511.999"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="w-full h-full"
      style={{ animation: "torii-glow 5s ease-in-out infinite" }}
    >
      <path
        fill="currentColor"
        d="M486.203,30.815c-29.313,10.366-118.518,41.91-230.204,41.91S55.11,41.181,25.796,30.815L0,21.694l20.842,121.92
        l8.888,3.144c24.586,8.694,63.632,15.025,113.844,18.682v42.577c-50.544-4.079-79.679-10.691-96.364-16.592l-10.709,30.282
        c5.313,1.879,11.144,3.638,17.479,5.283v70.587h57.472v192.73h96.365v-192.73h96.365v192.73h96.365v-192.73h57.472v-70.587
        c6.335-1.644,12.167-3.404,17.48-5.283l-10.709-30.283c-16.685,5.901-45.819,12.513-96.364,16.592v-42.577
        c50.212-3.656,89.258-9.988,113.844-18.682l8.888-3.144l20.842-121.92L486.203,30.815z M175.695,458.184h-32.122V297.577h32.122
        V458.184z M368.425,458.184h-32.122V297.577h32.122V458.184z M425.897,233.616v31.839H86.102v-31.839
        c42.297,6.926,99.137,10.424,169.898,10.424C326.76,244.041,383.6,240.541,425.897,233.616z M175.695,210.091v-42.751
        c13.641,0.637,27.928,1.105,42.829,1.394v42.821C203.048,211.247,188.805,210.745,175.695,210.091z M250.646,201.212V169.09
        h10.707v32.122H250.646z M293.475,211.556v-42.821c14.901-0.289,29.188-0.757,42.829-1.394v42.751
        C323.194,210.745,308.951,211.247,293.475,211.556z M462.732,119.265c-39.719,11.295-113.966,17.703-206.732,17.703
        S88.986,130.56,49.267,119.265l-8.446-49.403c43.292,13.97,121.55,34.985,215.178,34.985s171.886-21.015,215.178-34.985
        L462.732,119.265z"
      />
    </svg>
  );
}

/* ─── Page ─── */
export default function NotFoundPage() {
  return (
    <div className="relative flex-1 min-h-[calc(100vh-4rem)] overflow-hidden flex items-center justify-center isolate bg-background-light dark:bg-background-dark">

      {/* ── Subtle gradient atmosphere (uses theme tokens) ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-sakura-pink/5 pointer-events-none" />

      {/* ── Stars — dark mode only ── */}
      <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-500">
        {STARS.map((star, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animation: `twinkle ${star.duration} ease-in-out ${star.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* ── Sakura petals ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {PETALS.map((p, i) => (
          <SakuraPetal key={i} {...p} />
        ))}
      </div>

      {/* ── Torii gate silhouette — bottom center ── */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] md:w-[560px] lg:w-[680px] text-primary pointer-events-none"
        style={{ opacity: 0.13 }}
      >
        <BackgroundTorii />
      </div>

      {/* ── Seigaiha pattern overlay ── */}
      <div className="absolute inset-0 pattern-seigaiha pointer-events-none opacity-20 dark:opacity-10" />

      {/* ── Main content ── */}
      <div className="relative z-10 text-center px-6 py-12 w-full max-w-2xl mx-auto">

        {/* Vertical Japanese text — left */}
        <span
          className="absolute -left-4 xl:-left-16 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl] hidden lg:block pointer-events-none select-none font-japanese font-bold text-5xl tracking-[0.6em] text-primary/10 dark:text-primary/[0.07]"
          aria-hidden="true"
        >
          四〇四
        </span>

        {/* Vertical Japanese text — right */}
        <span
          className="absolute -right-4 xl:-right-16 top-1/2 -translate-y-1/2 [writing-mode:vertical-lr] hidden lg:block pointer-events-none select-none font-japanese font-bold text-5xl tracking-[0.6em] text-primary/10 dark:text-primary/[0.07]"
          aria-hidden="true"
        >
          聖域外
        </span>

        {/* 404 */}
        <div className="relative inline-block animate-fade-in" aria-label="404">
          <span
            className="text-[150px] md:text-[210px] font-display font-bold leading-none tracking-tight select-none text-primary"
            style={{ filter: "drop-shadow(0 0 40px rgba(230, 57, 70, 0.25))" }}
          >
            404
          </span>
        </div>

        {/* Heading */}
        <div
          className="space-y-3 mt-1 animate-slide-up"
          style={{ animationDelay: "0.15s", animationFillMode: "both" }}
        >
          <h1 className="text-3xl md:text-5xl font-display font-bold text-slate-900 dark:text-white">
            Lost in the Shrine
          </h1>
          <p className="text-primary/65 dark:text-primary/45 font-japanese text-lg tracking-[0.35em]">
            迷子になりました
          </p>
        </div>

        {/* Description */}
        <p
          className="mt-6 text-slate-600 dark:text-slate-400 text-base leading-relaxed max-w-sm mx-auto animate-fade-in"
          style={{ animationDelay: "0.3s", animationFillMode: "both" }}
        >
          The spirits have led you astray. This page has wandered beyond the
          torii gate into the unknown realm.
        </p>

        {/* CTA buttons */}
        <div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
          style={{ animationDelay: "0.45s", animationFillMode: "both" }}
        >
          <Link to="/">
            <Button size="lg" className="gap-2">
              <Home className="h-4 w-4" />
              Return Home
            </Button>
          </Link>
          <Link to="/create">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-slate-600 dark:text-slate-400 hover:text-primary"
            >
              <Wand2 className="h-4 w-4" />
              Start Creating
            </Button>
          </Link>
        </div>

        {/* Divider with shrine motif */}
        <div
          className="mt-12 flex items-center justify-center gap-6 animate-fade-in"
          style={{ animationDelay: "0.6s", animationFillMode: "both" }}
        >
          <div className="flex-1 max-w-[80px] border-t border-primary/15 dark:border-primary/10" />
          <span className="font-japanese text-xs text-primary/30 dark:text-primary/20 tracking-[0.4em]">
            鳥居
          </span>
          <div className="flex-1 max-w-[80px] border-t border-primary/15 dark:border-primary/10" />
        </div>
      </div>
    </div>
  );
}
