import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <Card className="text-center">
      <div className="mx-auto max-w-md space-y-3 py-4">
        <p className="text-lg font-semibold text-slateBlue">{title}</p>
        <p className="text-sm leading-6 text-slate-500">{description}</p>
        {actionHref && actionLabel ? (
          <Link href={actionHref} className={buttonStyles("primary")}>
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
