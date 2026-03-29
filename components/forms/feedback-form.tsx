"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { REPORT_REASON_OPTIONS } from "@/lib/constants";
import { submitFeedbackAction } from "@/lib/actions/app-actions";
import { INITIAL_ACTION_STATE } from "@/lib/form-state";

export function FeedbackForm({
  partyId,
  participants,
}: {
  partyId: string;
  participants: Array<{ id: string; nickname: string }>;
}) {
  const router = useRouter();
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [state, formAction] = useActionState(submitFeedbackAction.bind(null, partyId), INITIAL_ACTION_STATE);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? <Notice variant={state.success ? "success" : "error"}>{state.message}</Notice> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slateBlue">시간 준수</label>
          <select
            name="punctualityRating"
            defaultValue="5"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
          >
            <option value="5">5점 매우 좋음</option>
            <option value="4">4점</option>
            <option value="3">3점 보통</option>
            <option value="2">2점</option>
            <option value="1">1점 아쉬움</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slateBlue">탑승 경험</label>
          <select
            name="comfortRating"
            defaultValue="5"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
          >
            <option value="5">5점 매우 좋음</option>
            <option value="4">4점</option>
            <option value="3">3점 보통</option>
            <option value="2">2점</option>
            <option value="1">1점 아쉬움</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slateBlue">전체 후기</label>
        <textarea
          name="comment"
          rows={5}
          placeholder="좋았던 점이나 개선이 필요한 점을 자유롭게 적어주세요."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
        />
      </div>

      {participants.length > 0 ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-slateBlue">필요하면 신고도 함께 남길 수 있어요</p>
            <p className="text-xs text-slate-500">체크한 참여자만 신고 데이터가 관리자 페이지로 전달됩니다.</p>
          </div>
          {participants.map((participant) => {
            const checked = selectedReportIds.includes(participant.id);
            return (
              <div key={participant.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <label className="flex items-center gap-3 text-sm font-semibold text-slateBlue">
                  <input
                    type="checkbox"
                    name="reportedUserId"
                    value={participant.id}
                    checked={checked}
                    onChange={(event) => {
                      setSelectedReportIds((current) =>
                        event.target.checked
                          ? [...current, participant.id]
                          : current.filter((value) => value !== participant.id),
                      );
                    }}
                  />
                  {participant.nickname} 신고하기
                </label>

                {checked ? (
                  <div className="mt-4 space-y-3">
                    <select
                      name={`reportReason_${participant.id}`}
                      defaultValue="late"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
                    >
                      {REPORT_REASON_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <textarea
                      name={`reportDetail_${participant.id}`}
                      rows={3}
                      placeholder="구체적인 상황을 간단히 적어주세요."
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <SubmitButton label="피드백 제출" pendingLabel="제출 중..." />
    </form>
  );
}
