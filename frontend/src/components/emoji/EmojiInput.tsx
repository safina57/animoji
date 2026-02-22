import { useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import {
  setEmojiPrompt,
  setEmojiReferenceImage,
  startEmojiGeneration,
  setEmojiJobId,
  failEmojiGeneration,
} from '@store/slices/emojiSlice';
import { submitEmojiJob } from '@services/emojiService';
import { Button } from '@lib/ui/button';

const SUGGESTIONS = ['Cute bunny character', 'Anime girl with cat ears', 'Chubby bear'];

export default function EmojiInput() {
  const dispatch = useAppDispatch();
  const { prompt, referenceImage, referencePreviewUrl } = useAppSelector(s => s.emoji);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    dispatch(setEmojiReferenceImage({ file, previewUrl }));
  }

  function removeImage() {
    dispatch(setEmojiReferenceImage(null));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function generate() {
    if (!prompt.trim()) return;
    if (!referenceImage) {
      dispatch(failEmojiGeneration('Please upload an image first'));
      return;
    }

    dispatch(startEmojiGeneration());

    try {
      const result = await submitEmojiJob(referenceImage, prompt);
      dispatch(setEmojiJobId(result.job_id));
    } catch (error) {
      dispatch(
        failEmojiGeneration(
          error instanceof Error ? error.message : 'Something went wrong. Please try again.'
        )
      );
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generate();
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-3xl space-y-12">
        {/* Hero text */}
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-slate-900 dark:text-white">
            Turn yourself into stickers
          </h1>
          <p className="text-sm md:text-base text-primary/60 dark:text-primary/40 font-japanese uppercase tracking-[0.4em] font-medium">
            あなたをステッカーに変えましょう
          </p>
        </div>

        {/* Input card */}
        <div className="relative group">
          {/* Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />

          <div className="relative bg-paper-light dark:bg-paper-dark paper-texture rounded-3xl border border-primary/10 shadow-xl shadow-primary/5 p-2 flex flex-col gap-2 transition-all duration-300 focus-within:border-primary/30 focus-within:shadow-primary/10">
            {/* Reference image preview */}
            {referencePreviewUrl && (
              <div className="relative mx-4 mt-2 w-fit group/img">
                <img
                  src={referencePreviewUrl}
                  alt="Reference"
                  className="h-20 w-20 object-cover rounded-xl border border-primary/10"
                />
                <Button
                  onClick={removeImage}
                  size="icon"
                  variant="outline"
                  aria-label="Remove image"
                  className="absolute top-1 right-1 w-6 h-6 bg-white dark:bg-paper-dark border border-primary/10 rounded-md text-primary hover:border-primary/30 hover:bg-primary hover:text-white opacity-0 group-hover/img:opacity-100 transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </Button>
              </div>
            )}

            {/* Input row */}
            <div className="flex items-center gap-2">
              {/* Image upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-12 h-12 rounded-2xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileChange}
              />

              <textarea
                value={prompt}
                onChange={e => dispatch(setEmojiPrompt(e.target.value))}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-lg md:text-xl font-display placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none py-3"
                placeholder="Describe your character..."
                rows={1}
              />

              {/* Send button */}
              <Button
                onClick={generate}
                disabled={!prompt.trim()}
                size="icon"
                variant="outline"
                className="shrink-0 -ml-1 bg-white dark:bg-paper-dark border border-primary/10 rounded-2xl text-primary hover:border-primary/30 hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-primary disabled:hover:border-primary/10 dark:disabled:hover:bg-paper-dark transition-all"
                aria-label="Generate stickers"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Vertical Japanese decoration */}
          <div className="absolute -right-16 top-1/2 -translate-y-1/2 hidden xl:block pointer-events-none">
            <p className="[writing-mode:vertical-rl] text-primary/20 font-japanese text-2xl tracking-[0.5em] font-bold">
              表現力
            </p>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-2">
            Try:
          </span>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => dispatch(setEmojiPrompt(s))}
              className="px-4 py-1.5 rounded-full border border-primary/10 text-xs font-medium hover:bg-primary hover:text-white hover:border-primary transition-all text-slate-500 dark:text-slate-400"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
