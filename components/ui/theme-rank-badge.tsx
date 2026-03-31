const RANK_STYLES: Record<number, string> = {
  1: "border-amber-200 bg-amber-50 text-amber-700",
  2: "border-slate-300 bg-slate-100 text-slate-600",
  3: "border-orange-200 bg-orange-50 text-orange-700",
};

export function ThemeRankBadge({
  rank,
  className = "",
}: {
  rank: number | null | undefined;
  className?: string;
}) {
  if (!rank || rank < 1 || rank > 3) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${RANK_STYLES[rank]} ${className}`.trim()}
    >
      <span aria-hidden="true" className="text-xs leading-none">
        {"\u265B"}
      </span>
      <span>쓸데없는 짓하기 {rank}등</span>
    </span>
  );
}
