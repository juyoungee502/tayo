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
  const canNudge = Boolean(user) && !isCreator && Boolean(isJoined) && isFuture && !isClosed;
  const canMarkDeparted = Boolean(user) && isCreator && !isClosed;
  const canSaveFindNote = Boolean(user) && Boolean(party.currentUserMembership) && !isClosed;
  const currentUserNote = party.members.find((participant) => participant.profile.id === user?.id)?.note ?? "";
  const shouldPromptLogin = !user && isFuture && seatsLeft > 0 && !isClosed;
  const urgent = isUrgentParty(party.note);
  const cleanNote = stripUrgentMarker(party.note);
  const estimatedShare = estimateTaxiShare(party.joinedCount, party.capacity, party.departure_place_name);
  const summaryStatus = shouldPromptLogin
    ? "�α��� �� ���� ����"
    : canJoin
      ? "���� �ٷ� ���� ����"
      : isJoined
        ? "���� ���� ��"
        : hasMembershipHistory
          ? "�̹� ���� �̷� ����"
          : isClosed
            ? "����� ��"
            : seatsLeft === 0
              ? "���� ����"
              : "�� Ȯ�� �ʿ�";
  const nextActionLabel = shouldPromptLogin
    ? "�α��� �� �����ϱ�"
    : canJoin
      ? "�ٷ� �����ϱ�"
      : canLeave
        ? "���� ����ϱ�"
        : canMarkDeparted
          ? "��� �Ϸ� ó���ϱ�"
          : canNudge
            ? "�����ڿ��� ��� ��û�ϱ�"
            : "����� ���� Ȯ�� �ܰ�";

  return (
    <div className="space-y-6">
      {message ? <Notice variant="success">{message}</Notice> : null}
      {error ? <Notice variant="error">{error}</Notice> : null}
      {party.hasAnotherActiveParty && !isJoined ? <Notice variant="warning">�̹� �ٸ� Ȱ�� �ý��̿� ���� ���̶� �� �̿� �ٷ� �շ��� �� �����ϴ�.</Notice> : null}
      {hasMembershipHistory && !isJoined ? <Notice variant="info">�� �ý��̿��� �̹� ���� �̷��� �־� �ٽ� ���� ��ư�� �������� �ʽ��ϴ�.</Notice> : null}
      {party.isFeedbackDue && !party.hasSubmittedFeedback ? <Notice variant="warning">�ǵ�� ������ �����߽��ϴ�. <Link href={`/feedback/${party.id}`} className="font-semibold underline">�ı�/�Ű� �������� �̵�</Link></Notice> : null}
      {!party.isFeedbackDue && party.status === "completed" && party.currentUserMembership ? <Notice variant="info">������ �Ϸ�ư�, �ǵ���� ��� 1�ð� �ں��� �����ϴ�. <Link href={`/feedback/${party.id}`} className="font-semibold underline">�ǵ�� ������ �ٷΰ���</Link></Notice> : null}

      <Card className="bg-mesh-glow">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue">{party.departure_place_name}</h1>
              <StatusPill status={party.status} />
              {urgent ? <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">���ؿ�</span> : null}
              {seatsLeft === 1 && party.status === "recruiting" ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">���� �ӹ�</span> : null}
            </div>
            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p>������: {party.destination_name}</p>
              <p>��� �ð�: {formatDateTime(party.scheduled_at)}</p>
              <p>���� �ο� / �ִ� �ο�: {party.joinedCount}/{party.capacity}��</p>
              <p>���� 1�δ� �ݾ�: �� {estimatedShare.toLocaleString()}��</p>
              <p>���� �ڸ� ��: {seatsLeft}��</p>
              <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                <p>������: {party.creator?.nickname ?? "�� �� ����"}</p>
                <ThemeRankBadge rank={party.creatorThemeFunRank} />
              </div>
              {party.creatorReviewCount > 0 && party.creatorAverageRating ? <p>�ı� ���: {party.creatorAverageRating} / 5.0 ({party.creatorReviewCount}��)</p> : null}
              {party.departure_detail ? <p className="sm:col-span-2">�� ��ġ: {party.departure_detail}</p> : null}
              {cleanNote ? <p className="sm:col-span-2">����/�޸�: {cleanNote}</p> : null}
            </div>
          </div>

          <div className="w-full max-w-sm space-y-3">
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-4">
              <p className="text-sm font-semibold text-slateBlue">���� �� �̿��� �ٷ� �� ��</p>
              <p className="mt-2 text-sm text-slate-500">���� �߿��� ���� �ൿ�� ���� �����帱�Կ�.</p>
              <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50/80 p-3 text-sm text-slate-600">
                <p>��߱���: {formatRelativeStatus(party.scheduled_at)}</p>
                <p>�� ����: {summaryStatus}</p>
                <p>���� �ൿ: {nextActionLabel}</p>
              </div>
            </div>

            {canJoin ? <form action={joinPartyAction.bind(null, party.id)}><button type="submit" className={buttonStyles("primary", true)}>�ٷ� �����ϱ�</button></form> : null}
            {canLeave ? <form action={leavePartyAction.bind(null, party.id)}><button type="submit" className={buttonStyles("secondary", true)}>���� ���</button></form> : null}
            {canNudge ? <form action={nudgePartyAction.bind(null, party.id)}><button type="submit" className={buttonStyles("secondary", true)}>���� ����ؿ�</button></form> : null}
            {canMarkDeparted ? <form action={markPartyDepartedAction.bind(null, party.id)}><button type="submit" className={buttonStyles("primary", true)}>����߾��!</button></form> : null}
            {canCancel ? <form action={cancelPartyAction.bind(null, party.id)}><button type="submit" className={buttonStyles("danger", true)}>��Ƽ ���</button></form> : null}
            <SharePartyButton partyId={party.id} />
            {shouldPromptLogin ? <Link href="/login" className={buttonStyles("primary", true)}>�α��� �� �����ϱ�</Link> : null}
            {!canJoin && !canLeave && !canCancel && !canNudge && !canMarkDeparted && !shouldPromptLogin ? <Notice variant="info">���� ���¿����� �߰� �׼��� �����ϴ�. �Ʒ� ������ ���¸� Ȯ�����ּ���.</Notice> : null}
          </div>
        </div>
      </Card>

      {isCreator && !isClosed ? (
        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slateBlue">��� üũ����Ʈ</h2>
              <p className="mt-1 text-sm text-slate-500">��� �� �غ� ���¸� ������ ǥ���ص� �� �־��.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <form action={updateDepartureChecklistAction.bind(null, party.id)} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <input type="hidden" name="field" value="taxi_called" />
                <input type="hidden" name="value" value={party.taxi_called ? "false" : "true"} />
                <p className="text-sm font-semibold text-slateBlue">�ý� ȣ��</p>
                <p className="mt-1 text-sm text-slate-500">{party.taxi_called ? "�ýø� �̹� �ҷ����." : "���� ȣ�� ���̿���."}</p>
                <button type="submit" className={`${buttonStyles("secondary")} mt-3 w-full`}>
                  {party.taxi_called ? "ȣ�� ������ �ǵ�����" : "�ý� ��Ҿ��"}
                </button>
              </form>
              <form action={updateDepartureChecklistAction.bind(null, party.id)} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <input type="hidden" name="field" value="everyone_ready" />
                <input type="hidden" name="value" value={party.everyone_ready ? "false" : "true"} />
                <p className="text-sm font-semibold text-slateBlue">���� ����</p>
                <p className="mt-1 text-sm text-slate-500">{party.everyone_ready ? "�� �𿴾��." : "���� ���̴� ���̿���."}</p>
                <button type="submit" className={`${buttonStyles("secondary")} mt-3 w-full`}>
                  {party.everyone_ready ? "�ٽ� Ȯ�������� �ٲٱ�" : "�� �𿴾��"}
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
              <h2 className="text-xl font-semibold text-slateBlue">���� ã�� �޸�</h2>
              <p className="mt-1 text-sm text-slate-500">�������̳� �� �ִ� ��ġ�� ª�� ���ܵθ� ���� ã�� ��������.</p>
            </div>
            <form action={savePartyMemberNoteAction.bind(null, party.id)} className="space-y-3">
              <textarea
                name="note"
                defaultValue={currentUserNote}
                maxLength={80}
                placeholder="��: ���� �е� �԰� ���� �տ��� ��ٸ��� �־��"
                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
              />
              <button type="submit" className={buttonStyles("secondary")}>�޸� ����</button>
            </form>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr,0.9fr]">
        <Card>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slateBlue">������ ���</h2>
              <p className="text-sm text-slate-500">�ۼ��ڴ� �ڵ����� ù ��° ����� ���Ե˴ϴ�.</p>
            </div>
            <p className="text-sm text-slate-500">���� �ڸ� {seatsLeft}��</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {party.members.map((participant) => (
              <div key={participant.profile.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slateBlue">{participant.profile.nickname}</p>
                      <ThemeRankBadge rank={participant.themeFunRank} />
                    </div>
                    <p className="text-xs text-slate-500">{participant.profile.school}</p>
                    {participant.profile.department || participant.profile.student_number ? (
                      <p className="text-xs text-slate-400">{[participant.profile.department, participant.profile.student_number].filter(Boolean).join(" �� ")}</p>
                    ) : null}
                  </div>
                  <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{participant.membership.user_id === party.creator_id ? "�ۼ���" : participant.membership.status}</p>
                </div>
                {participant.note ? <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs text-slate-600">ã�� �޸�: {participant.note}</p> : null}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slateBlue">�� �뷡��õ</h2>
              <p className="mt-1 text-sm text-slate-500">��ٸ��� ���� ���� ������ ���� ����Դϴ�.</p>
            </div>
            <div className="space-y-4 rounded-3xl bg-slate-50/80 p-4 text-sm text-slate-600">
              <div className="space-y-1">
                <p className="font-semibold text-slateBlue">1. �������� �츮 �� - WELOVE</p>
                <p>&quot;������ ������ �츱 �ʴ� �Ͻô�&quot; �� ? �� ��</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slateBlue">2. ����Ѵٴ� ���ε� ���ΰ� ���� �ʴ� - ����ݸ� �ʸ���</p>
                <p>&quot;���� ���ܿ� ���� �츰 ���� ������� ��⸸�� ����&quot; �� ? ��</p>
              </div>
            </div>
            {isCreator && !isClosed ? (
              <form action={updatePartyCapacityAction.bind(null, party.id)} className="space-y-2 rounded-3xl border border-brand-200 bg-brand-50/70 p-4">
                <label className="block text-sm font-semibold text-slateBlue">���� ����</label>
                <select name="capacity" defaultValue={String(party.capacity)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring">
                  {[2, 3, 4].map((value) => (
                    <option key={value} value={value} disabled={value < party.joinedCount}>{value}��</option>
                  ))}
                </select>
                <button type="submit" className={buttonStyles("secondary", true)}>���� ����</button>
              </form>
            ) : null}
            <Link href="/parties" className={buttonStyles("secondary", true)}>�ٸ� �ý��̵� ����</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
