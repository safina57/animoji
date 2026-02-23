import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import SeigaihaOverlay from "@lib/decorations/SeigaihaOverlay/SeigaihaOverlay";
import ToriiGateLoader from "@lib/decorations/ToriiGateLoader/ToriiGateLoader";

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
  const textRef = useRef<HTMLParagraphElement>(null);
  const dotsRef = useRef<(HTMLSpanElement | null)[]>([null, null, null]);

  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Backdrop + card entrance
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 }).fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.92, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.4)" },
        "<0.1",
      );

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
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
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
        <SeigaihaOverlay className="absolute opacity-60 dark:opacity-30" />

        <ToriiGateLoader className="w-32 h-32" glowClassName="blur-3xl opacity-25" />

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
                ref={(el) => { dotsRef.current[i] = el; }}
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
