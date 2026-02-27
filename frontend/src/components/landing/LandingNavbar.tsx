import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import catLottieUrl from "@assets/8-bit Cat.lottie?url"

gsap.registerPlugin()

const NAV_LINKS = [
  { href: "#hero",     label: "Home"     },
  { href: "#about",    label: "About"    },
  { href: "#showcase", label: "Features" },
  { href: "#contact",  label: "Contact"  },
]

export default function LandingNavbar() {
  const navRef = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

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
      className={`landing-nav fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 transition-all duration-300 ${scrolled ? "landing-nav-scrolled" : ""}`}
    >
      {/* Logo */}
      <Link to="/" className="nav-logo flex items-center gap-2">
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

      {/* Cat sign-in button */}
      <Link to="/auth" className="nav-cat-btn hidden md:flex" aria-label="Sign In">
        <DotLottieReact
          src={catLottieUrl}
          autoplay
          loop
          style={{ width: 56, height: 56 }}
        />
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
