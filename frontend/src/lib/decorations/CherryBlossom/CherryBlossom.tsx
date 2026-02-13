export default function CherryBlossom({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Branch */}
      <path
        d="M10 90 Q30 70, 50 50 Q70 30, 90 10"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
        fill="none"
      />

      {/* Blossoms */}
      <g opacity="0.6">
        {/* Blossom 1 */}
        <circle cx="35" cy="65" r="8" fill="#FFB5C2" />
        <circle cx="32" cy="62" r="5" fill="#FFB5C2" />
        <circle cx="38" cy="62" r="5" fill="#FFB5C2" />
        <circle cx="35" cy="59" r="5" fill="#FFB5C2" />
        <circle cx="35" cy="68" r="4" fill="#FF6B9D" />

        {/* Blossom 2 */}
        <circle cx="60" cy="40" r="7" fill="#FFB5C2" />
        <circle cx="57" cy="37" r="4" fill="#FFB5C2" />
        <circle cx="63" cy="37" r="4" fill="#FFB5C2" />
        <circle cx="60" cy="34" r="4" fill="#FFB5C2" />
        <circle cx="60" cy="43" r="3" fill="#FF6B9D" />

        {/* Blossom 3 */}
        <circle cx="75" cy="25" r="6" fill="#FFB5C2" />
        <circle cx="72" cy="23" r="3" fill="#FFB5C2" />
        <circle cx="78" cy="23" r="3" fill="#FFB5C2" />
        <circle cx="75" cy="20" r="3" fill="#FFB5C2" />
        <circle cx="75" cy="28" r="2" fill="#FF6B9D" />
      </g>
    </svg>
  );
}
