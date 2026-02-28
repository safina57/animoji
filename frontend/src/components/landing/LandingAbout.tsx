import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import SeigaihaOverlay from "@lib/decorations/SeigaihaOverlay/SeigaihaOverlay"
import ToriiGateSilhouette from "@lib/decorations/ToriiGateSilhouette/ToriiGateSilhouette"
import LandingAboutAnime from "@components/landing/LandingAboutAnime"
import LandingAboutEmoji from "@components/landing/LandingAboutEmoji"

gsap.registerPlugin(ScrollTrigger)

export default function LandingAbout() {
  const sectionRef = useRef<HTMLElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=100%",
          scrub: 1.4,
          pin: true,
          onUpdate: (self) => {
            /* Drive the progress bar */
            if (progressRef.current) {
              progressRef.current.style.transform = `scaleX(${self.progress})`
            }
          },
        },
      })

      /* Anime panel fades up and out */
      tl.to(".about-panel-anime", { opacity: 0, y: -36, ease: "none", duration: 0.45 }, 0.25)

      /* Emoji panel fades up into view */
      tl.fromTo(
        ".about-panel-emoji",
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, ease: "none", duration: 0.45 },
        0.3
      )

      /* Vertical text crossfade: anime text → emoji text */
      tl.to(".about-vertical-anime", { opacity: 0, duration: 0.35 }, 0.2)
      tl.fromTo(".about-vertical-emoji", { opacity: 0 }, { opacity: 0.2, duration: 0.35 }, 0.45)
    },
    { scope: sectionRef }
  )

  return (
    <section id="about" ref={sectionRef} className="about-section">
      <div className="divider-rule-l" />
      {/* ── Seigaiha wave pattern ── */}
      <SeigaihaOverlay className="absolute opacity-15 pointer-events-none" />

      {/* ── Torii gate silhouette ── */}
      <div className="about-torii-bg">
        <ToriiGateSilhouette />
      </div>

      {/* ── Vertical Japanese text — anime panel ── */}
      <div className="about-vertical-text about-vertical-anime hidden xl:block">
        <p className="about-vertical-p">アニメスタイル</p>
      </div>

      {/* ── Vertical Japanese text — emoji panel (starts hidden) ── */}
      <div
        className="about-vertical-text about-vertical-emoji hidden xl:block"
        style={{ opacity: 0 }}
      >
        <p className="about-vertical-p" style={{ color: "rgba(212,175,55,0.2)" }}>
          絵文字生成
        </p>
      </div>

      {/* ── Panels ── */}
      <div className="about-panels-wrap">
        <LandingAboutAnime />
        <LandingAboutEmoji />
      </div>

      {/* ── Scroll progress indicator ── */}
      <div className="about-progress">
        <span className="about-progress-label">Scroll to explore</span>
        <div className="about-progress-track">
          <div ref={progressRef} className="about-progress-fill" />
        </div>
      </div>
    </section>
  )
}
