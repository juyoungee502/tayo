export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-48 animate-pulse rounded-[32px] bg-white/70" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-36 animate-pulse rounded-[32px] bg-white/70" />
        <div className="h-36 animate-pulse rounded-[32px] bg-white/70" />
      </div>
    </div>
  );
}
