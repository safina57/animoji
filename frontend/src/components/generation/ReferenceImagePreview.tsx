import { Button } from "@lib/ui/button";

interface ReferenceImagePreviewProps {
  src: string;
  onRemove: () => void;
}

export default function ReferenceImagePreview({ src, onRemove }: ReferenceImagePreviewProps) {
  return (
    <div className="relative mx-4 mt-2 w-fit group/img">
      <img
        src={src}
        alt="Reference"
        className="h-20 w-20 object-cover rounded-xl border border-primary/10"
      />
      <Button
        onClick={onRemove}
        size="icon"
        variant="outline"
        aria-label="Remove image"
        className="absolute top-1 right-1 w-6 h-6 bg-white dark:bg-paper-dark border border-primary/10 rounded-md text-primary hover:border-primary/30 hover:bg-primary hover:text-white opacity-0 group-hover/img:opacity-100 transition-all shadow-sm"
      >
        <span className="material-symbols-outlined text-xs">close</span>
      </Button>
    </div>
  );
}
