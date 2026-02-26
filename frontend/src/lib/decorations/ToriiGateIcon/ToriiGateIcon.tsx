interface ToriiGateIconProps {
  className?: string
}

export default function ToriiGateIcon({ className }: ToriiGateIconProps) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="5" y="18" width="110" height="8" rx="4" fill="currentColor" />
      <rect x="15" y="28" width="90" height="6" rx="3" fill="currentColor" />
      <rect x="20" y="34" width="8" height="62" rx="4" fill="currentColor" />
      <rect x="92" y="34" width="8" height="62" rx="4" fill="currentColor" />
      <rect x="10" y="12" width="14" height="8" rx="3" fill="currentColor" />
      <rect x="96" y="12" width="14" height="8" rx="3" fill="currentColor" />
    </svg>
  )
}
