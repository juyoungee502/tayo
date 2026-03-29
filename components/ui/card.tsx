import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-white/60 bg-white/85 p-5 shadow-card backdrop-blur sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}
