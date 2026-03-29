import Link from "next/link";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { StatusPill } from "@/components/ui/status-pill";
import { buttonStyles } from "@/components/ui/button";
import { getPartyList } from "@/lib/queries/data";
import { formatDateTime } from "@/lib/utils";

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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

      <Card>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue">택시팟 목록</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">출발지 텍스트와 날짜 필터로 빠르게 원하는 팟을 찾을 수 있습니다.</p>
          </div>
          <form className="grid gap-3 lg:grid-cols-[1.4fr,1fr,1fr,auto]">
            <input
              name="q"
              defaultValue={q}
              placeholder="출발지 검색"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
            />
            <input
              type="date"
              name="date"
              defaultValue={date}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
            />
            <select
              name="availability"
              defaultValue={availability}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
            >
              <option value="">전체 상태</option>
              <option value="joinable">참여 가능만</option>
            </select>
            <button type="submit" className={buttonStyles("secondary", true)}>
              필터 적용
            </button>
          </form>
        </div>
      </Card>

      {parties.length > 0 ? (
        <div className="grid gap-4">
          {parties.map((party) => (
            <Link key={party.id} href={`/parties/${party.id}`}>
              <Card className="transition hover:-translate-y-1 hover:bg-white">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xl font-semibold text-slateBlue">{party.departure_place_name}</p>
                      <StatusPill status={party.status} />
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>도착지: {party.destination_name}</p>
                      <p>출발 시간: {formatDateTime(party.scheduled_at)}</p>
                      <p>인원: {party.joinedCount}/{party.capacity}명 · 생성자 {party.creatorNickname}</p>
                      {party.departure_detail ? <p>상세 위치: {party.departure_detail}</p> : null}
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 lg:text-right">
                    <p>{party.isJoinable ? "지금 참여 가능" : party.myMembershipStatus ? "내 참여 이력 있음" : "상세에서 상태 확인"}</p>
                    <p className="mt-1">남은 자리 {party.seatsLeft}석</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="조건에 맞는 택시팟이 없어요"
          description={
            availability === "joinable"
              ? "이미 다른 활성 팟에 참여 중이거나, 조건에 맞는 모집 중 팟이 없을 수 있습니다."
              : "필터를 조금 완화하거나 새 택시팟을 만들어보세요."
          }
          actionHref="/parties/new"
          actionLabel="택시팟 만들기"
        />
      )}

      <Link href="/parties/new" className={`${buttonStyles("primary")} fixed bottom-4 right-4 px-5 shadow-lg sm:bottom-6 sm:right-6`}>
        + 새 팟
      </Link>
    </div>
  );
}
