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

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isImmediateParty(scheduledAt: string) {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  return diff <= 20 * 60 * 1000;
}

function buildCreateHref(q: string) {
  const departure = q || "���";
  return `/parties/new?departure=${encodeURIComponent(departure)}&mode=instant`;
}

function PartyListSection({
  title,
  description,
  parties,
}: {
  title: string;
  description: string;
  parties: Awaited<ReturnType<typeof getPartyList>>;
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
        const closingSoon = party.seatsLeft === 1 && party.status === "recruiting";

        return (
          <Card key={party.id} className={`p-5 ${immediate ? "border-brand-300 shadow-lg shadow-brand-200/60" : ""}`}>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/parties/${party.id}`} className="text-lg font-semibold text-slateBlue">{party.departure_place_name}</Link>
                    {urgent ? <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-600">���ؿ�</span> : null}
                    {immediate ? <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-600">�� ���</span> : null}
                    {closingSoon ? <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">���� �ӹ�</span> : null}
                  </div>
                  {party.destination_name !== DEFAULT_DESTINATION.placeName ? <p className="text-sm text-slate-500">{party.destination_name}</p> : null}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${immediate ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600"}`}>
                  {immediate ? "�ٷ� ���" : "����"}
                </span>
              </div>

              <div className="space-y-1 text-sm text-slate-600">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>������: {party.creatorNickname}</span>
                  <ThemeRankBadge rank={party.creatorThemeFunRank} />
                </div>
                {party.sharedRideCount > 0 ? (
                  <p className="text-xs text-brand-700">
                    {formatDate(party.lastRideAtWithCreator ?? new Date().toISOString())}�� {party.creatorNickname}�԰� ���� ž���߰�, ���ݱ��� �� {party.sharedRideCount}�� ���� �����.
                  </p>
                ) : null}
                {party.creatorReviewCount > 0 && party.creatorAverageRating ? (
                  <p className="text-xs text-slate-500">������ �ı� ���: ��� {party.creatorAverageRating} / 5.0 ({party.creatorReviewCount}��)</p>
                ) : null}
                <p>���� �ο� / �ִ� �ο�: {party.joinedCount}/{party.capacity}��</p>
                <p>���� 1�δ� �ݾ�: �� {estimatedShare.toLocaleString()}��</p>
                {!immediate ? <p>��� �ð�: {formatDateTime(party.scheduled_at)}</p> : <p>���� �ٷ� ���̸� ����ϱ� ���ƿ�.</p>}
                {note ? <p>����/�޸�: {note}</p> : null}
              </div>

              {party.isJoinable ? (
                <form action={joinPartyAction.bind(null, party.id)}>
                  <button type="submit" className={buttonStyles("primary", true)}>�ٷ� �����ϱ�</button>
                </form>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
                    ������ ������ �� ���� �������� ���� �� ���´� Ȯ���� �� �־��.
                  </div>
                  <Link href={`/parties/${party.id}`} className={buttonStyles("secondary", true)}>�� ����</Link>
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
  const activeParties = parties.filter((party) => party.status === "recruiting");
  const immediateParties = activeParties.filter((party) => isImmediateParty(party.scheduled_at));
  const reservedParties = activeParties.filter((party) => !isImmediateParty(party.scheduled_at));
  const joinableCount = activeParties.filter((party) => party.isJoinable).length;

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      {message ? <Notice variant="success">{message}</Notice> : null}
      {error ? <Notice variant="error">{error}</Notice> : null}

      <Card className="p-5">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-brand-700">Ž�� ���</p>
            <h1 className="text-2xl font-bold text-slateBlue">{q ? `${q}���� ���` : "��� ����ϳ���?"}</h1>
            <p className="text-sm text-slate-500">�� ����ϴ� �̺��� ���� �����帮��, ������ �ٷ� ������ ���� �� �ְ� �ȳ��ص����.</p>
          </div>

          <form action="/parties" className="space-y-3">
            <input
              name="q"
              defaultValue={q}
              placeholder="����� ���� �Է�"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="submit" className={buttonStyles("primary", true)}>�ٽ� ã��</button>
              <Link href={buildCreateHref(q)} className={buttonStyles("secondary", true)}>�� �������� ���� �����</Link>
            </div>
          </form>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {["���", "�¼���", "�һ翪", "������"].map((station) => (
              <Link key={station} href={`/parties?q=${encodeURIComponent(station)}`} className={`${buttonStyles(q === station ? "primary" : "secondary", true)} text-sm`}>
                {station}
              </Link>
            ))}
          </div>

          {q ? (
            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">���� ��</p>
                <p className="mt-1 text-lg font-semibold text-slateBlue">{activeParties.length}��</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">���� ���� ����</p>
                <p className="mt-1 text-lg font-semibold text-brand-700">{joinableCount}��</p>
              </div>
            </div>
          ) : null}

          {!chooser && q ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">������� �ٲٰ� ������ �Ʒ� ��ư�� ��������.</p>
              <Link href="/parties?chooser=1" className="text-sm font-semibold text-brand-700 underline underline-offset-4">����� �ٲٱ�</Link>
            </div>
          ) : null}
        </div>
      </Card>

      {chooser || !q ? (
        <Card className="p-5">
          <p className="text-sm text-slate-500">���� ���� �����ų� ���� �Է��ؼ� �ٷ� ����� �� �� �־��.</p>
        </Card>
      ) : null}

      {q ? activeParties.length > 0 ? (
        <div className="space-y-5">
          <PartyListSection title="�� ���" description="20�� �ȿ� ����ϴ� ���̿���. ���� ���� Ȯ���غ�����." parties={immediateParties} />
          <PartyListSection title="���� ���" description="���� �ڿ� ����ϴ� ���̿���." parties={reservedParties} />
        </div>
      ) : (
        <EmptyState title="���� ���� ���� �ý����� �����" description="���� Ż ����� ���ٸ� �ٷ� ������ ��� ���� Ÿ�̹��� ��ƺ�����." actionHref={buildCreateHref(q)} actionLabel="�ý��� �����" />
      ) : null}
    </div>
  );
}
