import { CSSProperties, ReactNode, MouseEvent } from "react"

export interface CardProps {
  customClass?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
}

export declare const Card: React.ForwardRefExoticComponent<
  CardProps & React.RefAttributes<HTMLDivElement>
>

export interface CardSwapProps {
  width?: number
  height?: number
  cardDistance?: number
  verticalDistance?: number
  delay?: number
  pauseOnHover?: boolean
  onCardClick?: (index: number) => void
  skewAmount?: number
  easing?: "elastic" | "power1"
  children?: ReactNode
}

declare const CardSwap: React.FC<CardSwapProps>
export default CardSwap
