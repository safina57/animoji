import LandingNavbar from "@components/landing/LandingNavbar"
import LandingHero from "@components/landing/LandingHero"
import LandingAbout from "@components/landing/LandingAbout"
import LandingShowcase from "@components/landing/LandingShowcase"
import LandingFooter from "@components/landing/LandingFooter"
import "@components/landing/landing.css"

export default function LandingPage() {
  return (
    <div className="bg-[#0f111a] text-white overflow-x-hidden relative">
      <div className="landing-grain" />
      <LandingNavbar />
      <LandingHero />
      <LandingAbout />
      <LandingShowcase />
      <LandingFooter />
    </div>
  )
}
