import Link from "next/link";

import { joinPartyAction } from "@/lib/actions/app-actions";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { getPartyList } from "@/lib/queries/data";
import { DEFAULT_DESTINATION } from "@/lib/constants";
import { estimateTaxiShare, formatDateTime, isUrgentParty, stripUrgentMarker } from "@/lib/utils";

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
  const parties = await getPartyList({ q, availability: "joinable" });
  const activeParties = parties
    .filter((party) => party.status === "recruiting")
    .sort((a, b) => Number(isImmediateParty(b.scheduled_at)) - Number(isImmediateParty(a.scheduled_at)));

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      {message ? <Notice variant="success">{message}</Notice> : null}
      {error ? <Notice variant="error">{error}</Notice> : null}

      <Card className="p-5">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-brand-700">출발지 선택</p>
            <h1 className="text-2xl font-bold text-slateBlue">{q ? `${q}에서 출발` : "어디서 출발하나요?"}</h1>
          </div>

          {chooser || !q ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Link href="/parties?q=부천역" className={`${buttonStyles("secondary", true)} text-sm`}>부천역</Link>
                <Link href="/parties?q=송내역" className={`${buttonStyles("secondary", true)} text-sm`}>송내역</Link>
                <Link href="/parties?q=온수역" className={`${buttonStyles("secondary", true)} text-sm`}>온수역</Link>
                <Link href="/parties?q=역곡역" className={`${buttonStyles("secondary", true)} text-sm`}>역곡역</Link>
              </div>

              <form className="space-y-2">
                <input name="q" placeholder="직접 입력" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring" />
                <button type="submit" className={buttonStyles("primary", true)}>결과 보기</button>
              </form>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">바로 출발 가능한 팟을 먼저 보여드려요.</p>
              <Link href="/parties?chooser=1" className="text-sm font-semibold text-brand-700 underline underline-offset-4">출발지 바꾸기</Link>
            </div>
          )}
        </div>
      </Card>

      {q ? activeParties.length > 0 ? (
        <div className="space-y-3">
          {activeParties.map((party) => {
            const immediate = isImmediateParty(party.scheduled_at);
            const estimatedShare = estimateTaxiShare(party.joinedCount, party.capacity, party.departure_place_name);
            const urgent = isUrgentParty(party.note);
            const note = stripUrgentMarker(party.note);

            return (
              <Card key={party.id} className="p-5">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/parties/${party.id}`} className="text-lg font-semibold text-slateBlue">{party.departure_place_name}</Link>
                        {urgent ? <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-600">급해요</span> : null}
                      </div>
                      {party.destination_name !== DEFAULT_DESTINATION.placeName ? <p className="text-sm text-slate-500">{party.destination_name}</p> : null}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${immediate ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"}`}>
                      {immediate ? "바로 출발" : "예약"}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-slate-600">
                    <p>현재 인원 / 최대 인원: {party.joinedCount}/{party.capacity}명</p>
                    <p>예상 1인당 금액: 약 {estimatedShare.toLocaleString()}원</p>
                    {!immediate ? <p>출발 시간: {formatDateTime(party.scheduled_at)}</p> : null}
                    {note ? <p>계좌/메모: {note}</p> : null}
                  </div>

                  <form action={joinPartyAction.bind(null, party.id)}>
                    <button type="submit" className={buttonStyles("primary", true)}>바로 참여하기</button>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="지금 모집 중인 택시팟이 없어요" description="바로 참여할 수 있는 팟이 없다면 직접 모집을 시작해보세요." actionHref={buildCreateHref(q)} actionLabel="택시팟 만들기" />
      ) : null}
    </div>
  );
}

