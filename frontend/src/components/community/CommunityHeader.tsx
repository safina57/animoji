import ToriiGateIcon from "@lib/decorations/ToriiGateIcon/ToriiGateIcon"

export default function CommunityHeader() {
  return (
    <div className="relative bg-gradient-to-r from-primary/10 via-fuji-blue/10 to-sakura-pink/10 border-b border-primary/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white">
          Community Gallery
        </h1>
        <p className="text-sm md:text-base text-primary/60 dark:text-primary/40 font-japanese uppercase tracking-[0.4em] font-medium">
          コミュニティギャラリー
        </p>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Explore stunning anime transformations created by our community
        </p>
      </div>

      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block opacity-10 pointer-events-none text-primary">
        <ToriiGateIcon className="w-24 h-24" />
      </div>
    </div>
  )
}
