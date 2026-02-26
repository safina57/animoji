interface SakuraTreeIconProps {
  position: "left" | "right"
  className?: string
}

export default function SakuraTreeIcon({ position, className }: SakuraTreeIconProps) {
  return (
    <svg
      width="200"
      height="250"
      viewBox="0 0 200 250"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`trunkGradient${position}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3E2723" />
          <stop offset="40%" stopColor="#5D4037" />
          <stop offset="100%" stopColor="#3E2723" />
        </linearGradient>
      </defs>

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
  )
}
