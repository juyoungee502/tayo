import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { buttonStyles } from "@/components/ui/button";
import { getHomePageData } from "@/lib/queries/data";

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const START_OPTIONS = ["역곡역", "온수역", "소사역", "개봉역"];
const TODAY_VERSE = "We love because he first loved us.";
const TODAY_ONE_LINER = "오늘도 급하면 생각보다 빨리 같이 탈 수 있어요.";

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
              <p className="text-sm text-slate-500">자주 쓰는 역부터 바로 눌러서 팟을 확인할 수 있어요.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {START_OPTIONS.map((station) => (
                <Link
                  key={station}
                  href={`/parties?q=${encodeURIComponent(station)}`}
                  className="flex min-h-24 items-center justify-center rounded-3xl border border-brand-200 bg-white/90 px-6 py-6 text-center text-xl font-semibold text-slateBlue transition hover:-translate-y-0.5 hover:bg-brand-50"
                >
                  {station}
                </Link>
              ))}
            </div>

            {favoriteDepartures.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">즐겨찾는 출발지</p>
                <div className="flex flex-wrap gap-2">
                  {favoriteDepartures.map((departure) => (
                    <Link key={departure} href={`/parties?q=${encodeURIComponent(departure)}`} className={buttonStyles("secondary")}>
                      {departure}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <form action="/parties" className="space-y-4">
              <input
                name="q"
                placeholder="직접 입력"
                className="w-full rounded-3xl border border-slate-200 bg-white px-8 py-6 text-2xl font-medium text-slateBlue outline-none ring-brand-200 transition focus:ring"
              />
              <button type="submit" className={buttonStyles("primary", true)}>
                결과 보기
              </button>
            </form>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slateBlue">오늘 몇 명 탔는지</p>
              <p className="text-3xl font-bold text-brand-700">{todayStats.riders}명</p>
              <p className="text-sm text-slate-500">오늘 완료된 택시팟 {todayStats.completedParties}건</p>
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
