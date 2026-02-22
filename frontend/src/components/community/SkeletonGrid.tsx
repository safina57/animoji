function SkeletonCard({ tall }: { tall?: boolean }) {
  return (
    <div
      className={[
        "w-full break-inside-avoid rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse",
        tall ? "h-72" : "h-48",
      ].join(" ")}
    />
  );
}

const SKELETON_HEIGHTS: boolean[] = [
  false, true, false, true, true, false, true, false,
];

export default function SkeletonGrid() {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {SKELETON_HEIGHTS.map((tall, i) => (
        <SkeletonCard key={i} tall={tall} />
      ))}
    </div>
  );
}
