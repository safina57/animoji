import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Props {
  className?: string;
}

export default function CherryBlossom({ className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(ref.current, {
        y: -10,
        duration: 3,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
      gsap.to(ref.current, {
        rotation: 4,
        duration: 7,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        transformOrigin: "center center",
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className={className}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="cb2-petalGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFD6E0" />
            <stop offset="60%" stopColor="#FFB5C2" />
            <stop offset="100%" stopColor="#F5A0B0" />
          </radialGradient>
          <radialGradient id="cb2-petalBack" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#F5A0B0" />
            <stop offset="100%" stopColor="#E8879A" />
          </radialGradient>
          <radialGradient id="cb2-centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF6B9D" />
            <stop offset="70%" stopColor="#E84B7A" />
            <stop offset="100%" stopColor="#D4416E" />
          </radialGradient>
          <radialGradient id="cb2-budGrad" cx="40%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#FF9EBA" />
            <stop offset="100%" stopColor="#E8607A" />
          </radialGradient>
          <radialGradient id="cb2-stamenTip" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD6E0" />
            <stop offset="100%" stopColor="#FFB5C2" />
          </radialGradient>
          <filter id="cb2-softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
            <feOffset dx="0.5" dy="1" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.15" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Branch ─────────────────────────────────────────────── */}
        <path
          d="M5 185 Q40 155, 70 125 Q95 100, 120 78 Q145 56, 175 30 Q185 22, 195 15"
          stroke="#C4788A"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        <path
          d="M70 125 Q62 115, 52 108"
          stroke="#C4788A"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M120 78 Q130 84, 135 92"
          stroke="#C4788A"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.45"
        />

        {/* ── Large blossom ───────────────────────────────────────── */}
        <g filter="url(#cb2-softShadow)" transform="translate(62, 110)">
          <ellipse cx="0" cy="-14" rx="9" ry="14" fill="url(#cb2-petalBack)" transform="rotate(-25)" opacity="0.7" />
          <ellipse cx="0" cy="-14" rx="9" ry="14" fill="url(#cb2-petalBack)" transform="rotate(25)"  opacity="0.7" />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-15" rx="10" ry="16" fill="url(#cb2-petalGrad)" transform={`rotate(${a})`} />
          ))}
          {[0, 72, 144, 216, 288].map((a) => (
            <line key={a} x1="0" y1="-3" x2="0" y2="-22" stroke="#E8879A" strokeWidth="0.4" opacity="0.3" transform={`rotate(${a})`} />
          ))}
          <circle cx="0" cy="0" r="5" fill="url(#cb2-centerGlow)" />
          {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <line x1="0" y1="-5" x2="0" y2="-11" stroke="#E8607A" strokeWidth="0.6" opacity="0.6" />
              <circle cx="0" cy="-11.5" r="1" fill="url(#cb2-stamenTip)" opacity="0.85" />
            </g>
          ))}
        </g>

        {/* ── Medium blossom ──────────────────────────────────────── */}
        <g filter="url(#cb2-softShadow)" transform="translate(130, 70) scale(0.75)">
          <ellipse cx="0" cy="-13" rx="8" ry="13" fill="url(#cb2-petalBack)" transform="rotate(-30)" opacity="0.6" />
          <ellipse cx="0" cy="-13" rx="8" ry="13" fill="url(#cb2-petalBack)" transform="rotate(35)"  opacity="0.6" />
          {[10, 82, 154, 226, 298].map((a) => (
            <ellipse key={a} cx="0" cy="-14" rx="9.5" ry="15" fill="url(#cb2-petalGrad)" transform={`rotate(${a})`} />
          ))}
          {[10, 82, 154, 226, 298].map((a) => (
            <line key={a} x1="0" y1="-3" x2="0" y2="-20" stroke="#E8879A" strokeWidth="0.35" opacity="0.25" transform={`rotate(${a})`} />
          ))}
          <circle cx="0" cy="0" r="4.5" fill="url(#cb2-centerGlow)" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <line x1="0" y1="-4.5" x2="0" y2="-10" stroke="#E8607A" strokeWidth="0.5" opacity="0.55" />
              <circle cx="0" cy="-10.5" r="0.9" fill="url(#cb2-stamenTip)" opacity="0.8" />
            </g>
          ))}
        </g>

        {/* ── Small blossom ───────────────────────────────────────── */}
        <g filter="url(#cb2-softShadow)" transform="translate(170, 35) scale(0.5)">
          <ellipse cx="0" cy="-12" rx="8" ry="13" fill="url(#cb2-petalBack)" transform="rotate(-15)" opacity="0.55" />
          {[5, 77, 149, 221, 293].map((a) => (
            <ellipse key={a} cx="0" cy="-13" rx="9" ry="14" fill="url(#cb2-petalGrad)" transform={`rotate(${a})`} />
          ))}
          <circle cx="0" cy="0" r="4" fill="url(#cb2-centerGlow)" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <line x1="0" y1="-4" x2="0" y2="-9" stroke="#E8607A" strokeWidth="0.5" opacity="0.5" />
              <circle cx="0" cy="-9.5" r="0.8" fill="url(#cb2-stamenTip)" opacity="0.7" />
            </g>
          ))}
        </g>

        {/* ── Buds ────────────────────────────────────────────────── */}
        <g transform="translate(28, 165)">
          <line x1="0" y1="0" x2="-3" y2="10" stroke="#C4788A" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          <ellipse cx="-3" cy="12" rx="3.5" ry="5.5" fill="url(#cb2-budGrad)" transform="rotate(10, -3, 12)" />
          <path d="M-5.5 14 Q-3 10, -0.5 14" stroke="#D4708A" strokeWidth="0.6" fill="none" opacity="0.5" />
        </g>
        <g transform="translate(45, 140)">
          <line x1="0" y1="0" x2="4" y2="8" stroke="#C4788A" strokeWidth="1" strokeLinecap="round" opacity="0.55" />
          <ellipse cx="4" cy="10" rx="3" ry="5" fill="url(#cb2-budGrad)" transform="rotate(-8, 4, 10)" />
        </g>
        <g transform="translate(95, 92)">
          <line x1="0" y1="0" x2="-5" y2="7" stroke="#C4788A" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <ellipse cx="-5" cy="9" rx="2.8" ry="4.5" fill="url(#cb2-budGrad)" transform="rotate(12, -5, 9)" opacity="0.9" />
        </g>
        <g transform="translate(155, 48)">
          <line x1="0" y1="0" x2="3" y2="7" stroke="#C4788A" strokeWidth="0.8" strokeLinecap="round" opacity="0.45" />
          <ellipse cx="3" cy="8.5" rx="2.5" ry="4" fill="url(#cb2-budGrad)" opacity="0.8" />
        </g>

        {/* ── Loose petals ────────────────────────────────────────── */}
        <ellipse cx="90" cy="165" rx="5" ry="8" fill="#FFD6E0" opacity="0.45" transform="rotate(35, 90, 165)" />
        <ellipse cx="115" cy="180" rx="3.5" ry="6" fill="#FFB5C2" opacity="0.3" transform="rotate(-20, 115, 180)" />
      </svg>
    </div>
  );
}
