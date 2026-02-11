import type { CSSProperties } from "react";

interface FloatingPetalProps {
  style: CSSProperties;
  delay: string;
}

export default function FloatingPetal({ style, delay }: FloatingPetalProps) {
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
