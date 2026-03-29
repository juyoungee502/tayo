import Link from "next/link";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { StatusPill } from "@/components/ui/status-pill";
import { buttonStyles } from "@/components/ui/button";
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
  const error = pickParam(params.error);
  const { profile, upcomingParty, pendingFeedbackParties, recentParties } = await getHomePageData();

  return (
    <div className="space-y-6">
      {error ? <Notice variant="error">{error}</Notice> : null}

      <Card className="bg-mesh-glow">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-brand-700">{profile.school}</p>
            <div>
              <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue sm:text-4xl">
                {profile.nickname}님, 오늘 택시팟 흐름을 바로 이어볼까요?
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                로그인과 프로필 생성은 끝났습니다. 이제 남은 건 택시팟을 만들거나, 이미 올라온 팟에 빠르게 합류하는 일뿐입니다.
              </p>
            </div>
          </div>
          <Link href="/parties/new" className={buttonStyles("primary")}>
            새 택시팟 만들기
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slateBlue">다가오는 내 택시팟</p>
              <p className="mt-1 text-sm text-slate-500">현재 참여 중인 가장 가까운 모임을 보여줍니다.</p>
            </div>
            {upcomingParty ? <StatusPill status={upcomingParty.status} /> : null}
          </div>
          {upcomingParty ? (
            <div className="mt-6 space-y-3">
              <div>
                <p className="text-2xl font-semibold text-slateBlue">{upcomingParty.departure_place_name}</p>
                <p className="text-sm text-slate-500">{upcomingParty.destination_name}</p>
              </div>
              <p className="text-sm text-slate-600">{formatDateTime(upcomingParty.scheduled_at)} · {formatRelativeStatus(upcomingParty.scheduled_at)}</p>
              <Link href={`/parties/${upcomingParty.id}`} className={buttonStyles("secondary")}>
                상세 보기
              </Link>
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState
                title="참여 중인 활성 택시팟이 없어요"
                description="목록을 둘러보거나 새로 만들어서 오늘 이동을 미리 맞춰보세요."
                actionHref="/parties"
                actionLabel="택시팟 보러가기"
              />
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slateBlue">피드백 알림</p>
              <p className="mt-1 text-sm text-slate-500">모임이 끝난 뒤 1시간이 지나면 후기와 신고를 유도합니다.</p>
            </div>
            <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              {pendingFeedbackParties.length}개 대기
            </p>
          </div>
          {pendingFeedbackParties.length > 0 ? (
            <div className="mt-5 space-y-3">
              {pendingFeedbackParties.slice(0, 3).map((party) => (
                <Link key={party.id} href={`/feedback/${party.id}`} className="block rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-semibold text-amber-900">{party.departure_place_name} → {party.destination_name}</p>
                  <p className="mt-1 text-xs text-amber-700">{formatDateTime(party.scheduled_at)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-slate-500">지금은 작성할 피드백이 없습니다. 모임이 끝난 뒤 홈으로 돌아오면 여기서 바로 안내해드릴게요.</p>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slateBlue">최근 택시팟</h2>
            <p className="text-sm text-slate-500">출발지, 시간, 정원을 한눈에 보고 바로 상세로 이동할 수 있습니다.</p>
          </div>
          <Link href="/parties" className={buttonStyles("secondary")}>
            전체 보기
          </Link>
        </div>
        {recentParties.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {recentParties.map((party) => (
              <Link key={party.id} href={`/parties/${party.id}`}>
                <Card className="h-full transition hover:-translate-y-1 hover:bg-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slateBlue">{party.departure_place_name}</p>
                      <p className="text-sm text-slate-500">{party.destination_name}</p>
                    </div>
                    <StatusPill status={party.status} />
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>{formatDateTime(party.scheduled_at)}</p>
                    <p>{party.joinedCount}/{party.capacity}명 · 생성자 {party.creatorNickname}</p>
                    <p>{party.isJoinable ? "지금 참여할 수 있는 상태입니다." : "상세에서 참여 가능 여부를 확인하세요."}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="아직 생성된 택시팟이 없어요"
            description="첫 번째 택시팟을 만들어서 바로 합승을 시작해보세요."
            actionHref="/parties/new"
            actionLabel="첫 팟 만들기"
          />
        )}
      </div>
    </div>
  );
}
