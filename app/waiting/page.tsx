import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { buttonStyles } from "@/components/ui/button";
import { RandomMenuPicker } from "@/components/waiting/random-menu-picker";
import { addGuestbookEntryAction, toggleGuestbookLikeAction } from "@/lib/actions/app-actions";
import { getWaitingPageData } from "@/lib/queries/data";
import { formatDateTime } from "@/lib/utils";

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function WaitingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = searchParams ? await searchParams : {};
  const message = pickParam(query.message);
  const error = pickParam(query.error);

  let waitingData: Awaited<ReturnType<typeof getWaitingPageData>> | null = null;
  let loadError: string | null = null;

  try {
    waitingData = await getWaitingPageData();
  } catch {
    loadError = "방명록 테이블이 아직 준비되지 않았어요. Supabase migration 적용 후 다시 확인해주세요.";
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      {message ? <Notice variant="success">{message}</Notice> : null}
      {error ? <Notice variant="error">{error}</Notice> : null}
      {loadError ? <Notice variant="warning">{loadError}</Notice> : null}

      <Card className="bg-mesh-glow p-6 sm:p-8">
        <div className="space-y-3 text-center">
          <p className="text-3xl">𐔌՞⁔•͈ ·̫ •͈⁔՞𐦯</p>
          <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue sm:text-4xl">
            오늘 뭐먹지??
          </h1>
          <p className="text-sm text-slate-500 sm:text-base">사장님들의 제휴를 기다리고 있어요</p>
        </div>
      </Card>

      <Card className="p-5">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slateBlue">기다리는 동안 이런 건 어때요</h2>
            <p className="mt-1 text-sm text-slate-500">택시 오기 전에 잠깐 보고 웃고 지나갈 수 있는 공간이에요.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <RandomMenuPicker />
            <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <p className="font-semibold text-slateBlue">제휴 대기중</p>
              <p className="mt-2">언젠가 학교 앞 맛집들이 이 칸을 가득 채워주길 기다리는 중입니다.</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slateBlue">한 줄 방명록</h2>
            <p className="mt-1 text-sm text-slate-500">지금 땡기는 메뉴나 아무 말이나 한 줄 남겨보세요.</p>
          </div>

          {waitingData?.profile ? (
            <form action={addGuestbookEntryAction} className="space-y-3">
              <textarea
                name="message"
                maxLength={160}
                placeholder="예: 오늘은 마라탕이 너무 먹고 싶다..."
                className="min-h-28 w-full rounded-3xl border border-brand-200 bg-white px-4 py-4 text-sm text-slateBlue outline-none ring-brand-200 transition focus:ring"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">{waitingData.profile.nickname} 님으로 남겨져요. 160자 이내</p>
                <button type="submit" className={buttonStyles("primary")}>남기기</button>
              </div>
            </form>
          ) : (
            <div className="rounded-3xl border border-brand-200 bg-brand-50/70 p-4 text-sm text-slate-600">
              <p>방명록을 쓰려면 로그인해 주세요.</p>
              <Link href="/login" className={`${buttonStyles("secondary")} mt-3`}>
                로그인하러 가기
              </Link>
            </div>
          )}

          <div className="space-y-3">
            {(waitingData?.entries ?? []).length > 0 ? (
              waitingData?.entries.map((entry) => (
                <div key={entry.id} className="rounded-3xl border border-slate-200 bg-white/90 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slateBlue">{entry.nickname}</p>
                    <p className="text-[11px] text-slate-400">{formatDateTime(entry.created_at)}</p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{entry.message}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-400">좋아요 {entry.likeCount}개</p>
                    {waitingData.profile ? (
                      <form action={toggleGuestbookLikeAction.bind(null, entry.id)}>
                        <button type="submit" className={`${buttonStyles(entry.likedByMe ? "primary" : "secondary")} px-3 py-2 text-xs`}>
                          {entry.likedByMe ? "좋아요 취소" : "좋아요"}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-brand-200 bg-brand-50/50 p-4 text-sm text-slate-500">
                아직 남겨진 글이 없어요. 첫 한 줄을 남겨보세요.
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
