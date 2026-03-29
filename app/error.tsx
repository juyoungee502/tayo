"use client";

import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="py-10">
      <Card className="mx-auto max-w-2xl">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-rose-600">오류가 발생했습니다</p>
          <h1 className="text-2xl font-bold text-slateBlue">잠시 후 다시 시도해주세요.</h1>
          <p className="text-sm leading-6 text-slate-600">
            서버 상태를 불러오는 중 문제가 생겼습니다. 같은 문제가 반복되면 Supabase 환경변수, 세션 상태, 네트워크 연결을 함께 확인해 주세요.
          </p>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error.message || "알 수 없는 오류가 발생했습니다."}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={reset} className={buttonStyles("primary", true)}>
              다시 시도
            </button>
            <Link href="/home" className={buttonStyles("secondary", true)}>
              홈으로 이동
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
