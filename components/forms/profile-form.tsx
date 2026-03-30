"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/ui/notice";
import { updateProfileAction } from "@/lib/actions/app-actions";
import { INITIAL_ACTION_STATE } from "@/lib/form-state";

export function ProfileForm({
  nickname,
  department,
  studentNumber,
  profileMessage,
}: {
  nickname: string;
  department?: string | null;
  studentNumber?: string | null;
  profileMessage?: string | null;
}) {
  const [state, formAction] = useActionState(updateProfileAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? <Notice variant={state.success ? "success" : "error"}>{state.message}</Notice> : null}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slateBlue">닉네임</label>
        <input
          name="nickname"
          defaultValue={nickname}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
        />
        {state.fieldErrors?.nickname ? <p className="text-sm text-rose-600">{state.fieldErrors.nickname[0]}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slateBlue">학과</label>
          <input
            name="department"
            defaultValue={department ?? ""}
            placeholder="예: 컴퓨터정보공학부"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
          />
          {state.fieldErrors?.department ? <p className="text-sm text-rose-600">{state.fieldErrors.department[0]}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slateBlue">학번</label>
          <input
            name="studentNumber"
            defaultValue={studentNumber ?? ""}
            placeholder="예: 20241234"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
          />
          {state.fieldErrors?.studentNumber ? <p className="text-sm text-rose-600">{state.fieldErrors.studentNumber[0]}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slateBlue">상태메시지</label>
        <input
          name="profileMessage"
          defaultValue={profileMessage ?? ""}
          placeholder="예: 오늘은 마라탕파"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
        />
        {state.fieldErrors?.profileMessage ? <p className="text-sm text-rose-600">{state.fieldErrors.profileMessage[0]}</p> : null}
      </div>
      <SubmitButton label="프로필 저장" pendingLabel="저장 중..." />
    </form>
  );
}
