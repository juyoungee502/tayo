import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Notice({
  children,
  variant = "info",
}: {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "error";
}) {
  const styles = {
    info: "border-brand-200 bg-brand-50/70 text-slateBlue",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-brand-300 bg-brand-100/70 text-slateBlue",
    error: "border-rose-200 bg-rose-50 text-rose-700",
  }[variant];

  return <div className={cn("rounded-2xl border px-4 py-3 text-sm", styles)}>{children}</div>;
}
