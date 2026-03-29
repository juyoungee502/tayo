import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { StatusPill } from "@/components/ui/status-pill";
import { buttonStyles } from "@/components/ui/button";
import { cancelPartyAction, joinPartyAction, leavePartyAction } from "@/lib/actions/app-actions";
import { getOptionalAuthContext } from "@/lib/queries/auth";
import { getPartyDetail } from "@/lib/queries/data";
import { formatDateTime } from "@/lib/utils";

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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
  const shouldPromptLogin = !user && isFuture && seatsLeft > 0 && !isClosed;

  return (
    <div className="space-y-6">
      {message ? <Notice variant="success">{message}</Notice> : null}
      {error ? <Notice variant="error">{error}</Notice> : null}
      {party.hasAnotherActiveParty && !isJoined ? <Notice variant="warning">이미 다른 활성 택시팟에 참여 중이라 새 팟에 바로 합류할 수 없습니다.</Notice> : null}
      {hasMembershipHistory && !isJoined ? <Notice variant="info">이 택시팟에는 이미 참여 이력이 있어 다시 참여 버튼을 노출하지 않습니다.</Notice> : null}
      {party.isFeedbackDue && !party.hasSubmittedFeedback ? <Notice variant="warning">피드백 기한이 도래했습니다. <Link href={`/feedback/${party.id}`} className="font-semibold underline">후기/신고 페이지로 이동</Link></Notice> : null}

      <Card className="bg-mesh-glow">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue">{party.departure_place_name}</h1>
              <StatusPill status={party.status} />
            </div>
            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p>도착지: {party.destination_name}</p>
              <p>출발 시간: {formatDateTime(party.scheduled_at)}</p>
              <p>현재 인원 / 최대 인원: {party.joinedCount}/{party.capacity}명</p>
              <p>남은 자리 수: {seatsLeft}석</p>
              <p>생성자: {party.creator?.nickname ?? "알 수 없음"}</p>
              {party.departure_detail ? <p className="sm:col-span-2">상세 위치: {party.departure_detail}</p> : null}
              {party.note ? <p className="sm:col-span-2">메모: {party.note}</p> : null}
            </div>
          </div>

          <div className="w-full max-w-sm space-y-3">
            {canJoin ? <form action={joinPartyAction.bind(null, party.id)}><button type="submit" className={buttonStyles("primary", true)}>참여하기</button></form> : null}
            {canLeave ? <form action={leavePartyAction.bind(null, party.id)}><button type="submit" className={buttonStyles("secondary", true)}>참여 취소</button></form> : null}
            {canCancel ? <form action={cancelPartyAction.bind(null, party.id)}><button type="submit" className={buttonStyles("danger", true)}>파티 취소</button></form> : null}
            {shouldPromptLogin ? <Link href="/login" className={buttonStyles("primary", true)}>로그인 후 참여하기</Link> : null}
            {!canJoin && !canLeave && !canCancel && !shouldPromptLogin ? <Notice variant="info">현재 상태에서는 추가 액션이 없습니다. 아래 정보로 상태를 확인해주세요.</Notice> : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr,0.9fr]">
        <Card>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slateBlue">참여자 목록</h2>
              <p className="text-sm text-slate-500">작성자는 자동으로 첫 번째 멤버로 포함됩니다.</p>
            </div>
            <p className="text-sm text-slate-500">남은 자리 {seatsLeft}석</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {party.members.map((participant) => (
              <div key={participant.profile.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slateBlue">{participant.profile.nickname}</p>
                    <p className="text-xs text-slate-500">{participant.profile.school}</p>
                  </div>
                  <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{participant.membership.user_id === party.creator_id ? "작성자" : participant.membership.status}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slateBlue">이 팟에서 바로 확인할 것</h2>
              <p className="mt-1 text-sm text-slate-500">참여 전후에 가장 필요한 정보만 짧게 정리했습니다.</p>
            </div>
            <div className="space-y-3 rounded-3xl bg-slate-50/80 p-4 text-sm text-slate-600">
              <p>모집 상태: {party.status === "recruiting" ? "모집 중" : party.status === "full" ? "마감" : "운행 완료"}</p>
              <p>참여 가능 여부: {canJoin || shouldPromptLogin ? "가능" : "현재 불가"}</p>
              <p>내 상태: {isJoined ? "참여 중" : hasMembershipHistory ? "참여 이력 있음" : user ? "아직 미참여" : "로그인 전"}</p>
              <p>다른 활성 팟 참여 여부: {party.hasAnotherActiveParty ? "있음" : "없음"}</p>
            </div>
            <Link href="/parties" className={buttonStyles("secondary", true)}>다른 택시팟도 보기</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}