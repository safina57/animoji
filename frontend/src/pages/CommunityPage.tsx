import { useState } from "react";

// Mock data for demo - in production, fetch from API
const MOCK_IMAGES = [
  {
    id: "1",
    generatedUrl: "https://picsum.photos/seed/anime1/400/600",
    prompt: "Cyberpunk Tokyo street with neon signs",
    username: "tokyodreamer",
    likes: 342,
  },
  {
    id: "2",
    generatedUrl: "https://picsum.photos/seed/anime2/400/300",
    prompt: "Studio Ghibli style forest scene",
    username: "ghiblifan",
    likes: 521,
  },
  {
    id: "3",
    generatedUrl: "https://picsum.photos/seed/anime3/400/500",
    prompt: "90s retro anime character portrait",
    username: "retrowave",
    likes: 234,
  },
  {
    id: "4",
    generatedUrl: "https://picsum.photos/seed/anime4/400/400",
    prompt: "Cherry blossom shrine at sunset",
    username: "sakura_art",
    likes: 678,
  },
  {
    id: "5",
    generatedUrl: "https://picsum.photos/seed/anime5/400/550",
    prompt: "Futuristic mecha in action pose",
    username: "mecha_master",
    likes: 892,
  },
  {
    id: "6",
    generatedUrl: "https://picsum.photos/seed/anime6/400/350",
    prompt: "Cozy anime cafe interior",
    username: "cafe_vibes",
    likes: 445,
  },
  {
    id: "7",
    generatedUrl: "https://picsum.photos/seed/anime7/400/650",
    prompt: "Mountain village anime landscape",
    username: "landscape_pro",
    likes: 567,
  },
  {
    id: "8",
    generatedUrl: "https://picsum.photos/seed/anime8/400/400",
    prompt: "Magical girl transformation scene",
    username: "magical_art",
    likes: 723,
  },
];

export default function CommunityPage() {
  const [images] = useState(MOCK_IMAGES);

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark overflow-y-auto">
      {/* Header with Japan theme */}
      <div className="relative bg-gradient-to-r from-primary/10 via-fuji-blue/10 to-sakura-pink/10 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="text-center space-y-4">
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
        </div>

        {/* Decorative torii gate silhouette */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block opacity-10 pointer-events-none">
          <div className="w-24 h-24 border-4 border-primary rounded-lg" />
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {images.map((item, index) => (
            <div
              key={item.id}
              className="break-inside-avoid group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image */}
              <div className="relative overflow-hidden">
                <img
                  src={item.generatedUrl}
                  alt={item.prompt}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <p className="text-white text-sm font-medium line-clamp-2 mb-2">
                    {item.prompt}
                  </p>
                  <div className="flex items-center justify-between text-white/80 text-xs">
                    <span>@{item.username}</span>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        favorite
                      </span>
                      <span>{item.likes}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom info bar */}
              <div className="p-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-xs">
                        person
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      @{item.username}
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">
                      favorite_border
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load more placeholder */}
        <div className="text-center mt-12 mb-8">
          <button className="px-8 py-3 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all font-medium">
            Load More Creations
          </button>
        </div>
      </div>
    </div>
  );
}

