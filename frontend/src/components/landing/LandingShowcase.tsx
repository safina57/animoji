import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import CardSwap, { Card } from "@lib/ui/CardSwap/CardSwap"
import SeigaihaOverlay from "@lib/decorations/SeigaihaOverlay/SeigaihaOverlay"
import page1 from "@assets/page/page1.png"
import page2 from "@assets/page/page2.png"
import page3 from "@assets/page/page3.png"

gsap.registerPlugin(ScrollTrigger)

/* ─── Data ─────────────────────────────────────────────────────────────── */

const JP_WORDS = [
  { text: "アニメ", x: "4%", y: "8%", size: "5rem", rotate: "-12deg", opacity: 0.04 },
  { text: "魔法", x: "88%", y: "5%", size: "7rem", rotate: "8deg", opacity: 0.035 },
  { text: "変換", x: "72%", y: "68%", size: "5.5rem", rotate: "-6deg", opacity: 0.04 },
  { text: "美", x: "1%", y: "55%", size: "9rem", rotate: "15deg", opacity: 0.045 },
  { text: "夢", x: "91%", y: "42%", size: "6rem", rotate: "-10deg", opacity: 0.038 },
  { text: "創造", x: "18%", y: "78%", size: "4.5rem", rotate: "5deg", opacity: 0.035 },
  { text: "絵", x: "55%", y: "4%", size: "6.5rem", rotate: "-4deg", opacity: 0.04 },
  { text: "光", x: "82%", y: "82%", size: "8rem", rotate: "12deg", opacity: 0.04 },
  { text: "星", x: "38%", y: "88%", size: "4rem", rotate: "-8deg", opacity: 0.033 },
  { text: "風", x: "6%", y: "30%", size: "5rem", rotate: "20deg", opacity: 0.035 },
]

const GLOW_LINES = [
  { color: "#e63946", width: "72%", delay: "0s" },
  { color: "#4ecdc4", width: "50%", delay: "0.4s" },
  { color: "#d4af37", width: "32%", delay: "0.8s" },
  { color: "#ff6b9d", width: "18%", delay: "1.2s" },
]

const CARDS = [
  { src: page1, label: "Community", url: "animoji.app/community", dot: "#e63946" },
  { src: page2, label: "Create", url: "animoji.app/create", dot: "#4ecdc4" },
  { src: page3, label: "Results", url: "animoji.app/results", dot: "#d4af37" },
]

const TRAFFIC_DOTS = ["#e63946", "#d4af37", "#4ecdc4"]

/* ─── Sub-components ────────────────────────────────────────────────────── */

function ChromeBar({ url, dot }: { url: string; dot: string }) {
  return (
    <div className="sc-chrome-bar">
      <div className="sc-traffic-lights">
        {TRAFFIC_DOTS.map((c) => (
          <div key={c} className="sc-traffic-dot" style={{ background: c }} />
        ))}
      </div>
      <div className="sc-url-pill">
        <div className="sc-url-dot" style={{ background: dot }} />
        <span className="sc-url-text">{url}</span>
      </div>
    </div>
  )
}

/* ─── Main component ────────────────────────────────────────────────────── */

export default function LandingShowcase() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      gsap.from(".sc-text-block", {
        scrollTrigger: { trigger: ".sc-text-block", start: "top 82%" },
        x: -60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      })

      gsap.utils.toArray<HTMLElement>(".sc-jp-word").forEach((el, i) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: "top 90%" },
          y: 20 + i * 5,
          opacity: 0,
          duration: 1.2 + i * 0.08,
          delay: i * 0.07,
          ease: "power2.out",
        })
      })
    },
    { scope: sectionRef }
  )

  return (
    <section id="showcase" ref={sectionRef} className="relative overflow-hidden py-28 md:py-44">
      {/* Seigaiha wave pattern */}
      <SeigaihaOverlay className="absolute opacity-15 pointer-events-none" />

      {/* Radial colour wash */}
      <div className="sc-bg-wash" />

      {/* Scattered Japanese word art */}
      {JP_WORDS.map(({ text, x, y, size, rotate, opacity }, i) => (
        <div
          key={i}
          className="sc-jp-word"
          style={{
            left: x,
            top: y,
            fontSize: size,
            transform: `rotate(${rotate})`,
            color: `rgba(230,57,70,${opacity})`,
          }}
        >
          {text}
        </div>
      ))}

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
        {/* ── Left: headline ── */}
        <div className="sc-text-block">
          <div className="sc-eyebrow">
            <div className="sc-eyebrow-line" />
            <p className="sc-eyebrow-text">体験する</p>
          </div>

          <h2 className="sc-heading">
            See It
            <span className="sc-heading-accent">Come Alive</span>
          </h2>

          <div className="sc-rule" />

          <p className="sc-body">
            From community feeds to real-time AI generation and instant results — every screen is
            crafted to make the magic feel effortless.
          </p>

          {/* Glowing accent lines */}
          <div className="flex flex-col gap-3">
            {GLOW_LINES.map(({ color, width, delay }) => (
              <div
                key={color}
                className="sc-glow-line"
                style={{
                  width,
                  background: `linear-gradient(90deg, ${color}, transparent)`,
                  boxShadow: `0 0 8px ${color}88, 0 0 2px ${color}`,
                  animationDelay: delay,
                }}
              />
            ))}
          </div>

          <div className="sc-footer-accent">
            <div className="sc-footer-rule" />
            <p className="sc-footer-text">魔法の世界へ</p>
          </div>
        </div>

        {/* ── Right: CardSwap ── */}
        <div className="sc-card-col">
          <div className="sc-card-glow" />
          <div className="sc-corner-kanji sc-corner-kanji-1">界</div>
          <div className="sc-corner-kanji sc-corner-kanji-2">夢</div>

          <div className="sc-cardswap-wrap">
            <CardSwap
              width={840}
              height={480}
              cardDistance={42}
              verticalDistance={55}
              delay={3200}
              pauseOnHover={true}
              easing="elastic"
            >
              {CARDS.map(({ src, label, url, dot }) => (
                <Card key={label} className="sc-card">
                  <ChromeBar url={url} dot={dot} />
                  <img src={src} alt={label} className="sc-card-img" draggable={false} />
                </Card>
              ))}
            </CardSwap>
          </div>
        </div>
      </div>

      <div className="sc-bottom-fade" />
    </section>
  )
}
