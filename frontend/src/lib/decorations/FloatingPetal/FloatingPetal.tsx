import type { CSSProperties } from "react";
import SakuraPetalIcon from "@assets/icons/sakura-petal.svg?react";

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
      <SakuraPetalIcon
        width={12}
        height={12}
        className="fill-[var(--color-sakura-pink)] drop-shadow-sm"
      />
    </div>
  );
}
