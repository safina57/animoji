import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@lib/ui/button';
import { cn } from '@lib/utils';
import type { EmojiVariant } from '@customTypes/emoji';

async function downloadVariant(url: string, emotion: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `sticker-${emotion}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, '_blank');
  }
}

interface EmojiVariantCardProps {
  variant?: EmojiVariant; // undefined = skeleton loading state
  index: number;
  isComplete: boolean;
}

export default function EmojiVariantCard({ variant, index, isComplete }: EmojiVariantCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isLoading = !variant;
  const isFailed = variant?.status === 'failed';
  const canDownload = isComplete && !isLoading && !isFailed && !!variant?.variantUrl;

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    if (!variant?.variantUrl) return;
    setDownloading(true);
    await downloadVariant(variant.variantUrl, variant.emotion);
    setDownloading(false);
  }

  return (
    <div
      className="group relative w-full aspect-square rounded-2xl overflow-hidden animate-fade-in"
      style={{ animationDelay: `${index * 0.12}s`, animationFillMode: 'both' }}
    >
      {/* Background for transparent PNGs */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900/80 rounded-2xl" />

      {/* Border ring */}
      <div
        className={cn(
          'absolute inset-0 rounded-2xl border transition-all duration-300 z-10 pointer-events-none',
          isLoading
            ? 'border-primary/10'
            : isFailed
            ? 'border-red-300/30'
            : 'border-primary/10 group-hover:border-primary/25'
        )}
      />

      {/* ── Skeleton loading state ── */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 animate-pulse rounded-2xl" />
          <div className="relative flex flex-col items-center gap-3">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="inline-block w-2 h-2 rounded-full bg-primary/30 dark:bg-primary/20 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-[10px] font-japanese text-slate-400 dark:text-slate-500 tracking-widest">
              生成中...
            </p>
          </div>
        </div>
      )}

      {/* ── Failed state ── */}
      {isFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-red-50/50 dark:bg-red-900/10 rounded-2xl">
          <span className="material-symbols-outlined text-4xl text-red-400">error_outline</span>
          <p className="text-xs text-red-400 font-medium">Generation failed</p>
        </div>
      )}

      {/* ── Completed image ── */}
      {!isLoading && !isFailed && (
        <>
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          )}
          <img
            src={variant!.variantUrl}
            alt={`${variant!.emotion} sticker`}
            className={cn(
              'absolute inset-0 w-full h-full object-contain transition-opacity duration-500',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Gradient scrim on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

          {/* Download button — hover only, bottom-right */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-300 z-20">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              disabled={!canDownload || downloading}
              className="rounded-full backdrop-blur-sm shadow-lg h-8 w-auto px-3 gap-1.5 bg-white/90 dark:bg-paper-dark/90 text-primary border border-primary/10 hover:bg-primary hover:text-white hover:border-transparent active:scale-95 transition-all text-xs font-medium"
              aria-label={`Download ${variant?.emotion ?? ''} sticker`}
            >
              <Download className="h-3.5 w-3.5" />
              {downloading ? 'Saving...' : 'Download'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
