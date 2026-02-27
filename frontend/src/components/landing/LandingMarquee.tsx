import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const MARQUEE_TOP =
  "ANIMOJI \u2022 TRANSFORM \u2022 \u30A2\u30CB\u30E1\u5316 \u2022 CREATE \u2022 \u5909\u63DB \u2022 ANIME \u2022 AI MAGIC \u2022 "
const MARQUEE_BTM =
  "\u5199\u771F \u2022 PHOTOS \u2022 \u9B54\u6CD5 \u2022 GENERATE \u2022 SHARE \u2022 \u30B3\u30DF\u30E5\u30CB\u30C6\u30A3 \u2022 GALLERY \u2022 "

interface LandingMarqueeProps {
  /** Skip the scroll-triggered reveal — use when embedded inside another section (e.g. hero) */
  disableScrollReveal?: boolean
  /** Override the section's background/border classes */
  className?: string
}

export default function LandingMarquee({
  disableScrollReveal = false,
  className,
}: LandingMarqueeProps) {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (disableScrollReveal) return
      gsap.from(sectionRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 90%",
          end: "top 60%",
          scrub: 1,
        },
        opacity: 0,
        y: 40,
      })
    },
    { scope: sectionRef }
  )

  const sectionClass = ["marquee-section py-5", className ?? "bg-[#0f111a]"].join(" ")

  return (
    <section ref={sectionRef} className={sectionClass}>
      {/* Row 1 — scrolls left */}
      <div className="marquee-left overflow-hidden py-2.5">
        <div className="marquee-track">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className="marquee-item marquee-text-red font-display text-xl md:text-2xl tracking-wider"
            >
              {MARQUEE_TOP}
            </span>
          ))}
        </div>
      </div>

      {/* Row 2 — scrolls right */}
      <div className="marquee-right overflow-hidden py-2.5">
        <div className="marquee-track">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className="marquee-item marquee-text-sakura font-japanese text-xl md:text-2xl tracking-wider"
            >
              {MARQUEE_BTM}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
