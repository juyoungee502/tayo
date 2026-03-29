import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { StatusPill } from "@/components/ui/status-pill";
import { buttonStyles } from "@/components/ui/button";
import { cancelPartyAction, joinPartyAction, leavePartyAction } from "@/lib/actions/app-actions";
import { requireAuth } from "@/lib/queries/auth";
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
  const { user } = await requireAuth();
  const party = await getPartyDetail(id);

  if (!party) {
    notFound();
  }

  const query = await searchParams;
  const message = pickParam(query.message);
  const error = pickParam(query.error);
  const isCreator = party.creator_id === user.id;
  const isJoined = party.currentUserMembership?.status === "joined";
  const hasMembershipHistory = Boolean(party.currentUserMembership);
  const isFuture = new Date(party.scheduled_at).getTime() > Date.now();
  const seatsLeft = Math.max(party.capacity - party.joinedCount, 0);
  const canJoin =
    !isCreator &&
    !hasMembershipHistory &&
    isFuture &&
    seatsLeft > 0 &&
    !party.hasAnotherActiveParty &&
    party.status !== "completed" &&
    party.status !== "cancelled";
  const canLeave = !isCreator && Boolean(isJoined) && isFuture;
  const canCancel = isCreator && isFuture && party.status !== "cancelled" && party.status !== "completed";

  return (
    <div className="space-y-6">
      {message ? <Notice variant="success">{message}</Notice> : null}
      {error ? <Notice variant="error">{error}</Notice> : null}
      {party.hasAnotherActiveParty && !isJoined ? (
        <Notice variant="warning">이미 다른 활성 택시팟에 참여 중이라 새 팟에 바로 합류할 수 없습니다.</Notice>
      ) : null}
      {hasMembershipHistory && !isJoined ? (
        <Notice variant="info">이 택시팟에는 이미 참여 이력이 있어 다시 참여 버튼을 노출하지 않습니다.</Notice>
      ) : null}
      {party.isFeedbackDue && !party.hasSubmittedFeedback ? (
        <Notice variant="warning">
          피드백 기한이 도래했습니다. <Link href={`/feedback/${party.id}`} className="font-semibold underline">후기/신고 페이지로 이동</Link>
        </Notice>
      ) : null}

      <Card className="bg-mesh-glow">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue">{party.departure_place_name}</h1>
              <StatusPill status={party.status} />
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p>도착지: {party.destination_name}</p>
              <p>출발 시간: {formatDateTime(party.scheduled_at)}</p>
              <p>정원: {party.joinedCount}/{party.capacity}명</p>
              <p>생성자: {party.creator?.nickname ?? "알 수 없음"}</p>
              {party.departure_detail ? <p>상세 위치: {party.departure_detail}</p> : null}
              {party.note ? <p>메모: {party.note}</p> : null}
            </div>
          </div>

          <div className="w-full max-w-sm space-y-3">
            {canJoin ? (
              <form action={joinPartyAction.bind(null, party.id)}>
                <button type="submit" className={buttonStyles("primary", true)}>
                  참여하기
                </button>
              </form>
            ) : null}
            {canLeave ? (
              <form action={leavePartyAction.bind(null, party.id)}>
                <button type="submit" className={buttonStyles("secondary", true)}>
                  참여 취소
                </button>
              </form>
            ) : null}
            {canCancel ? (
              <form action={cancelPartyAction.bind(null, party.id)}>
                <button type="submit" className={buttonStyles("danger", true)}>
                  파티 취소
                </button>
              </form>
            ) : null}
            {!canJoin && !canLeave && !canCancel ? (
              <Notice variant="info">현재 상태에서는 추가 액션이 없습니다. 참여 가능 조건을 확인해주세요.</Notice>
            ) : null}
          </div>
        </div>
      </Card>

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
                <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {participant.membership.user_id === party.creator_id ? "작성자" : participant.membership.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
