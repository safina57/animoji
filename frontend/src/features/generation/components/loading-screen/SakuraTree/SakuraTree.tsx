interface TreeProps {
  position: "left" | "right";
}

interface ClusterConfig {
  x: number;
  y: number;
  scale: number;
  delay: string;
}

const CLUSTERS: ClusterConfig[] = [
  { x: 10, y: -20, scale: 1.3, delay: "0s" },
  { x: 40, y: -40, scale: 1.3, delay: "0.5s" },
  { x: -20, y: -30, scale: 1.3, delay: "1s" },
  { x: 60, y: -10, scale: 1.3, delay: "1.5s" },
  { x: 20, y: -60, scale: 1.3, delay: "2s" },
];

export default function SakuraTree({ position }: TreeProps) {
  const isLeft = position === "left";

  return (
    <div
      className={`hidden md:block opacity-80 absolute ${isLeft ? "-left-10" : "-right-10"} bottom-2 z-20`}
      style={{ transform: `scaleX(${isLeft ? 1 : -1}) scale(0.9)` }}
    >
      {/* Organic Trunk & Branches (SVG) */}
      <svg
        width="200"
        height="250"
        viewBox="0 0 200 250"
        className="overflow-visible"
      >
        <defs>
          <linearGradient
            id={`trunkGradient${position}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#3E2723" />
            <stop offset="40%" stopColor="#5D4037" />
            <stop offset="100%" stopColor="#3E2723" />
          </linearGradient>
        </defs>

        {/* Main Trunk with organic curves */}
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

        {/* Sub Branches */}
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

      {/* Foliage Clusters */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {CLUSTERS.map((cluster, i) => (
          <div
            key={i}
            className="absolute animate-sway origin-bottom"
            style={{
              left: `${65 + cluster.x}px`,
              top: `${80 + cluster.y}px`,
              transform: `scale(${cluster.scale})`,
              animationDelay: cluster.delay,
            }}
          >
            {/* Dense cluster of petals using overlapping blobs */}
            <div className="relative">
              {/* Base cloud shape */}
              <div className="w-16 h-12 bg-[var(--color-sakura-pink)] rounded-full opacity-90 blur-[1px] shadow-sm"></div>

              {/* Detailed overlapping blobs for texture */}
              <div className="absolute -top-4 -left-2 w-10 h-10 bg-[#ffcdd2] rounded-full opacity-80"></div>
              <div className="absolute -top-2 left-6 w-12 h-10 bg-[#f8bbd0] rounded-full opacity-80"></div>
              <div className="absolute top-4 -left-4 w-10 h-8 bg-[#f48fb1] rounded-full opacity-70"></div>

              {/* Highlight */}
              <div className="absolute top-2 left-4 w-6 h-4 bg-white opacity-30 rounded-full blur-[2px]"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
