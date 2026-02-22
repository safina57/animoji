import ToriiGateIcon from "@lib/decorations/ToriiGateIcon/ToriiGateIcon";

export default function FeedEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
      <ToriiGateIcon className="w-32 h-32 text-primary opacity-10" />
      <div className="space-y-2">
        <p className="text-lg font-japanese text-slate-400 dark:text-slate-500">
          まだ投稿がありません
        </p>
        <p className="text-slate-500 dark:text-slate-400">
          No creations yet — be the first to publish!
        </p>
      </div>
    </div>
  );
}
