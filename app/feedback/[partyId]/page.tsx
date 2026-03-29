import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { FeedbackForm } from "@/components/forms/feedback-form";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { requireAuth } from "@/lib/queries/auth";
import { getFeedbackPageData } from "@/lib/queries/data";
import { formatDateTime } from "@/lib/utils";

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ partyId: string }>;
}) {
  const { partyId } = await params;
  await requireAuth();
  const data = await getFeedbackPageData(partyId);

  if (!data) {
    notFound();
  }

  if (!data.canSubmitFeedback) {
    redirect(`/parties/${partyId}?error=${encodeURIComponent("참여자만 피드백을 작성할 수 있습니다.")}`);
  }

  return (
    <div className="space-y-6">
      <Card className="bg-mesh-glow">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-brand-700">피드백 / 신고</p>
          <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue">{data.party.departure_place_name} 탑승 후기</h1>
          <p className="text-sm leading-6 text-slate-600">
            모임 시간은 {formatDateTime(data.party.scheduled_at)}였습니다. 후기와 신고는 한 번만 제출할 수 있으며, 신고 데이터는 관리자 화면으로 전달됩니다.
          </p>
        </div>
      </Card>

      {data.party.hasSubmittedFeedback ? (
        <Notice variant="success">
          이미 피드백을 제출했습니다. <Link href="/mypage" className="font-semibold underline">마이페이지</Link>에서 이용 이력을 계속 확인할 수 있습니다.
        </Notice>
      ) : !data.party.isFeedbackDue ? (
        <Notice variant="warning">모임 시간이 지난 뒤 1시간이 지나면 피드백 제출이 열립니다.</Notice>
      ) : (
        <div className="space-y-4">
          {data.participants.length === 0 ? (
            <Notice variant="info">함께 탑승한 다른 참여자가 없어 이번에는 후기만 남길 수 있습니다.</Notice>
          ) : null}
          <Card>
            <FeedbackForm
              partyId={data.party.id}
              participants={data.participants.map((participant) => ({
                id: participant.profile.id,
                nickname: participant.profile.nickname,
              }))}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
