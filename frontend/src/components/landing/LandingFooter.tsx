import { useRef } from "react"
import { Link } from "react-router-dom"
import { Github, Linkedin } from "lucide-react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import SeigaihaOverlay from "@lib/decorations/SeigaihaOverlay/SeigaihaOverlay"

gsap.registerPlugin(ScrollTrigger)

const NAV_LINKS = [
  { to: "/community", label: "Community" },
  { to: "/create", label: "Create" },
  { to: "/auth", label: "Sign In" },
]

const SOCIAL = [
  { label: "GitHub", href: "https://github.com/safina57", Icon: Github },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/mohamed-amin-haouas/", Icon: Linkedin },
]

export default function LandingFooter() {
  const footerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      gsap.from(".footer-content", {
        scrollTrigger: { trigger: footerRef.current, start: "top 88%" },
        y: 35,
        opacity: 0,
        duration: 0.9,
        ease: "power2.out",
      })
      gsap.from(".footer-banner-text", {
        scrollTrigger: { trigger: ".footer-banner-wrap", start: "top 92%" },
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
      })
    },
    { scope: footerRef }
  )

  return (
    <footer id="contact" ref={footerRef} className="landing-footer">
      {/* Seigaiha background pattern */}
      <SeigaihaOverlay className="absolute opacity-80 pointer-events-none" />

      {/* Main content */}
      <div className="footer-content">
        {/* Made with love */}
        <p className="footer-made-with">
          Made with <span className="footer-heart">&hearts;</span> and a lot of anime
        </p>
        <p className="footer-made-jp">愛を込めて作りました</p>

        {/* Social buttons */}
        <div className="footer-social-row">
          {SOCIAL.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label={label}
            >
              <Icon className="footer-social-icon" />
              <span className="footer-social-label">{label}</span>
            </a>
          ))}
        </div>

        {/* Divider */}
        <div className="footer-divider" />

        {/* Nav links */}
        <nav className="footer-nav">
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} className="footer-nav-link">
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Giant ANIMOJI banner */}
      <div className="footer-banner-wrap" aria-hidden>
        <h2 className="footer-banner-text">ANIMOJI</h2>
        <div className="footer-banner-fade" />
      </div>
    </footer>
  )
}
