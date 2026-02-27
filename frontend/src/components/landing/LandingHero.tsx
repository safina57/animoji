import { useRef } from "react"
import { Link } from "react-router-dom"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import CherryBlossomFlower from "@lib/decorations/CherryBlossomFlower/CherryBlossomFlower"
import FallingPetals from "@lib/decorations/FallingPetals/FallingPetals"
import LandingMarquee from "@components/landing/LandingMarquee"

gsap.registerPlugin(ScrollTrigger)

const LETTERS = "Animoji".split("")

export default function LandingHero() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({ delay: 0.3 })

      /* Title letter clip-reveal */
      tl.from(".hl-inner", {
        y: "115%",
        rotateX: -90,
        opacity: 0,
        stagger: 0.065,
        duration: 1,
        ease: "back.out(1.6)",
      })

      /* Blossom blooms in as the "i" dot */
      tl.from(
        ".hero-blossom-wrap",
        {
          scale: 0,
          opacity: 0,
          rotation: -40,
          transformOrigin: "50% 100%",
          duration: 0.8,
          ease: "back.out(2.2)",
        },
        "-=0.4"
      )

      /* Continuous slow spin */
      gsap.to(".hero-blossom-wrap", {
        rotation: 360,
        duration: 18,
        repeat: -1,
        ease: "none",
        transformOrigin: "50% 50%",
      })

      /* Subtle floating bob */
      gsap.to(".hero-blossom-wrap", {
        y: -4,
        duration: 2.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      })

      /* Slash line */
      tl.from(".hero-slash", { scaleX: 0, duration: 0.7, ease: "power3.out" }, "-=0.5")

      /* English slogan */
      tl.from(".hero-slogan", { y: 22, opacity: 0, duration: 0.65, ease: "power2.out" }, "-=0.3")

      /* Japanese subtitle */
      tl.from(".hero-jp", { y: 30, opacity: 0, duration: 0.7, ease: "power2.out" }, "-=0.3")

      /* CTA pill */
      tl.from(".hero-cta", { y: 20, opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.2")

      /* Background photo dissolves into page colour on scroll */
      gsap.to(".hero-bg-photo", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "55% top",
          scrub: 2,
        },
        opacity: 0,
      })
    },
    { scope: sectionRef }
  )

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative min-h-screen flex flex-col overflow-hidden"
    >
      {/* ── Background photo + inner overlays ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="hero-bg-photo" />
        <div className="hero-bg-overlays" />
      </div>

      {/* ── Ambient colour washes + bottom seam ── */}
      <div className="hero-overlays" />

      {/* ── Falling petals ── */}
      <FallingPetals count={18} />

      {/* ── Title block — grows to fill the viewport, centers content ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center pt-12">
        {/* "Anim·oji" — first "i" is dotless, cherry blossom is the dot */}
        <div className="hero-title">
          {LETTERS.map((letter, i) => {
            const isFirstI = i === 2
            const displayChar = isFirstI ? "ı" : letter
            return (
              <span key={i} className={`hl${isFirstI ? " relative" : ""}`}>
                {isFirstI && (
                  <span className="hero-blossom-wrap">
                    <CherryBlossomFlower className="!w-full !h-full" />
                  </span>
                )}
                <span className="hl-clip">
                  <span className="hl-inner">{displayChar}</span>
                </span>
              </span>
            )
          })}
        </div>

        {/* Red slash accent */}
        <div className="hero-slash" />

        {/* English slogan */}
        <p className="hero-slogan mt-5">See yourself in anime</p>

        {/* Japanese label */}
        <p className="hero-jp mt-3 !text-white">写真をアニメに変換する</p>

        {/* CTA — corner-bracket editorial buttons */}
        <div className="hero-cta mt-12 flex items-center justify-center gap-12 pt-10">
          <Link to="/create" className="hero-btn hero-btn-primary">
            <span>Start Creating</span>
          </Link>
          <Link to="/" className="hero-btn hero-btn-ghost">
            <span>Gallery</span>
          </Link>
        </div>
      </div>

      {/* ── Marquee sits at the natural bottom of the hero ── */}
      <LandingMarquee disableScrollReveal className="bg-transparent" />
    </section>
  )
}
