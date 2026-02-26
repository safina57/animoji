interface TempleBuildingProps {
  className?: string
}

export default function TempleBuilding({ className }: TempleBuildingProps) {
  return (
    <svg
      viewBox="0 0 120 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Spire */}
      <rect x="57" y="0" width="6" height="14" rx="3" fill="currentColor" />
      <rect x="53" y="12" width="14" height="4" rx="2" fill="currentColor" />

      {/* Roof tier 1 (top, smallest) */}
      <path d="M44 16 L60 11 L76 16 L82 27 H38 Z" fill="currentColor" />
      <rect x="47" y="27" width="26" height="7" rx="1" fill="currentColor" />

      {/* Roof tier 2 (mid) */}
      <path d="M27 34 L60 27 L93 34 L100 46 H20 Z" fill="currentColor" />
      <rect x="34" y="46" width="52" height="9" rx="1" fill="currentColor" />

      {/* Roof tier 3 (main, widest) */}
      <path d="M8 55 L60 46 L112 55 L120 68 H0 Z" fill="currentColor" />

      {/* Main hall body */}
      <rect x="18" y="68" width="84" height="28" rx="2" fill="currentColor" />

      {/* Steps */}
      <rect x="12" y="96" width="96" height="5" rx="2" fill="currentColor" />
      <rect x="5" y="101" width="110" height="5" rx="2" fill="currentColor" />
      <rect x="0" y="106" width="120" height="5" rx="2" fill="currentColor" />
    </svg>
  )
}
