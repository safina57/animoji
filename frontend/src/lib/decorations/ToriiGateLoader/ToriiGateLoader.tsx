import { useEffect, useRef } from "react";
import gsap from "gsap";
import { TORII_PATH } from "@lib/decorations/ToriiGateSilhouette/ToriiGateSilhouette";

interface ToriiGateLoaderProps {
  /** Size of the container, e.g. "w-32 h-32" or "w-14 h-14" */
  className?: string;
  /** Glow blur + opacity overrides, e.g. "blur-3xl opacity-25" */
  glowClassName?: string;
}

export default function ToriiGateLoader({
  className = "w-24 h-24",
  glowClassName = "blur-2xl opacity-20",
}: ToriiGateLoaderProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pathEl = pathRef.current;
    if (!pathEl) return;

    const pathLength = pathEl.getTotalLength();

    const ctx = gsap.context(() => {
      gsap.set(pathEl, { strokeDasharray: pathLength, strokeDashoffset: pathLength });

      gsap.timeline({ repeat: -1, repeatDelay: 0.7 })
        .to(pathEl, { strokeDashoffset: 0, duration: 2.5, ease: "power2.inOut" })
        .to(pathEl, { strokeDashoffset: -pathLength, duration: 1.7, ease: "power2.in", delay: 1.0 });

      gsap.to(glowRef.current, {
        opacity: 0.6,
        scale: 1.2,
        duration: 2.0,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 511.999 511.999"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          ref={pathRef}
          className="torii-path"
          d={TORII_PATH}
          style={{ fill: "none", strokeWidth: 2 }}
        />
      </svg>
      <div
        ref={glowRef}
        className={`absolute inset-0 rounded-full bg-primary dark:bg-sakura-pink ${glowClassName}`}
      />
    </div>
  );
}
