import { useMemo } from "react";
import SakuraPetal, { type PetalProps } from "@lib/decorations/SakuraPetal/SakuraPetal";

const SIZES: PetalProps["size"][] = ["small", "medium", "large"];

function generatePetals(count: number): PetalProps[] {
  return Array.from({ length: count }, () => ({
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 6}s`,
    duration: `${8 + Math.random() * 5}s`,
    size: SIZES[Math.floor(Math.random() * SIZES.length)],
  }));
}

interface FallingPetalsProps {
  count: number;
  /** Overrides the default container class */
  className?: string;
}

export default function FallingPetals({ count, className }: FallingPetalsProps) {
  const resolved = useMemo(() => generatePetals(count), [count]);

  return (
    <div className={className ?? "absolute inset-0 pointer-events-none overflow-hidden"}>
      {resolved.map((p, i) => (
        <SakuraPetal key={i} {...p} />
      ))}
    </div>
  );
}
