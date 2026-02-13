export interface PetalProps {
  delay: string;
  left: string;
  size: "small" | "medium" | "large";
  duration: string;
}

export default function SakuraPetal({
  delay,
  left,
  size,
  duration,
}: PetalProps) {
  const sizeClasses = {
    small: "w-2 h-2",
    medium: "w-3 h-3",
    large: "w-4 h-4",
  };

  return (
    <div
      className={`absolute -top-10 animate-fall ${sizeClasses[size]}`}
      style={{
        left,
        animationDelay: delay,
        animationDuration: duration,
      }}
    >
      <svg
        viewBox="0 0 100 130"
        className="w-full h-full fill-[var(--color-sakura-pink)] drop-shadow-sm"
      >
        <path d="M50 0 C60 30 100 50 100 80 C100 110 80 130 50 130 C20 130 0 110 0 80 C0 50 40 30 50 0 Z" />
      </svg>
    </div>
  );
}
