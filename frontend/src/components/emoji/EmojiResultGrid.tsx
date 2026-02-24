import { cn } from '@lib/utils';
import { Button } from '@lib/ui/button';
import EmojiVariantCard from './EmojiVariantCard';
import type { EmojiVariant } from '@customTypes/emoji';

interface EmojiResultGridProps {
  variants: EmojiVariant[];
  totalVariants: number;
  isComplete: boolean;
  onReset: () => void;
  onPublishVariant: (variantId: string) => Promise<void>;
}

export default function EmojiResultGrid({
  variants,
  totalVariants,
  isComplete,
  onReset,
  onPublishVariant,
}: EmojiResultGridProps) {
  const displayCount = totalVariants > 0 ? totalVariants : 3;
  const slots = Array.from(
    { length: displayCount },
    (_, i) => variants[i] as EmojiVariant | undefined
  );
  const completedCount = variants.filter(v => v.status === 'completed').length;

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white">
          {isComplete ? 'Your Stickers are Ready' : 'Creating Your Stickers'}
        </h2>
        <p className="text-sm text-primary/60 dark:text-primary/40 font-japanese uppercase tracking-[0.3em]">
          {isComplete ? 'ステッカーが完成しました' : 'ステッカーを作成しています'}
        </p>

        {/* Progress indicator */}
        {!isComplete && (
          <div className="flex items-center justify-center gap-3 pt-1">
            <div className="flex gap-2">
              {slots.map((slot, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-500',
                    slot?.status === 'completed'
                      ? 'bg-primary scale-125'
                      : slot?.status === 'failed'
                      ? 'bg-red-400 scale-125'
                      : 'bg-slate-300 dark:bg-slate-600 animate-pulse'
                  )}
                />
              ))}
            </div>
            {totalVariants > 0 && (
              <p className="text-xs text-slate-400 tabular-nums font-medium">
                {completedCount} of {totalVariants}
              </p>
            )}
          </div>
        )}

        {isComplete && (
          <p className="text-xs text-slate-400 uppercase tracking-widest animate-fade-in">
            Publish to get a shareable link · or download directly
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="flex flex-wrap justify-center gap-8 md:gap-10">
        {slots.map((variant, i) => (
          <div key={variant?.emotion ?? `skeleton-${i}`} className="w-64 md:w-72">
            <EmojiVariantCard
              variant={variant}
              index={i}
              isComplete={isComplete}
              onPublish={variant?.variantId ? () => onPublishVariant(variant.variantId!) : undefined}
            />
          </div>
        ))}
      </div>

      {/* Generate more */}
      {isComplete && (
        <div className="animate-fade-in pt-2">
          <Button
            onClick={onReset}
            variant="outline"
            className="gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-slate-600 dark:text-slate-400 hover:text-primary"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Generate more stickers
          </Button>
        </div>
      )}
    </div>
  );
}
