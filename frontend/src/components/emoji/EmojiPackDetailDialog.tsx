import { useState } from 'react';
import { Check, Link, Download, X } from 'lucide-react';
import { Dialog, DialogContent } from '@lib/ui/dialog';
import { Button } from '@lib/ui/button';
import { cn } from '@lib/utils';
import type { EmojiPackGalleryItem, EmojiVariantGalleryItem } from '@customTypes/emoji';

interface EmojiPackDetailDialogProps {
  pack: EmojiPackGalleryItem | null;
  open: boolean;
  onClose: () => void;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

async function downloadVariant(url: string, emotion: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
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

export function EmojiPackDetailDialog({ pack, open, onClose }: EmojiPackDetailDialogProps) {
  if (!pack) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-slate-200/60 dark:border-slate-700/60">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-display font-bold text-slate-900 dark:text-white">
              Sticker Pack
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-japanese">
              スタンプパック · {formatDate(pack.created_at)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Variants grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {pack.variants.map((variant) => (
              <VariantItem key={variant.id} variant={variant} />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VariantItem({ variant }: { variant: EmojiVariantGalleryItem }) {
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(variant.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.open(variant.url, '_blank');
    }
  }

  async function handleDownload() {
    setDownloading(true);
    await downloadVariant(variant.url, variant.emotion);
    setDownloading(false);
  }

  return (
    <div className="group flex flex-col items-center gap-2">
      {/* Image container */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900/80 border border-slate-100 dark:border-slate-700/40">
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-slate-100 dark:bg-slate-700/50 rounded-xl" />
        )}
        <img
          src={variant.url}
          alt={`${variant.emotion} sticker`}
          className={cn(
            'absolute inset-0 w-full h-full object-contain p-3 transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setLoaded(true)}
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={handleCopy}
            className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:bg-primary hover:text-white transition-colors"
            aria-label={`Copy link for ${variant.emotion}`}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-primary group-hover:text-white" /> : <Link className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:bg-primary hover:text-white transition-colors disabled:opacity-60"
            aria-label={`Download ${variant.emotion} sticker`}
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Label + copy */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {capitalize(variant.emotion)}
        </span>
        {copied && (
          <span className="text-[10px] text-primary font-semibold animate-fade-in">Copied!</span>
        )}
      </div>
    </div>
  );
}
