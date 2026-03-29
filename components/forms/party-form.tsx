"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PlacePicker } from "@/components/maps/place-picker";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/ui/notice";
import { createPartyAction } from "@/lib/actions/app-actions";
import { DEFAULT_DESTINATION } from "@/lib/constants";
import { INITIAL_ACTION_STATE } from "@/lib/form-state";
import { getLocalDateTimeInputValue } from "@/lib/utils";

export function PartyForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createPartyAction, INITIAL_ACTION_STATE);
  const [localTime, setLocalTime] = useState(getLocalDateTimeInputValue(new Date(Date.now() + 60 * 60 * 1000)));

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [router, state.redirectTo]);

  const scheduledIso = useMemo(() => {
    const parsed = new Date(localTime);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
  }, [localTime]);

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? <Notice variant="error">{state.message}</Notice> : null}

      <PlacePicker
        label="출발지"
        description="카카오 장소 검색이 가능하면 바로 선택하고, 실패하면 수동 입력으로 계속할 수 있습니다."
        namePrefix="departure"
        searchPlaceholder="예: 부천역, 송내역, 역곡역"
        showDetailInput
        detailLabel="예: 3번 출구, 정문 앞"
      />
      {state.fieldErrors?.departurePlaceName ? <p className="text-sm text-rose-600">{state.fieldErrors.departurePlaceName[0]}</p> : null}

      <PlacePicker
        label="도착지"
        description="기본값은 가톨릭대학교 성심교정이며, 필요하면 검색이나 직접 입력으로 수정할 수 있습니다."
        namePrefix="destination"
        defaultPlaceName={DEFAULT_DESTINATION.placeName}
        defaultLat={DEFAULT_DESTINATION.lat}
        defaultLng={DEFAULT_DESTINATION.lng}
        searchPlaceholder="예: 가톨릭대학교 성심교정, 부천시청"
      />
      {state.fieldErrors?.destinationPlaceName ? <p className="text-sm text-rose-600">{state.fieldErrors.destinationPlaceName[0]}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slateBlue">출발 시간</label>
          <input
            type="datetime-local"
            value={localTime}
            onChange={(event) => setLocalTime(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
          />
          <input type="hidden" name="scheduledAt" value={scheduledIso} />
          {state.fieldErrors?.scheduledAt ? <p className="text-sm text-rose-600">{state.fieldErrors.scheduledAt[0]}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slateBlue">정원</label>
          <select
            name="capacity"
            defaultValue="4"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
          >
            <option value="2">2명</option>
            <option value="3">3명</option>
            <option value="4">4명</option>
          </select>
          {state.fieldErrors?.capacity ? <p className="text-sm text-rose-600">{state.fieldErrors.capacity[0]}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slateBlue">메모</label>
        <textarea
          name="note"
          rows={4}
          placeholder="합승 전 전달할 내용이 있다면 적어주세요. 예: 캐리어 있음, 학교 정문 도착 희망"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
        />
        {state.fieldErrors?.note ? <p className="text-sm text-rose-600">{state.fieldErrors.note[0]}</p> : null}
      </div>

      <SubmitButton label="택시팟 만들기" pendingLabel="생성 중..." />
    </form>
  );
}
