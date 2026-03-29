import { cn } from "@/lib/utils";
import type { PartyStatus } from "@/types/database";

const labelMap: Record<PartyStatus, string> = {
  recruiting: "모집 중",
  full: "정원 마감",
  completed: "운행 완료",
  cancelled: "취소됨",
  expired: "만료",
};

const colorMap: Record<PartyStatus, string> = {
  recruiting: "bg-emerald-100 text-emerald-700",
  full: "bg-amber-100 text-amber-700",
  completed: "bg-slate-100 text-slate-700",
  cancelled: "bg-rose-100 text-rose-700",
  expired: "bg-slate-100 text-slate-600",
};

export function StatusPill({ status }: { status: PartyStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", colorMap[status])}>
      {labelMap[status]}
    </span>
  );
}
