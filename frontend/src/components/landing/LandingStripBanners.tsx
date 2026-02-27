import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const BANNERS = [
  {
    cls: "strip-banner-1",
    text: "Your Photo. Reimagined.",
    style: {
      background: "#e63946",
      transform: "rotate(-1.5deg)",
      color: "#fff",
    },
    from: -110,
  },
  {
    cls: "strip-banner-2",
    text: "AI-Powered Transformation.",
    style: {
      background: "linear-gradient(135deg, #1a1d29 0%, #2b3a67 100%)",
      border: "1px solid rgba(230,57,70,0.25)",
      transform: "rotate(1.2deg)",
      color: "#ffb5c2",
    },
    from: 110,
  },
  {
    cls: "strip-banner-3",
    text: "Share With The World.",
    style: {
      background: "rgba(212,175,55,0.12)",
      border: "1px solid rgba(212,175,55,0.2)",
      transform: "rotate(-0.8deg)",
      color: "#d4af37",
    },
    from: -110,
  },
]

export default function LandingStripBanners() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=250%",
          pin: true,
          scrub: 1,
        },
      })

      BANNERS.forEach(({ cls, from }, i) => {
        tl.from(
          `.${cls}`,
          { xPercent: from, duration: 1, ease: "power2.out" },
          i === 0 ? 0 : "+=0.15"
        )
      })
    },
    { scope: sectionRef }
  )

  return (
    <section
      ref={sectionRef}
      className="strip-section min-h-screen flex flex-col items-center justify-center gap-5 md:gap-8 py-20 overflow-hidden"
    >
      <div className="w-full space-y-4 md:space-y-7">
        {BANNERS.map(({ cls, text, style }) => (
          <div key={cls} className={`strip-banner ${cls} py-5 md:py-7 px-8`} style={style}>
            <p
              className="relative z-10 font-display font-bold tracking-tight w-full text-center"
              style={{ fontSize: "clamp(2rem, 5vw, 5.5rem)", color: "inherit" }}
            >
              {text}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
