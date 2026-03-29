import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = pickParam(params.error);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center">
      <div className="w-full space-y-5">
        {error ? <Notice variant="error">{error}</Notice> : null}

        <Card className="bg-mesh-glow p-6 sm:p-8">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <p className="text-sm font-semibold text-brand-700">빠르게 찾고 바로 타기</p>
              <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue sm:text-4xl">
                어디서 출발하나요?
              </h1>
            </div>

            <div className="space-y-3">
              <Link
                href="/parties?q=역곡역"
                className="flex min-h-24 items-center justify-center rounded-3xl bg-brand-500 px-6 py-6 text-center text-xl font-semibold text-slateBlue shadow-lg shadow-brand-200/60 transition hover:-translate-y-0.5 hover:bg-brand-400"
              >
                역곡역에서 출발
              </Link>

              <Link
                href="/parties?chooser=1"
                className="flex min-h-16 items-center justify-center rounded-3xl border border-brand-200 bg-white/90 px-5 py-4 text-base font-semibold text-slateBlue transition hover:bg-brand-50/80"
              >
                다른 곳에서 출발
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
