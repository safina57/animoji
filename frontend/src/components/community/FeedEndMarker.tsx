import ToriiGateIcon from "@lib/decorations/ToriiGateIcon/ToriiGateIcon";

interface FeedEndMarkerProps {
  message?: string;
}

export default function FeedEndMarker({ message = "That's everything — now go make your own art!" }: FeedEndMarkerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-5">
      <div className="flex items-center gap-4 w-full max-w-sm">
        <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
        <ToriiGateIcon className="w-10 h-10 text-primary opacity-20" />
        <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-japanese text-slate-400 dark:text-slate-500">
          以上です
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500">
          {message}
        </p>
      </div>
    </div>
  );
}
