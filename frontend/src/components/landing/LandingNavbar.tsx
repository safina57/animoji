import { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

gsap.registerPlugin()

const NAV_LINKS = [
  { href: "#hero", label: "Home" },
  { href: "#showcase", label: "Features" },
  { href: "#contact", label: "Contact" },
]

export default function LandingNavbar() {
  const navRef = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  /* Entrance animation */
  useGSAP(
    () => {
      gsap.from(".nav-logo", {
        y: -20,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        delay: 1.4,
      })
      gsap.from(".nav-link", {
        y: -16,
        opacity: 0,
        stagger: 0.08,
        duration: 0.5,
        ease: "power2.out",
        delay: 1.5,
      })
      gsap.from(".nav-cta", {
        y: -16,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        delay: 1.8,
      })
    },
    { scope: navRef }
  )

  return (
    <nav
      ref={navRef}
      className="landing-nav fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5"
    >
      {/* Logo */}
      <Link to="/landing" className="nav-logo flex items-center gap-2">
        <span className="nav-logo-text">Animoji</span>
        <span className="nav-logo-ja hidden sm:block">アニメ化</span>
      </Link>

      {/* Desktop links */}
      <ul className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map(({ href, label }) => (
          <li key={href}>
            <a href={href} className="nav-link relative group">
              {label}
              <span className="nav-link-line" />
            </a>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link to="/auth" className="nav-cta hidden md:inline-flex">
        Sign In
        <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="currentColor">
          <path d="M1 7h12M8 3l5 4-5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </Link>

      {/* Mobile hamburger */}
      <button
        className="md:hidden flex flex-col gap-1.5 p-1"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        <span className={`w-6 h-px bg-white/60 transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
        <span className={`w-6 h-px bg-white/60 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
        <span className={`w-6 h-px bg-white/60 transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
      </button>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="nav-drawer md:hidden">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="nav-drawer-link"
            >
              {label}
            </a>
          ))}
          <Link
            to="/auth"
            onClick={() => setMenuOpen(false)}
            className="nav-drawer-cta"
          >
            Sign In
          </Link>
        </div>
      )}
    </nav>
  )
}
