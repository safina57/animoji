import { useRef } from "react"
import { Link } from "react-router-dom"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import CircularGallery from "@lib/ui/CircularGallery/CircularGallery"

const animeGlob = import.meta.glob("/src/assets/anime/*.png", { eager: true })
const ANIME_ITEMS = Object.values(animeGlob).map((mod) => ({
  image: (mod as { default: string }).default,
  text: "",
}))

export default function LandingAboutAnime() {
  const panelRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.from(".about-anime-text > *", {
        scrollTrigger: {
          trigger: panelRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        y: 28,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power2.out",
      })
    },
    { scope: panelRef }
  )

  return (
    <div ref={panelRef} className="about-panel about-panel-anime">
      {/* ── Text block ── */}
      <div className="about-text-col about-anime-text">
        <span className="about-tag">01 — Image Generation</span>
        <div className="about-rule" />
        <h2 className="about-heading">
          Your face,
          <em>anime-fied</em>
        </h2>
        <p className="about-body">
          Upload any portrait and watch our AI reimagine it through the lens of
          Japanese animation. From Studio Ghibli softness to shonen intensity
          every transformation is entirely one-of-a-kind
        </p>
        <div className="about-stats">
          <div className="about-stat">
            <span className="about-stat-num">10+</span>
            <span className="about-stat-label">Anime Styles</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-num">&lt;30s</span>
            <span className="about-stat-label">Generation</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-num">HD</span>
            <span className="about-stat-label">Output Quality</span>
          </div>
        </div>
        <Link to="/create" className="about-cta-link">
          <span>Transform Now</span>
          <svg viewBox="0 0 20 20" fill="none" className="about-cta-arrow">
            <path
              d="M4 10h12M11 5l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>

      {/* ── Gallery block ── */}
      <div className="about-gallery-col">
        <CircularGallery
          items={ANIME_ITEMS}
          bend={1}
          textColor="#ffffff"
          borderRadius={0.05}
          scrollSpeed={2}
          scrollEase={0.05}
          autoPlay={true}
          autoPlaySpeed={1}
        />
      </div>
    </div>
  )
}
