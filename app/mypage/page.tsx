import Link from "next/link";

import { DeletionRequestForm } from "@/components/forms/deletion-request-form";
import { ProfileForm } from "@/components/forms/profile-form";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { buttonStyles } from "@/components/ui/button";
import { getMyPageData } from "@/lib/queries/data";
import { formatDateTime } from "@/lib/utils";

const ACTIVE_STATUSES = new Set(["recruiting", "full"]);

export default async function MyPage() {
  const { profile, history, deletionRequest } = await getMyPageData();
  const activeParties = history.filter((party) => party.membershipStatus === "joined" && ACTIVE_STATUSES.has(party.status));
  const createdParties = history.filter((party) => party.creator_id === profile.id);
  const joinedParties = history.filter((party) => party.creator_id !== profile.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue">마이페이지</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">내 프로필과 현재 탑승 상태, 내가 만든 팟과 참여 이력을 한 번에 확인할 수 있어요.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slateBlue">내 참여 현황</p>
                <p className="mt-1 text-sm text-slate-500">지금 참여 중인 택시팟을 가장 먼저 보여드려요.</p>
              </div>
              <p className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">활성 {activeParties.length}건</p>
            </div>
            {activeParties.length > 0 ? (
              <div className="grid gap-3">
                {activeParties.map((party) => (
                  <Link key={party.id} href={`/parties/${party.id}`}>
                    <div className="rounded-3xl border border-brand-200 bg-brand-50/60 p-4 transition hover:bg-white">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-slateBlue">{party.departure_place_name}</p>
                          <p className="text-sm text-slate-500">{party.destination_name}</p>
                          <p className="text-sm text-slate-600">{formatDateTime(party.scheduled_at)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusPill status={party.status} />
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">참여 중</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="지금 참여 중인 팟이 없어요" description="목록에서 바로 참여하거나 새 택시팟을 만들어 이동을 맞춰보세요." actionHref="/parties" actionLabel="택시팟 보러가기" />
            )}
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slateBlue">기본 정보</p>
              <p className="mt-1 text-sm text-slate-500">프로필에 학과, 학번, 상태메시지도 함께 적어둘 수 있어요.</p>
            </div>
            <div className="grid gap-3 rounded-3xl bg-slate-50/80 p-4 text-sm text-slate-600">
              <div><p className="text-xs text-slate-500">이메일</p><p className="font-semibold text-slateBlue">{profile.email}</p></div>
              <div><p className="text-xs text-slate-500">학교</p><p className="font-semibold text-slateBlue">{profile.school}</p></div>
              <div><p className="text-xs text-slate-500">학과</p><p className="font-semibold text-slateBlue">{profile.department ?? "아직 없음"}</p></div>
              <div><p className="text-xs text-slate-500">학번</p><p className="font-semibold text-slateBlue">{profile.student_number ?? "아직 없음"}</p></div>
              <div><p className="text-xs text-slate-500">상태메시지</p><p className="font-semibold text-slateBlue">{profile.profile_message ?? "아직 없음"}</p></div>
              <div><p className="text-xs text-slate-500">권한</p><p className="font-semibold text-slateBlue">{profile.role === "admin" ? "관리자" : "일반 사용자"}</p></div>
            </div>
            <ProfileForm
              nickname={profile.nickname}
              department={profile.department}
              studentNumber={profile.student_number}
              profileMessage={profile.profile_message}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slateBlue">내가 만든 팟</h2>
                <p className="text-sm text-slate-500">직접 모집을 시작한 택시팟이에요.</p>
              </div>
              <Link href="/parties/new" className={buttonStyles("secondary")}>새 팟 만들기</Link>
            </div>
            {createdParties.length > 0 ? (
              <div className="grid gap-3">
                {createdParties.map((party) => (
                  <Link key={party.id} href={`/parties/${party.id}`}>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50/80">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-slateBlue">{party.departure_place_name}</p>
                          <p className="text-sm text-slate-500">{party.destination_name}</p>
                          <p className="text-sm text-slate-600">{formatDateTime(party.scheduled_at)}</p>
                        </div>
                        <StatusPill status={party.status} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="아직 만든 팟이 없어요" description="출발지와 시간만 정하면 바로 모집을 시작할 수 있어요." actionHref="/parties/new" actionLabel="모집 시작하기" />
            )}
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slateBlue">내가 참여한 팟</h2>
                <p className="text-sm text-slate-500">다른 사람이 만든 팟에 참여한 기록이에요.</p>
              </div>
              <Link href="/parties" className={buttonStyles("secondary")}>목록으로 이동</Link>
            </div>
            {joinedParties.length > 0 ? (
              <div className="grid gap-3">
                {joinedParties.map((party) => (
                  <Link key={party.id} href={`/parties/${party.id}`}>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50/80">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-slateBlue">{party.departure_place_name}</p>
                          <p className="text-sm text-slate-500">{party.destination_name}</p>
                          <p className="text-sm text-slate-600">{formatDateTime(party.scheduled_at)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusPill status={party.status} />
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{party.membershipStatus ?? "기록 없음"}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="아직 참여한 팟이 없어요" description="목록에서 바로 참여하면 이력도 여기에 쌓여요." actionHref="/parties" actionLabel="참여할 팟 찾기" />
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slateBlue">탈퇴 요청</p>
            <p className="mt-1 text-sm text-slate-500">MVP에서는 관리자가 확인하는 간단한 탈퇴 요청 흐름을 제공합니다.</p>
          </div>
          {deletionRequest ? (
            <div className="rounded-3xl border border-brand-200 bg-brand-50/70 p-4 text-sm text-brand-700">
              <p className="font-semibold">이미 탈퇴 요청이 접수되어 있습니다.</p>
              <p className="mt-1">접수 시각: {formatDateTime(deletionRequest.created_at)}</p>
            </div>
          ) : null}
          <DeletionRequestForm hasOpenRequest={Boolean(deletionRequest && deletionRequest.status === "open")} />
        </div>
      </Card>
    </div>
  );
}
