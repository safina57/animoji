interface SuggestionChipsProps {
  label: string;
  items: readonly string[];
  onSelect: (s: string) => void;
}

export default function SuggestionChips({ label, items, onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-2">
        {label}
      </span>
      {items.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="px-4 py-1.5 rounded-full border border-primary/10 text-xs font-medium hover:bg-primary hover:text-white hover:border-primary transition-all text-slate-500 dark:text-slate-400"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
