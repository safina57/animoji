import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const DEFAULT_MESSAGES = [
  "Creating your masterpiece...",
  "Channeling anime energy...",
  "Painting every pixel...",
  "Almost there...",
];

interface LoadingDialogProps {
  messages?: string[];
}

export default function LoadingDialog({ messages = DEFAULT_MESSAGES }: LoadingDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const dotsRef = useRef<(HTMLSpanElement | null)[]>([null, null, null]);

  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const pathEl = pathRef.current;
    if (!pathEl) return;

    const pathLength = pathEl.getTotalLength();

    const ctx = gsap.context(() => {
      // Backdrop + card entrance
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 }).fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.92, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.4)" },
        "<0.1",
      );

      // SVG stroke draw → sweep → loop
      gsap.set(pathEl, {
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength,
      });

      gsap.timeline({ repeat: -1, repeatDelay: 0.9, delay: 0.4 })
        .to(pathEl, {
          strokeDashoffset: 0,
          duration: 2.6,
          ease: "power2.inOut",
        })
        .to(pathEl, {
          strokeDashoffset: -pathLength,
          duration: 1.8,
          ease: "power2.in",
          delay: 1.2,
        });

      // Glow pulse
      gsap.to(glowRef.current, {
        opacity: 0.7,
        scale: 1.25,
        duration: 2.2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });

      // Text entrance
      gsap.fromTo(
        textRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.55 },
      );

      // Dots bounce
      const validDots = dotsRef.current.filter(Boolean);
      gsap.to(validDots, {
        y: -6,
        duration: 0.4,
        stagger: 0.13,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: 0.7,
      });
    });

    return () => ctx.revert();
  }, []);

  // Message cycling with GSAP crossfade
  useEffect(() => {
    const msgEl = textRef.current;
    if (!msgEl) return;

    const id = setInterval(() => {
      gsap.to(msgEl, {
        opacity: 0,
        y: -7,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          setMsgIndex((prev) => (prev + 1) % messages.length);
          gsap.fromTo(msgEl, { opacity: 0, y: 7 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
        },
      });
    }, 3200);

    return () => clearInterval(id);
  }, []);

  return (
    // Backdrop
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      {/* Dialog card */}
      <div
        ref={cardRef}
        className="
          relative w-full max-w-xs rounded-2xl
          bg-paper-light dark:bg-paper-dark
          border border-primary/15 dark:border-sakura-pink/20
          shadow-2xl shadow-black/20 dark:shadow-black/50
          flex flex-col items-center gap-8 px-10 py-12
          select-none overflow-hidden
        "
      >
        {/* Seigaiha pattern overlay */}
        <div className="absolute inset-0 pattern-seigaiha opacity-60 dark:opacity-30 pointer-events-none" />

        {/* SVG + glow */}
        <div className="relative w-32 h-32">
          <svg
            viewBox="0 0 511.999 511.999"
            width="100%"
            height="100%"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              ref={pathRef}
              className="torii-path"
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
              style={{ fill: "none", strokeWidth: 2 }}
            />
          </svg>

          {/* Colored glow behind the SVG */}
          <div
            ref={glowRef}
            className="absolute inset-0 rounded-full blur-3xl opacity-25 bg-primary dark:bg-sakura-pink"
          />
        </div>

        {/* Text */}
        <div className="relative flex flex-col items-center gap-3 text-center">
          <p
            ref={textRef}
            className="font-display font-semibold text-sm tracking-wide text-slate-700 dark:text-slate-200"
          >
            {messages[msgIndex]}
          </p>

          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                ref={(el) => {
                  dotsRef.current[i] = el;
                }}
                className="inline-block w-1.5 h-1.5 rounded-full bg-primary dark:bg-sakura-pink"
              />
            ))}
          </div>

          <p className="text-xs tracking-widest font-japanese text-primary/50 dark:text-sakura-pink/50">
            しばらくお待ちください
          </p>
        </div>
      </div>
    </div>
  );
}
