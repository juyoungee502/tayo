"use client";

import { useActionState } from "react";

import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { submitDeletionRequestAction } from "@/lib/actions/app-actions";
import { INITIAL_ACTION_STATE } from "@/lib/form-state";

export function DeletionRequestForm({
  hasOpenRequest,
}: {
  hasOpenRequest: boolean;
}) {
  const [state, formAction] = useActionState(submitDeletionRequestAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? <Notice variant={state.success ? "success" : "error"}>{state.message}</Notice> : null}
      <textarea
        name="note"
        rows={3}
        disabled={hasOpenRequest}
        placeholder="선택 사항: 탈퇴 사유나 정리 요청이 있다면 적어주세요."
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring disabled:cursor-not-allowed disabled:bg-slate-50"
      />
      <SubmitButton
        label={hasOpenRequest ? "탈퇴 요청 접수됨" : "탈퇴 요청 보내기"}
        pendingLabel="요청 중..."
        variant={hasOpenRequest ? "secondary" : "danger"}
      />
    </form>
  );
}
