import ToriiGateIcon from "@lib/decorations/ToriiGateIcon/ToriiGateIcon"

interface GalleryHeaderProps {
  userName?: string
}

export default function GalleryHeader({ userName }: GalleryHeaderProps) {
  return (
    <div className="relative bg-gradient-to-r from-primary/10 via-fuji-blue/10 to-sakura-pink/10 border-b border-primary/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">
        <div className="space-y-1">
          <p className="text-xs text-primary/60 dark:text-primary/40 font-japanese uppercase tracking-[0.4em] font-medium">
            マイギャラリー
          </p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white">
            My Gallery
          </h1>
          {userName && (
            <p className="text-slate-600 dark:text-slate-400 pt-1">
              Your anime creations, <span className="text-primary font-medium">{userName}</span>
            </p>
          )}
        </div>
      </div>

      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block opacity-10 pointer-events-none text-primary">
        <ToriiGateIcon className="w-24 h-24" />
      </div>
    </div>
  )
}
