"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/ui/notice";
import { updateProfileAction } from "@/lib/actions/app-actions";
import { INITIAL_ACTION_STATE } from "@/lib/form-state";

export function ProfileForm({ nickname }: { nickname: string }) {
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
      <SubmitButton label="프로필 저장" pendingLabel="저장 중..." />
    </form>
  );
}
