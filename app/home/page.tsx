import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { getHomePageData } from "@/lib/queries/data";

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const START_OPTIONS = ["역곡역", "온수역", "소사역", "개봉역"];
const TODAY_VERSE = "We love because he first loved us.";
const TODAY_ONE_LINER = "같이만 타면 막막했던 이동도 조금 덜 외로워질 수 있어요.";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = pickParam(params.error);
  const { favoriteDepartures, todayStats } = await getHomePageData();

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center px-4">
      <div className="w-full max-w-3xl space-y-5">
        {error ? <Notice variant="error">{error}</Notice> : null}

        <Card className="bg-mesh-glow p-6 sm:p-8 md:p-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-brand-700">출발지 선택</p>
              <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue sm:text-5xl">
                어디서 출발하나요?
              </h1>
              <p className="text-sm text-slate-500">복잡한 설명 없이, 바로 택시팟을 찾거나 직접 모집을 시작할 수 있어요.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {START_OPTIONS.map((station) => (
                <Link
                  key={station}
                  href={`/parties?q=${encodeURIComponent(station)}`}
                  className="group flex min-h-24 flex-col items-center justify-center rounded-3xl border border-brand-200 bg-white/90 px-5 py-5 text-center transition hover:-translate-y-0.5 hover:bg-brand-50"
                >
                  <span className="text-xl font-semibold text-slateBlue">{station}</span>
                  <span className="mt-1 text-xs text-slate-400 group-hover:text-slate-500">선택 후 바로 탐색</span>
                </Link>
              ))}
            </div>

            {favoriteDepartures.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">자주 찾는 출발지</p>
                  <p className="text-xs text-slate-400">최근 탑승 기준</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {favoriteDepartures.map((departure) => (
                    <Link key={departure} href={`/parties?q=${encodeURIComponent(departure)}`} className={buttonStyles("secondary")}>
                      {departure}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <form action="/parties" className="space-y-3">
              <input
                name="q"
                placeholder="출발지 직접 입력"
                className="w-full rounded-3xl border border-slate-200 bg-white px-8 py-5 text-xl font-medium text-slateBlue outline-none ring-brand-200 transition focus:ring sm:text-2xl"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="submit" className={buttonStyles("primary", true)}>
                  택시팟 찾기
                </button>
                <Link href="/parties/new?departure=역곡역&mode=instant" className={buttonStyles("secondary", true)}>
                  바로 모집 만들기
                </Link>
              </div>
            </form>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slateBlue">오늘 얼마나 함께 탔나요</p>
              <p className="text-3xl font-bold text-brand-700">{todayStats.riders}명</p>
              <p className="text-sm text-slate-500">오늘 완료된 택시팟 {todayStats.completedParties}개</p>
            </div>
          </Card>

          <Card className="p-5">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slateBlue">오늘의 말씀 / 한 줄</p>
              <p className="text-sm font-semibold text-brand-700">{TODAY_VERSE}</p>
              <p className="text-sm text-slate-500">{TODAY_ONE_LINER}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
