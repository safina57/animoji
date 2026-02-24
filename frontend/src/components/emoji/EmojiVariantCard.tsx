import { useState } from 'react';
import { Download, Link, Check, Upload } from 'lucide-react';
import { Button } from '@lib/ui/button';
import { cn } from '@lib/utils';
import ToriiGateLoader from '@lib/decorations/ToriiGateLoader/ToriiGateLoader';
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
  variant?: EmojiVariant;
  index: number;
  isComplete: boolean;
  onPublish?: () => Promise<void>;
}

export default function EmojiVariantCard({ variant, index, isComplete, onPublish }: EmojiVariantCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isLoading = !variant;
  const isFailed = variant?.status === 'failed';
  const canDownload = isComplete && !isLoading && !isFailed && !!variant?.variantUrl;
  const publishedUrl = variant?.publishedUrl;
  const isPublished = !!publishedUrl;

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    if (!variant?.variantUrl) return;
    setDownloading(true);
    await downloadVariant(variant.variantUrl, variant.emotion);
    setDownloading(false);
  }

  async function handlePublish(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onPublish || publishing) return;
    setPublishing(true);
    try {
      await onPublish();
      // On success, variant.publishedUrl will be set by Redux → isPublished becomes true
    } finally {
      setPublishing(false);
    }
  }

  async function handleCopyLink(e: React.MouseEvent) {
    e.stopPropagation();
    if (!publishedUrl) return;
    try {
      await navigator.clipboard.writeText(publishedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.open(publishedUrl, '_blank');
    }
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
            : isPublished
            ? 'border-primary/30 group-hover:border-primary/50'
            : 'border-primary/10 group-hover:border-primary/25'
        )}
      />

      {/* Published indicator badge */}
      {isPublished && (
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-primary/90 text-white text-[10px] font-semibold rounded-full px-2 py-0.5 backdrop-blur-sm">
          <Check className="h-2.5 w-2.5" />
          Published
        </div>
      )}

      {/* Skeleton loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900/80 rounded-2xl" />
          <ToriiGateLoader className="w-14 h-14" glowClassName="blur-2xl opacity-15" />
          <p className="relative text-[10px] font-japanese text-slate-400 dark:text-slate-500 tracking-widest">
            生成中...
          </p>
        </div>
      )}

      {/* Failed state */}
      {isFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-red-50/50 dark:bg-red-900/10 rounded-2xl">
          <span className="material-symbols-outlined text-4xl text-red-400">error_outline</span>
          <p className="text-xs text-red-400 font-medium">Generation failed</p>
        </div>
      )}

      {/* Completed image */}
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

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

          {/* Action buttons — revealed on hover */}
          <div className="absolute bottom-3 inset-x-3 flex gap-1.5 justify-end opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-300 z-20">

            {/* Publish → Copy Link toggle */}
            {isPublished ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="flex-1 rounded-full backdrop-blur-sm shadow-lg h-8 px-3 gap-1.5 bg-primary/90 text-white border-0 hover:bg-primary active:scale-95 transition-all text-xs font-medium"
                aria-label={`Copy link for ${variant?.emotion ?? ''} sticker`}
              >
                {copied ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Link className="h-3.5 w-3.5 shrink-0" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePublish}
                disabled={!isComplete || publishing || !onPublish}
                className="flex-1 rounded-full backdrop-blur-sm shadow-lg h-8 px-3 gap-1.5 bg-white/90 dark:bg-paper-dark/90 text-primary border border-primary/10 hover:bg-primary hover:text-white hover:border-transparent disabled:opacity-60 active:scale-95 transition-all text-xs font-medium"
                aria-label={`Publish ${variant?.emotion ?? ''} sticker`}
              >
                {publishing ? (
                  <>
                    <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5 shrink-0" />
                    Publish
                  </>
                )}
              </Button>
            )}

            {/* Download */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              disabled={!canDownload || downloading}
              className="rounded-full backdrop-blur-sm shadow-lg h-8 w-8 p-0 bg-white/90 dark:bg-paper-dark/90 text-primary border border-primary/10 hover:bg-primary hover:text-white hover:border-transparent active:scale-95 transition-all"
              aria-label={`Download ${variant?.emotion ?? ''} sticker`}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
