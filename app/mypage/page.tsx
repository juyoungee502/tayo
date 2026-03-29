import Link from "next/link";

import { DeletionRequestForm } from "@/components/forms/deletion-request-form";
import { ProfileForm } from "@/components/forms/profile-form";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { buttonStyles } from "@/components/ui/button";
import { getMyPageData } from "@/lib/queries/data";
import { formatDateTime } from "@/lib/utils";

export default async function MyPage() {
  const { profile, history, deletionRequest } = await getMyPageData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue">마이페이지</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">내 프로필, 이용 이력, 최소 탈퇴 요청 흐름까지 한 곳에서 관리합니다.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr,1fr]">
        <Card>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slateBlue">기본 정보</p>
              <p className="mt-1 text-sm text-slate-500">학교 인증 후 자동 생성된 프로필입니다.</p>
            </div>
            <div className="grid gap-3 rounded-3xl bg-slate-50/80 p-4 text-sm text-slate-600">
              <div>
                <p className="text-xs text-slate-500">이메일</p>
                <p className="font-semibold text-slateBlue">{profile.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">학교</p>
                <p className="font-semibold text-slateBlue">{profile.school}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">권한</p>
                <p className="font-semibold text-slateBlue">{profile.role === "admin" ? "관리자" : "일반 사용자"}</p>
              </div>
            </div>
            <ProfileForm nickname={profile.nickname} />
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slateBlue">탈퇴 요청</p>
              <p className="mt-1 text-sm text-slate-500">MVP에서는 관리자 확인형 요청 흐름으로 최소한의 탈퇴 프로세스를 제공합니다.</p>
            </div>
            {deletionRequest ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">이미 탈퇴 요청이 접수되어 있습니다.</p>
                <p className="mt-1">접수 시간: {formatDateTime(deletionRequest.created_at)}</p>
              </div>
            ) : null}
            <DeletionRequestForm hasOpenRequest={Boolean(deletionRequest && deletionRequest.status === "open")} />
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slateBlue">이용 히스토리</h2>
            <p className="text-sm text-slate-500">참여하거나 생성한 택시팟 기록을 확인할 수 있습니다.</p>
          </div>
          <Link href="/parties" className={buttonStyles("secondary")}>
            목록으로 이동
          </Link>
        </div>

        {history.length > 0 ? (
          <div className="grid gap-4">
            {history.map((party) => (
              <Link key={party.id} href={`/parties/${party.id}`}>
                <Card className="transition hover:bg-white">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-semibold text-slateBlue">{party.departure_place_name}</p>
                        <StatusPill status={party.status} />
                      </div>
                      <p className="text-sm text-slate-500">{party.destination_name}</p>
                      <p className="text-sm text-slate-600">{formatDateTime(party.scheduled_at)}</p>
                    </div>
                    <p className="text-sm text-slate-500">내 상태: {party.membershipStatus ?? "기록 없음"}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="이용 이력이 아직 없어요"
            description="첫 택시팟에 참여하거나 만들어보면 여기에서 기록을 확인할 수 있습니다."
            actionHref="/parties"
            actionLabel="택시팟 보러가기"
          />
        )}
      </div>
    </div>
  );
}
