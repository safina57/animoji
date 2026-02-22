import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
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
  const toriiPathRef = useRef<SVGPathElement>(null);
  const toriiGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading) return;
    const pathEl = toriiPathRef.current;
    if (!pathEl) return;
    const pathLength = pathEl.getTotalLength();
    const ctx = gsap.context(() => {
      gsap.set(pathEl, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
      gsap.timeline({ repeat: -1, repeatDelay: 0.6 })
        .to(pathEl, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut' })
        .to(pathEl, { strokeDashoffset: -pathLength, duration: 1.6, ease: 'power2.in', delay: 0.8 });
      gsap.to(toriiGlowRef.current, {
        opacity: 0.5, scale: 1.2, duration: 2, yoyo: true, repeat: -1, ease: 'sine.inOut',
      });
    });
    return () => ctx.revert();
  }, [isLoading]);
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900/80 rounded-2xl" />
          {/* Torii gate — same animation as LoadingDialog, smaller size */}
          <div className="relative w-14 h-14">
            <svg viewBox="0 0 511.999 511.999" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <path
                ref={toriiPathRef}
                className="torii-path"
                d="M486.203,30.815c-29.313,10.366-118.518,41.91-230.204,41.91S55.11,41.181,25.796,30.815L0,21.694l20.842,121.92
                l8.888,3.144c24.586,8.694,63.632,15.025,113.844,18.682v42.577c-50.544-4.079-79.679-10.691-96.364-16.592l-10.709,30.282
                c5.313,1.879,11.144,3.638,17.479,5.283v70.587h57.472v192.73h96.365v-192.73h96.365v192.73h96.365v-192.73h57.472v-70.587
                c6.335-1.644,12.167-3.404,17.48-5.283l-10.709-30.283c-16.685,5.901-45.819,12.513-96.364,16.592v-42.577
                c50.212-3.656,89.258-9.988,113.844-18.682l8.888-3.144l20.842-121.92L486.203,30.815z M175.695,458.184h-32.122V297.577h32.122
                V458.184z M368.425,458.184h-32.122V297.577h32.122V458.184z M425.897,233.616v31.839H86.102v-31.839
                c42.297,6.926,99.137,10.424,169.898,10.424C326.76,244.041,383.6,240.541,425.897,233.616z M175.695,210.091v-42.751
                c13.641,0.637,27.928,1.105,42.829,1.394v42.821C203.048,211.247,188.805,210.745,175.695,210.091z M250.646,201.212V169.09
                h10.707v32.122H250.646z M293.475,211.556v-42.821c14.901-0.289,29.188-0.757,42.829-1.394v42.751
                C323.194,210.745,308.951,211.247,293.475,211.556z M462.732,119.265c-39.719,11.295-113.966,17.703-206.732,17.703
                S88.986,130.56,49.267,119.265l-8.446-49.403c43.292,13.97,121.55,34.985,215.178,34.985s171.886-21.015,215.178-34.985
                L462.732,119.265z"
                style={{ fill: 'none', strokeWidth: 2 }}
              />
            </svg>
            <div
              ref={toriiGlowRef}
              className="absolute inset-0 rounded-full blur-2xl opacity-15 bg-primary dark:bg-sakura-pink"
            />
          </div>
          <p className="relative text-[10px] font-japanese text-slate-400 dark:text-slate-500 tracking-widest">
            生成中...
          </p>
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
