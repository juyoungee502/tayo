import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { buttonStyles } from "@/components/ui/button";
import { getHomePageData } from "@/lib/queries/data";

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const START_OPTIONS = ["���", "�¼���", "�һ翪", "������"];
const TODAY_VERSE = "We love because he first loved us.";
const TODAY_ONE_LINER = "���õ� ���ϸ� �������� ���� ���� Ż �� �־��.";

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
              <p className="text-sm font-semibold text-brand-700">������ ã��</p>
              <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue sm:text-5xl">
                ��� ����ϳ���?
              </h1>
              <p className="text-sm text-slate-500">���� ���� �����, ��� ������ �ٷ� �����ϰ�, ������ �ٷ� ����� �˴ϴ�.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {START_OPTIONS.map((station) => (
                <Link
                  key={station}
                  href={`/parties?q=${encodeURIComponent(station)}`}
                  className="group flex min-h-24 flex-col items-center justify-center rounded-3xl border border-brand-200 bg-white/90 px-5 py-5 text-center transition hover:-translate-y-0.5 hover:bg-brand-50"
                >
                  <span className="text-xl font-semibold text-slateBlue">{station}</span>
                  <span className="mt-1 text-xs text-slate-400 group-hover:text-slate-500">���� �� �� �ٷ� ����</span>
                </Link>
              ))}
            </div>

            {favoriteDepartures.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">���ã�� �����</p>
                  <p className="text-xs text-slate-400">�ֱ� ���� ž���� ��</p>
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
                placeholder="���� �Է�"
                className="w-full rounded-3xl border border-slate-200 bg-white px-8 py-5 text-xl font-medium text-slateBlue outline-none ring-brand-200 transition focus:ring sm:text-2xl"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="submit" className={buttonStyles("primary", true)}>
                  �ý��� ã��
                </button>
                <Link href="/parties/new?departure=���&mode=instant" className={buttonStyles("secondary", true)}>
                  �ٷ� ���� �����
                </Link>
              </div>
            </form>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slateBlue">���� �󸶳� ����������</p>
              <p className="text-3xl font-bold text-brand-700">{todayStats.riders}��</p>
              <p className="text-sm text-slate-500">���� �Ϸ�� �ý��� {todayStats.completedParties}��</p>
            </div>
          </Card>

          <Card className="p-5">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slateBlue">������ ���� / �� ��</p>
              <p className="text-sm font-semibold text-brand-700">{TODAY_VERSE}</p>
              <p className="text-sm text-slate-500">{TODAY_ONE_LINER}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
