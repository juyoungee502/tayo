import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { StatusPill } from "@/components/ui/status-pill";
import { ThemeRankBadge } from "@/components/ui/theme-rank-badge";
import { buttonStyles } from "@/components/ui/button";
import { SharePartyButton } from "@/components/ui/share-party-button";
import {
  cancelPartyAction,
  joinPartyAction,
  leavePartyAction,
  markPartyDepartedAction,
  nudgePartyAction,
  savePartyMemberNoteAction,
  updateDepartureChecklistAction,
  updatePartyCapacityAction,
} from "@/lib/actions/app-actions";
import { getOptionalAuthContext } from "@/lib/queries/auth";
import { getPartyDetail } from "@/lib/queries/data";
import { estimateTaxiShare, formatDateTime, formatRelativeStatus, isUrgentParty, stripUrgentMarker } from "@/lib/utils";
import type { MemberStatus } from "@/types/database";

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getMemberStatusLabel(status: MemberStatus, isCreator: boolean) {
  if (isCreator) {
    return "작성자";
  }

  switch (status) {
    case "joined":
      return "참여 중";
    case "left":
      return "나감";
    case "removed":
      return "제외됨";
    case "completed":
      return "탑승 완료";
    default:
      return status;
  }
}

export default async function PartyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const message = pickParam(query.message);
  const error = pickParam(query.error);
  const { user } = await getOptionalAuthContext();
  const party = await getPartyDetail(id);

  if (!party) {
    notFound();
  }

  const isCreator = user ? party.creator_id === user.id : false;
  const isJoined = party.currentUserMembership?.status === "joined";
  const hasMembershipHistory = Boolean(party.currentUserMembership);
  const isFuture = new Date(party.scheduled_at).getTime() > Date.now();
  const seatsLeft = Math.max(party.capacity - party.joinedCount, 0);
  const isClosed = party.status === "completed" || party.status === "cancelled" || party.status === "expired";
  const canJoin = Boolean(user) && !isCreator && !hasMembershipHistory && isFuture && seatsLeft > 0 && !party.hasAnotherActiveParty && !isClosed;
  const canLeave = Boolean(user) && !isCreator && Boolean(isJoined) && isFuture;
  const canCancel = Boolean(user) && isCreator && isFuture && !isClosed;
  const canNudge = Boolean(user) && !isCreator && Boolean(isJoined) && isFuture && !isClosed;
  const canMarkDeparted = Boolean(user) && isCreator && !isClosed;
  const canSaveFindNote = Boolean(user) && Boolean(party.currentUserMembership) && !isClosed;
  const currentUserNote = party.members.find((participant) => participant.profile.id === user?.id)?.note ?? "";
  const shouldPromptLogin = !user && isFuture && seatsLeft > 0 && !isClosed;
  const urgent = isUrgentParty(party.note);
  const cleanNote = stripUrgentMarker(party.note);
  const estimatedShare = estimateTaxiShare(party.joinedCount, party.capacity, party.departure_place_name);
  const sameDepartureHref = `/parties?q=${encodeURIComponent(party.departure_place_name)}`;

  const summaryStatus = shouldPromptLogin
    ? "로그인 후 바로 참여할 수 있어요"
    : canJoin
      ? "지금 바로 참여할 수 있어요"
      : isJoined
        ? "이미 이 팟에 참여 중이에요"
        : hasMembershipHistory
          ? "이미 이 팟과 연결된 이력이 있어요"
          : isClosed
            ? "이미 종료된 팟이에요"
            : seatsLeft === 0
              ? "정원이 모두 찼어요"
              : "현재 상태를 확인해 주세요";

  const nextActionLabel = shouldPromptLogin
    ? "로그인 후 참여하기"
    : canJoin
      ? "바로 참여하기"
      : canLeave
        ? "참여 취소"
        : canMarkDeparted
          ? "출발 완료 처리"
          : canNudge
            ? "생성자에게 출발 요청"
            : "상세 상태 확인";

  return (
    <div className="space-y-6">
      {message ? <Notice variant="success">{message}</Notice> : null}
      {error ? <Notice variant="error">{error}</Notice> : null}
      {party.hasAnotherActiveParty && !isJoined ? (
        <Notice variant="warning">이미 다른 활성 택시팟에 참여 중이라 이 팟에는 바로 들어갈 수 없어요.</Notice>
      ) : null}
      {hasMembershipHistory && !isJoined ? (
        <Notice variant="info">이 팟과 연결된 이력이 있어 다시 참여 버튼은 열리지 않아요.</Notice>
      ) : null}
      {party.isFeedbackDue && !party.hasSubmittedFeedback ? (
        <Notice variant="warning">
          피드백 작성 기한이 열렸어요. <Link href={`/feedback/${party.id}`} className="font-semibold underline">후기/신고 쓰러 가기</Link>
        </Notice>
      ) : null}
      {!party.isFeedbackDue && party.status === "completed" && party.currentUserMembership ? (
        <Notice variant="info">
          운행은 끝났고, 피드백은 출발 후 1시간 뒤부터 열려요. <Link href={`/feedback/${party.id}`} className="font-semibold underline">피드백 페이지 바로가기</Link>
        </Notice>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Link href={sameDepartureHref} className={buttonStyles("secondary")}>
          같은 출발지 다른 팟 보기
        </Link>
        <Link href="/parties" className={buttonStyles("ghost")}>
          전체 목록으로 돌아가기
        </Link>
      </div>

      <Card className="bg-mesh-glow">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue">{party.departure_place_name}</h1>
              <StatusPill status={party.status} />
              {urgent ? <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">급해요</span> : null}
              {seatsLeft === 1 && party.status === "recruiting" ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">1자리 남음</span> : null}
            </div>
            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p>도착지: {party.destination_name}</p>
              <p>출발 시간: {formatDateTime(party.scheduled_at)}</p>
              <p>현재 인원 / 최대 인원: {party.joinedCount}/{party.capacity}명</p>
              <p>예상 1인당 금액: 약 {estimatedShare.toLocaleString()}원</p>
              <p>남은 자리: {seatsLeft}명</p>
              <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                <p>생성자: {party.creator?.nickname ?? "알 수 없음"}</p>
                <ThemeRankBadge rank={party.creatorThemeFunRank} />
              </div>
              {party.creatorReviewCount > 0 && party.creatorAverageRating ? (
                <p>후기 평균: {party.creatorAverageRating} / 5.0 ({party.creatorReviewCount}개)</p>
              ) : null}
              {party.departure_detail ? <p className="sm:col-span-2">상세 위치: {party.departure_detail}</p> : null}
              {cleanNote ? <p className="sm:col-span-2">정산/메모: {cleanNote}</p> : null}
            </div>
          </div>

          <div className="w-full max-w-sm space-y-3">
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-4">
              <p className="text-sm font-semibold text-slateBlue">지금 이 팟에서 바로 할 일</p>
              <p className="mt-2 text-sm text-slate-500">필요한 행동만 먼저 보이도록 정리했어요.</p>
              <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50/80 p-3 text-sm text-slate-600">
                <p>출발까지: {formatRelativeStatus(party.scheduled_at)}</p>
                <p>내 상태: {summaryStatus}</p>
                <p>다음 행동: {nextActionLabel}</p>
              </div>
            </div>

            {canJoin ? (
              <form action={joinPartyAction.bind(null, party.id)}>
                <button type="submit" className={buttonStyles("primary", true)}>바로 참여하기</button>
              </form>
            ) : null}
            {canLeave ? (
              <form action={leavePartyAction.bind(null, party.id)}>
                <button type="submit" className={buttonStyles("secondary", true)}>참여 취소</button>
              </form>
            ) : null}
            {canNudge ? (
              <form action={nudgePartyAction.bind(null, party.id)}>
                <button type="submit" className={buttonStyles("secondary", true)}>지금 출발해요</button>
              </form>
            ) : null}
            {canMarkDeparted ? (
              <form action={markPartyDepartedAction.bind(null, party.id)}>
                <button type="submit" className={buttonStyles("primary", true)}>출발했어요!</button>
              </form>
            ) : null}
            {canCancel ? (
              <form action={cancelPartyAction.bind(null, party.id)}>
                <button type="submit" className={buttonStyles("danger", true)}>팟 취소</button>
              </form>
            ) : null}
            <SharePartyButton partyId={party.id} />
            {shouldPromptLogin ? <Link href="/login" className={buttonStyles("primary", true)}>로그인 후 참여하기</Link> : null}
            {!canJoin && !canLeave && !canCancel && !canNudge && !canMarkDeparted && !shouldPromptLogin ? (
              <Notice variant="info">현재 상태에서는 추가 행동이 없어요. 아래 참여자와 준비 상태만 확인해 주세요.</Notice>
            ) : null}
          </div>
        </div>
      </Card>

      {isCreator && !isClosed ? (
        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slateBlue">출발 체크리스트</h2>
              <p className="mt-1 text-sm text-slate-500">출발 전에 필요한 상태를 간단히 공유할 수 있어요.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <form action={updateDepartureChecklistAction.bind(null, party.id)} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <input type="hidden" name="field" value="taxi_called" />
                <input type="hidden" name="value" value={party.taxi_called ? "false" : "true"} />
                <p className="text-sm font-semibold text-slateBlue">택시 호출</p>
                <p className="mt-1 text-sm text-slate-500">{party.taxi_called ? "택시를 이미 불렀어요." : "아직 택시를 부르기 전이에요."}</p>
                <button type="submit" className={`${buttonStyles("secondary")} mt-3 w-full`}>
                  {party.taxi_called ? "호출 전 상태로 되돌리기" : "택시 불렀어요"}
                </button>
              </form>
              <form action={updateDepartureChecklistAction.bind(null, party.id)} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <input type="hidden" name="field" value="everyone_ready" />
                <input type="hidden" name="value" value={party.everyone_ready ? "false" : "true"} />
                <p className="text-sm font-semibold text-slateBlue">전원 도착</p>
                <p className="mt-1 text-sm text-slate-500">{party.everyone_ready ? "다 같이 모였어요." : "아직 모이는 중이에요."}</p>
                <button type="submit" className={`${buttonStyles("secondary")} mt-3 w-full`}>
                  {party.everyone_ready ? "다시 준비 중으로 바꾸기" : "다 모였어요"}
                </button>
              </form>
            </div>
          </div>
        </Card>
      ) : null}

      {canSaveFindNote ? (
        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slateBlue">서로 찾기 메모</h2>
              <p className="mt-1 text-sm text-slate-500">복장이나 서 있는 위치를 짧게 남기면 더 빨리 만날 수 있어요.</p>
            </div>
            <form action={savePartyMemberNoteAction.bind(null, party.id)} className="space-y-3">
              <textarea
                name="note"
                defaultValue={currentUserNote}
                maxLength={80}
                placeholder="예: 검은 패딩 입고 정문 앞에 있어요"
                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
              />
              <button type="submit" className={buttonStyles("secondary")}>메모 저장</button>
            </form>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr,0.9fr]">
        <Card>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slateBlue">참여자 정보</h2>
              <p className="text-sm text-slate-500">작성자는 자동으로 첫 번째 참여자에 포함돼요.</p>
            </div>
            <p className="text-sm text-slate-500">남은 자리 {seatsLeft}명</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {party.members.map((participant) => {
              const participantIsCreator = participant.membership.user_id === party.creator_id;
              return (
                <div key={participant.profile.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slateBlue">{participant.profile.nickname}</p>
                        <ThemeRankBadge rank={participant.themeFunRank} />
                      </div>
                      <p className="text-xs text-slate-500">{participant.profile.school}</p>
                      {participant.profile.department || participant.profile.student_number ? (
                        <p className="text-xs text-slate-400">{[participant.profile.department, participant.profile.student_number].filter(Boolean).join(" · ")}</p>
                      ) : null}
                    </div>
                    <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {getMemberStatusLabel(participant.membership.status, participantIsCreator)}
                    </p>
                  </div>
                  {participant.note ? <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs text-slate-600">찾기 메모: {participant.note}</p> : null}
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slateBlue">빠른 이동</h2>
              <p className="mt-1 text-sm text-slate-500">같은 출발지 다른 팟이나 운영 도구를 여기로 모아뒀어요.</p>
            </div>
            <div className="grid gap-2">
              <Link href={sameDepartureHref} className={buttonStyles("secondary", true)}>같은 출발지 다른 팟 보기</Link>
              <Link href="/parties" className={buttonStyles("ghost", true)}>전체 목록 보기</Link>
            </div>
            {isCreator && !isClosed ? (
              <form action={updatePartyCapacityAction.bind(null, party.id)} className="space-y-2 rounded-3xl border border-brand-200 bg-brand-50/70 p-4">
                <label className="block text-sm font-semibold text-slateBlue">정원 수정</label>
                <select
                  name="capacity"
                  defaultValue={String(party.capacity)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
                >
                  {[2, 3, 4].map((value) => (
                    <option key={value} value={value} disabled={value < party.joinedCount}>{value}명</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">이미 참여 중인 인원보다 작게 줄일 수는 없어요.</p>
                <button type="submit" className={buttonStyles("secondary", true)}>정원 저장</button>
              </form>
            ) : null}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left marker:hidden">
            <div>
              <h2 className="text-lg font-semibold text-slateBlue">기다리는 동안 들을 노래</h2>
              <p className="mt-1 text-sm text-slate-500">필수 정보는 위에 남기고, 이건 접어뒀어요.</p>
            </div>
            <span className="text-sm font-semibold text-brand-700 group-open:hidden">펼쳐보기</span>
            <span className="hidden text-sm font-semibold text-brand-700 group-open:inline">접기</span>
          </summary>
          <div className="border-t border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-600">
            <div className="space-y-4 rounded-3xl bg-white/80 p-4">
              <div className="space-y-1">
                <p className="font-semibold text-slateBlue">1. 말씀으로 우리 길 - WELOVE</p>
                <p>&quot;영원한 삶으로 우릴 초대 하시니&quot; ♬ ? ♪</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slateBlue">2. 사랑한다는 말로도 위로가 되지 않는 - 브로콜리 너마저</p>
                <p>&quot;정작 힘겨운 날엔 우린 전혀 상관없는 얘기만을 하지&quot; ♬ ? ♪</p>
              </div>
            </div>
          </div>
        </details>
      </Card>
    </div>
  );
}
