import { Link } from "react-router-dom"
import CircularGallery from "@lib/ui/CircularGallery/CircularGallery"

const emojiGlob = import.meta.glob("/src/assets/emoji/*.png", { eager: true })
const EMOJI_ITEMS = Object.values(emojiGlob).map((mod) => ({
  image: (mod as { default: string }).default,
  text: "",
}))

export default function LandingAboutEmoji() {
  return (
    <div className="about-panel about-panel-emoji">
      {/* ── Gallery block (left) ── */}
      <div className="about-gallery-col">
        <CircularGallery
          items={EMOJI_ITEMS}
          bend={-1}
          textColor="#ffffff"
          borderRadius={0.05}
          scrollSpeed={2}
          scrollEase={0.05}
          autoPlay={true}
          autoPlaySpeed={-1}
        />
      </div>

      {/* ── Text block (right) ── */}
      <div className="about-text-col about-text-col-right">
        <span className="about-tag about-tag-rose">02 — Emoji Generation</span>
        <div className="about-rule about-rule-rose" />
        <h2 className="about-heading about-heading-rose">
          Emotions,
          <em>In one click</em>
        </h2>
        <p className="about-body">
          Generate a full set of expressive sticker emojis from a single portrait.
          Distinct emotions rendered as transparent stickers — instantly
          ready to drop anywhere you chat
        </p>
        <div className="about-stats">
          <div className="about-stat">
            <span className="about-stat-num">3</span>
            <span className="about-stat-label">Emotions Per Set</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-num">PNG</span>
            <span className="about-stat-label">Transparent BG</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-num">512px</span>
            <span className="about-stat-label">Sticker Size</span>
          </div>
        </div>
        <Link to="/create" className="about-cta-link about-cta-link-rose">
          <span>Create Stickers</span>
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
    </div>
  )
}
