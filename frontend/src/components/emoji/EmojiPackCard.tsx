import { memo, useState } from 'react';
import { cn } from '@lib/utils';
import type { EmojiPackGalleryItem } from '@customTypes/emoji';

interface EmojiPackCardProps {
  pack: EmojiPackGalleryItem;
  onClick: () => void;
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

const EmojiPackCard = memo(function EmojiPackCard({ pack, onClick }: EmojiPackCardProps) {
  const previews = pack.variants.slice(0, 4);
  const emptySlots = Math.max(0, 4 - previews.length);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 bg-white dark:bg-slate-800/80"
    >
      {/* 2×2 preview grid */}
      <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-700/40">
        {previews.map((v) => (
          <EmojiCell key={v.id} url={v.url} emotion={v.emotion} />
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="aspect-square bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-xl text-slate-300 dark:text-slate-600">
              add
            </span>
          </div>
        ))}
      </div>

      {/* Footer strip */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-primary/60">
            emoji_emotions
          </span>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {pack.variants.length} sticker{pack.variants.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tabular-nums shrink-0">
          {formatRelativeDate(pack.created_at)}
        </span>
      </div>
    </div>
  );
});

function EmojiCell({ url, emotion }: { url: string; emotion: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="aspect-square bg-white dark:bg-slate-800/80 flex items-center justify-center overflow-hidden relative">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-slate-100 dark:bg-slate-700/50" />
      )}
      <img
        src={url}
        alt={emotion}
        className={cn(
          'w-4/5 h-4/5 object-contain transition-all duration-300 group-hover:scale-110',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

export default EmojiPackCard;
