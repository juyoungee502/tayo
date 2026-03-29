import Link from "next/link";

import { joinPartyAction } from "@/lib/actions/app-actions";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { StatusPill } from "@/components/ui/status-pill";
import { getPartyList } from "@/lib/queries/data";
import { formatDateTime } from "@/lib/utils";

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getCardTone(status: "recruiting" | "full" | "completed" | "expired" | "cancelled") {
  switch (status) {
    case "recruiting":
      return "border-brand-200 bg-white";
    case "full":
      return "border-brand-200/80 bg-brand-50/50";
    case "completed":
    case "expired":
      return "border-slate-200 bg-slate-50/80 opacity-90";
    case "cancelled":
      return "border-slate-200 bg-slate-50/70 opacity-75";
    default:
      return "border-slate-200 bg-white";
  }
}

function getAvailabilityLabel(party: Awaited<ReturnType<typeof getPartyList>>[number]) {
  if (party.isJoinable) return "지금 바로 참여 가능";
  if (party.myMembershipStatus === "joined") return "이미 참여 중인 팟";
  if (party.myMembershipStatus) return "내 참여 이력 있음";
  if (party.status === "full") return "정원 마감";
  if (party.status === "completed" || party.status === "expired") return "운행 완료";
  return "상세에서 확인";
}

export default async function PartiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = pickParam(params.q) ?? "";
  const date = pickParam(params.date) ?? "";
  const availability = pickParam(params.availability) ?? "";
  const message = pickParam(params.message);
  const error = pickParam(params.error);
  const parties = await getPartyList({ q, date, availability });

  return (
    <div className="space-y-6">
      {message ? <Notice variant="success">{message}</Notice> : null}
      {error ? <Notice variant="error">{error}</Notice> : null}

      <Card className="bg-mesh-glow">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-brand-700">빠르게 골라서 바로 참여하기</p>
            <div>
              <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue">택시팟 찾기</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">출발지와 날짜만 좁히면 모집 중인 팟을 먼저 보여주고, 바로 참여할 수 있게 정리해두었습니다.</p>
            </div>
          </div>
          <form className="grid gap-3 lg:grid-cols-[1.5fr,1fr,1fr,auto]">
            <input name="q" defaultValue={q} placeholder="출발지 또는 상세 위치 검색" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring" />
            <input type="date" name="date" defaultValue={date} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring" />
            <select name="availability" defaultValue={availability} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring">
              <option value="">전체 보기</option>
              <option value="joinable">지금 참여 가능한 팟만</option>
            </select>
            <button type="submit" className={buttonStyles("primary", true)}>찾기</button>
          </form>
        </div>
      </Card>

      {parties.length > 0 ? (
        <div className="grid gap-4">
          {parties.map((party) => (
            <Card key={party.id} className={`transition hover:-translate-y-1 ${getCardTone(party.status)}`}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xl font-semibold text-slateBlue">{party.departure_place_name}</p>
                    <StatusPill status={party.status} />
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-500">{getAvailabilityLabel(party)}</span>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <p>도착지: {party.destination_name}</p>
                    <p>출발 시간: {formatDateTime(party.scheduled_at)}</p>
                    <p>현재 인원 / 최대 인원: {party.joinedCount}/{party.capacity}명</p>
                    <p>남은 자리 수: {party.seatsLeft}석</p>
                    {party.departure_detail ? <p className="sm:col-span-2">상세 위치: {party.departure_detail}</p> : null}
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 lg:w-52">
                  {party.isJoinable ? (
                    <form action={joinPartyAction.bind(null, party.id)}>
                      <button type="submit" className={buttonStyles("primary", true)}>참여하기</button>
                    </form>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-500">
                      {party.status === "recruiting" ? "상세에서 조건을 확인해보세요." : party.status === "full" ? "정원이 가득 찼어요." : "이 팟은 참여가 끝난 상태예요."}
                    </div>
                  )}
                  <Link href={`/parties/${party.id}`} className={buttonStyles("secondary", true)}>상세 보기</Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="조건에 맞는 택시팟이 없어요" description={availability === "joinable" ? "지금 참여 가능한 팟이 없으면 필터를 조금 넓히거나 직접 모집을 시작해보세요." : "아직 맞는 팟이 없다면 바로 새 택시팟을 만들어서 모집을 시작할 수 있습니다."} actionHref="/parties/new" actionLabel="택시팟 만들기" />
      )}
    </div>
  );
}