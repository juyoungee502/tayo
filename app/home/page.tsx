import Link from "next/link";

import { joinPartyAction } from "@/lib/actions/app-actions";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { StatusPill } from "@/components/ui/status-pill";
import { getHomePageData } from "@/lib/queries/data";
import { formatDateTime, formatRelativeStatus } from "@/lib/utils";

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = pickParam(params.q) ?? "";
  const date = pickParam(params.date) ?? "";
  const error = pickParam(params.error);
  const { user, upcomingParty, pendingFeedbackParties, featuredParties } = await getHomePageData();

  return (
    <div className="space-y-6">
      {error ? <Notice variant="error">{error}</Notice> : null}

      <Card className="bg-mesh-glow">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-brand-700">지금 같이 탈 사람 찾기</p>
            <div>
              <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue sm:text-4xl">
                바로 찾고, 바로 참여하고, 없으면 바로 만들어요.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                출발지와 날짜만 정하면 오늘 같이 탈 수 있는 택시팟을 바로 보여드립니다.
              </p>
            </div>
          </div>

          <form action="/parties" className="grid gap-3 rounded-3xl bg-white/80 p-4 shadow-card lg:grid-cols-[1.5fr,1fr,auto,auto]">
            <input name="q" defaultValue={q} placeholder="예: 부천역, 역곡역, 정문 앞" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring" />
            <input type="date" name="date" defaultValue={date} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring" />
            <button type="submit" className={buttonStyles("primary", true)}>같이 탈 사람 찾기</button>
            <Link href="/parties/new" className={buttonStyles("secondary", true)}>모집 시작하기</Link>
          </form>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slateBlue">내 참여 현황</p>
              <p className="mt-1 text-sm text-slate-500">{user ? "내가 지금 어디에 참여 중인지 바로 확인할 수 있어요." : "로그인 없이 탐색하고, 참여나 생성이 필요할 때만 로그인하면 됩니다."}</p>
            </div>
            {upcomingParty ? <StatusPill status={upcomingParty.status} /> : null}
          </div>

          {upcomingParty ? (
            <div className="mt-6 grid gap-4 rounded-3xl bg-slate-50/80 p-4 sm:grid-cols-[1fr,auto] sm:items-end">
              <div className="space-y-2">
                <p className="text-2xl font-semibold text-slateBlue">{upcomingParty.departure_place_name}</p>
                <p className="text-sm text-slate-500">{upcomingParty.destination_name}</p>
                <p className="text-sm text-slate-600">{formatDateTime(upcomingParty.scheduled_at)} · {formatRelativeStatus(upcomingParty.scheduled_at)}</p>
              </div>
              <div className="space-y-2 text-sm text-slate-500 sm:text-right">
                <p>현재 인원은 상세에서 바로 확인할 수 있어요.</p>
                <Link href={`/parties/${upcomingParty.id}`} className={buttonStyles("secondary")}>내 참여 팟 보기</Link>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState title={user ? "아직 참여 중인 활성 택시팟이 없어요" : "지금은 먼저 탐색부터 해보세요"} description={user ? "홈에서 바로 검색하거나 모집 중인 팟에 합류해 오늘 이동을 미리 맞춰보세요." : "홈과 목록은 로그인 없이 볼 수 있고, 실제 참여나 생성하는 순간에만 로그인하면 됩니다."} actionHref="/parties" actionLabel="택시팟 둘러보기" />
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slateBlue">피드백 알림</p>
              <p className="mt-1 text-sm text-slate-500">참여 뒤에 해야 할 일도 여기서 바로 확인합니다.</p>
            </div>
            {user ? <p className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">{pendingFeedbackParties.length}개 대기</p> : null}
          </div>

          {user ? pendingFeedbackParties.length > 0 ? (
            <div className="mt-5 space-y-3">
              {pendingFeedbackParties.slice(0, 3).map((party) => (
                <Link key={party.id} href={`/feedback/${party.id}`} className="block rounded-2xl border border-brand-200 bg-brand-50/70 px-4 py-3">
                  <p className="text-sm font-semibold text-slateBlue">{party.departure_place_name} → {party.destination_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(party.scheduled_at)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-slate-500">지금은 바로 작성할 피드백이 없습니다. 참여 후 다시 돌아오면 여기서 이어서 볼 수 있어요.</p>
          ) : (
            <div className="mt-5 rounded-3xl bg-slate-50/80 p-4 text-sm leading-6 text-slate-500">로그인하면 내가 참여한 팟, 피드백, 생성 이력을 한눈에 이어서 확인할 수 있습니다.</div>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slateBlue">지금 모집 중인 택시팟</h2>
            <p className="text-sm text-slate-500">출발지와 시간, 현재 인원을 보고 홈에서 바로 참여할 수 있게 구성했습니다.</p>
          </div>
          <Link href="/parties?availability=joinable" className={buttonStyles("secondary")}>모집 중인 팟 더 보기</Link>
        </div>

        {featuredParties.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {featuredParties.map((party) => (
              <Card key={party.id} className="h-full transition hover:-translate-y-1 hover:bg-white">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slateBlue">{party.departure_place_name}</p>
                      <p className="text-sm text-slate-500">{party.destination_name}</p>
                    </div>
                    <StatusPill status={party.status} />
                  </div>
                  <div className="grid gap-2 text-sm text-slate-600">
                    <p>출발 시간: {formatDateTime(party.scheduled_at)}</p>
                    <p>현재 인원 / 정원: {party.joinedCount}/{party.capacity}명</p>
                    <p>남은 자리 수: {party.seatsLeft}석</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">{party.isJoinable ? "바로 참여 가능한 상태예요." : "상세에서 참여 가능 여부를 확인할 수 있어요."}</p>
                    <div className="flex gap-2">
                      <Link href={`/parties/${party.id}`} className={buttonStyles("secondary")}>상세 보기</Link>
                      {party.isJoinable ? <form action={joinPartyAction.bind(null, party.id)}><button type="submit" className={buttonStyles("primary")}>참여하기</button></form> : null}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="지금 모집 중인 택시팟이 없어요" description="조건에 맞는 팟이 없다면 바로 새 택시팟을 만들어서 모집을 시작해보세요." actionHref="/parties/new" actionLabel="택시팟 만들기" />
        )}
      </div>
    </div>
  );
}