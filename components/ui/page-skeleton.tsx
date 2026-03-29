export function PageSkeleton({
  blocks = 3,
}: {
  blocks?: number;
}) {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-[32px] bg-white/70" />
      {Array.from({ length: blocks }).map((_, index) => (
        <div key={index} className="h-36 animate-pulse rounded-[32px] bg-white/70" />
      ))}
    </div>
  );
}
