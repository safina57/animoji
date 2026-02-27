export default function CherryBlossomFlower({ className = "" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: 300, height: 300 }}
    >
      <defs>
        <radialGradient id="petalGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFD6E0" />
          <stop offset="55%" stopColor="#FFB5C2" />
          <stop offset="100%" stopColor="#F5A0B0" />
        </radialGradient>

        <radialGradient id="petalBack" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#F5A0B0" />
          <stop offset="100%" stopColor="#E8879A" />
        </radialGradient>

        <radialGradient id="centerGlow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#FF6B9D" />
          <stop offset="65%" stopColor="#E84B7A" />
          <stop offset="100%" stopColor="#D4416E" />
        </radialGradient>

        <radialGradient id="stamenTip" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD6E0" />
          <stop offset="100%" stopColor="#FFB5C2" />
        </radialGradient>

        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" />
          <feOffset dx="0.4" dy="0.8" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.12" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#softShadow)" transform="translate(50, 50)">
        {/* Back petals — deeper pink, offset for depth */}
        <ellipse
          cx="0" cy="-18" rx="11" ry="19"
          fill="url(#petalBack)"
          transform="rotate(-22)"
          opacity="0.65"
        />
        <ellipse
          cx="0" cy="-18" rx="11" ry="19"
          fill="url(#petalBack)"
          transform="rotate(22)"
          opacity="0.65"
        />

        {/* 5 main petals */}
        {[0, 72, 144, 216, 288].map((angle) => (
          <ellipse
            key={angle}
            cx="0" cy="-19" rx="12.5" ry="20"
            fill="url(#petalGrad)"
            transform={`rotate(${angle})`}
          />
        ))}

        {/* Petal veins */}
        {[0, 72, 144, 216, 288].map((angle) => (
          <line
            key={`v${angle}`}
            x1="0" y1="-4" x2="0" y2="-28"
            stroke="#E8879A"
            strokeWidth="0.4"
            opacity="0.25"
            transform={`rotate(${angle})`}
          />
        ))}

        {/* Center disc */}
        <circle cx="0" cy="0" r="6.5" fill="url(#centerGlow)" />

        {/* Stamens */}
        {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((angle) => (
          <g key={`s${angle}`} transform={`rotate(${angle})`}>
            <line
              x1="0" y1="-6.5" x2="0" y2="-13.5"
              stroke="#E8607A"
              strokeWidth="0.6"
              opacity="0.55"
            />
            <circle
              cx="0" cy="-14.2" r="1.2"
              fill="url(#stamenTip)"
              opacity="0.85"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
