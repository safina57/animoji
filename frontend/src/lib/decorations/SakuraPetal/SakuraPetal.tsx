import SakuraPetalIcon from "@assets/icons/sakura-petal.svg?react"

export interface PetalProps {
  delay: string
  left: string
  size: "small" | "medium" | "large"
  duration: string
}

export default function SakuraPetal({ delay, left, size, duration }: PetalProps) {
  const sizeClasses = {
    small: "w-2 h-2",
    medium: "w-3 h-3",
    large: "w-4 h-4",
  }

  return (
    <div
      className={`absolute -top-10 animate-fall ${sizeClasses[size]}`}
      style={{
        left,
        animationDelay: delay,
        animationDuration: duration,
      }}
    >
      <SakuraPetalIcon className="w-full h-full fill-[var(--color-sakura-pink)] drop-shadow-sm" />
    </div>
  )
}
