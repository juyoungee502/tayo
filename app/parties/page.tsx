import Link from "next/link";

import { joinPartyAction } from "@/lib/actions/app-actions";
import { DEFAULT_DESTINATION } from "@/lib/constants";
import { getPartyList } from "@/lib/queries/data";
import { estimateTaxiShare, formatDate, formatDateTime, isUrgentParty, stripUrgentMarker } from "@/lib/utils";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { ThemeRankBadge } from "@/components/ui/theme-rank-badge";
import type { PartyListItem } from "@/types/database";

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isImmediateParty(scheduledAt: string) {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  return diff <= 20 * 60 * 1000;
}

function buildCreateHref(q: string) {
  const departure = q || "역곡역";
  return `/parties/new?departure=${encodeURIComponent(departure)}&mode=instant`;
}

function getJoinDisabledCopy(party: PartyListItem) {
  switch (party.joinDisabledReason) {
    case "already_joined":
      return "이미 이 팟과 연결된 이력이 있어 다시 참여할 수 없어요.";
    case "other_active_party":
      return "이미 다른 활성 택시팟에 참여 중이라 지금은 들어갈 수 없어요.";
    case "full":
      return "정원이 모두 차서 지금은 참여할 수 없어요.";
    case "completed":
      return "이미 운행이 완료된 팟이에요.";
    case "expired":
      return "마감되었거나 더 이상 참여할 수 없는 팟이에요.";
    case "departed":
      return "출발 시간이 지나서 참여가 닫혔어요.";
    default:
      return "지금은 참여할 수 없는 팟이에요. 상세에서 상태를 확인해 주세요.";
  }
}

function PartyListSection({
  title,
  description,
  parties,
}: {
  title: string;
  description: string;
  parties: PartyListItem[];
}) {
  if (parties.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1 px-1">
        <h2 className="text-base font-semibold text-slateBlue">{title}</h2>
        <p className="text-xs text-slate-500">{description}</p>
      </div>

      {parties.map((party) => {
        const immediate = isImmediateParty(party.scheduled_at);
        const estimatedShare = estimateTaxiShare(party.joinedCount, party.capacity, party.departure_place_name);
        const urgent = isUrgentParty(party.note);
        const note = stripUrgentMarker(party.note);
        const closingSoon = party.seatsLeft === 1;

        return (
          <Card key={party.id} className={`p-5 ${immediate ? "border-brand-300 shadow-lg shadow-brand-200/60" : ""}`}>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/parties/${party.id}`} className="text-lg font-semibold text-slateBlue">
                      {party.departure_place_name}
                    </Link>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">모집 중</span>
                    {urgent ? <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-600">급해요</span> : null}
                    {immediate ? <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-600">곧 출발</span> : null}
                    {closingSoon ? <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">1자리 남음</span> : null}
                  </div>
                  {party.destination_name !== DEFAULT_DESTINATION.placeName ? (
                    <p className="text-sm text-slate-500">{party.destination_name}</p>
                  ) : null}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${immediate ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600"}`}>
                  {immediate ? "바로 출발" : "예약"}
                </span>
              </div>

              <div className="space-y-1 text-sm text-slate-600">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>생성자: {party.creatorNickname}</span>
                  <ThemeRankBadge rank={party.creatorThemeFunRank} />
                </div>
                {party.sharedRideCount > 0 ? (
                  <p className="text-xs text-brand-700">
                    {formatDate(party.lastRideAtWithCreator ?? new Date().toISOString())}에 {party.creatorNickname}님과 같이 탑승했어요. 함께한 기록은 총 {party.sharedRideCount}번이에요.
                  </p>
                ) : null}
                {party.creatorReviewCount > 0 && party.creatorAverageRating ? (
                  <p className="text-xs text-slate-500">생성자 후기 평균: {party.creatorAverageRating} / 5.0 ({party.creatorReviewCount}개)</p>
                ) : null}
                <p>현재 인원 / 최대 인원: {party.joinedCount}/{party.capacity}명</p>
                <p>예상 1인당 비용: 약 {estimatedShare.toLocaleString()}원</p>
                <p>출발 시간: {formatDateTime(party.scheduled_at)}</p>
                {note ? <p>정산/메모: {note}</p> : null}
              </div>

              {party.isJoinable ? (
                <form action={joinPartyAction.bind(null, party.id)}>
                  <button type="submit" className={buttonStyles("primary", true)}>바로 참여하기</button>
                </form>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
                    {getJoinDisabledCopy(party)}
                  </div>
                  <Link href={`/parties/${party.id}`} className={buttonStyles("secondary", true)}>상세 보기</Link>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default async function PartiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = pickParam(params.q) ?? "";
  const message = pickParam(params.message);
  const error = pickParam(params.error);
  const chooser = pickParam(params.chooser) === "1";
  const parties = await getPartyList({ q });

  const recruitingParties = parties.filter((party) => party.status === "recruiting");
  const immediateParties = recruitingParties.filter((party) => isImmediateParty(party.scheduled_at));
  const reservedParties = recruitingParties.filter((party) => !isImmediateParty(party.scheduled_at));
  const joinableCount = recruitingParties.filter((party) => party.isJoinable).length;

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      {message ? <Notice variant="success">{message}</Notice> : null}
      {error ? <Notice variant="error">{error}</Notice> : null}

      <Card className="p-5">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-brand-700">탐색 시작</p>
            <h1 className="text-2xl font-bold text-slateBlue">{q ? `${q}에서 출발하는 팟` : "어디에서 출발하나요?"}</h1>
            <p className="text-sm text-slate-500">지금 사람을 구하고 있는 택시팟만 먼저 보여드릴게요.</p>
          </div>

          <form action="/parties" className="space-y-3">
            <input
              name="q"
              defaultValue={q}
              placeholder="출발지를 입력해 주세요"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="submit" className={buttonStyles("primary", true)}>택시팟 찾기</button>
              <Link href={buildCreateHref(q)} className={buttonStyles("secondary", true)}>택시팟 생성하기</Link>
            </div>
          </form>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {["역곡역", "온수역", "소사역", "개봉역"].map((station) => (
              <Link key={station} href={`/parties?q=${encodeURIComponent(station)}`} className={`${buttonStyles(q === station ? "primary" : "secondary", true)} text-sm`}>
                {station}
              </Link>
            ))}
          </div>

          {q ? (
            <div className="grid grid-cols-3 gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">모집 중</p>
                <p className="mt-1 text-lg font-semibold text-slateBlue">{recruitingParties.length}개</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">참여 가능</p>
                <p className="mt-1 text-lg font-semibold text-brand-700">{joinableCount}개</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">곧 출발</p>
                <p className="mt-1 text-lg font-semibold text-slateBlue">{immediateParties.length}개</p>
              </div>
            </div>
          ) : null}

          {!chooser && q ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">원하는 출발지가 아니면 바로 다시 고를 수 있어요.</p>
              <Link href="/parties?chooser=1" className="text-sm font-semibold text-brand-700 underline underline-offset-4">출발지 다시 고르기</Link>
            </div>
          ) : null}
        </div>
      </Card>

      {chooser || !q ? (
        <Card className="p-5">
          <p className="text-sm text-slate-500">출발지를 먼저 고르면 지금 모집 중인 택시팟부터 빠르게 보여드릴게요.</p>
        </Card>
      ) : null}

      {q ? recruitingParties.length > 0 ? (
        <div className="space-y-5">
          <PartyListSection
            title="곧 출발"
            description="20분 안에 움직일 수 있는 모집 중 팟이에요. 급하게 타야 할 때 먼저 확인해 보세요."
            parties={immediateParties}
          />
          <PartyListSection
            title="예약 모집 중"
            description="시간을 맞춰 이동할 수 있는 모집 중 팟이에요."
            parties={reservedParties}
          />
        </div>
      ) : (
        <EmptyState
          title="지금 모집 중인 택시팟이 없어요"
          description="같이 탈 사람을 기다리고 있다면, 먼저 모집을 열어 빠르게 모아보세요."
          actionHref={buildCreateHref(q)}
          actionLabel="택시팟 생성하기"
        />
      ) : null}
    </div>
  );
}
