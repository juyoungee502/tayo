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

type PartyFormProps = {
  initialDeparture?: string;
  initialMode?: "instant" | "scheduled";
};

export function PartyForm({
  initialDeparture = "",
  initialMode = "instant",
}: PartyFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(createPartyAction, INITIAL_ACTION_STATE);
  const [mode, setMode] = useState<"instant" | "scheduled">(initialMode);
  const [departure, setDeparture] = useState(initialDeparture);
  const [showDepartureSearch, setShowDepartureSearch] = useState(false);
  const [showDestinationSearch, setShowDestinationSearch] = useState(false);
  const [destinationName] = useState(DEFAULT_DESTINATION.placeName);
  const [isUrgent, setIsUrgent] = useState(false);
  const [localTime, setLocalTime] = useState(getLocalDateTimeInputValue(new Date(Date.now() + 60 * 60 * 1000)));

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [router, state.redirectTo]);

  const scheduledIso = useMemo(() => {
    const targetDate = mode === "instant" ? new Date(Date.now() + 10 * 60 * 1000) : new Date(localTime);
    return Number.isNaN(targetDate.getTime()) ? "" : targetDate.toISOString();
  }, [localTime, mode]);

  return (
    <form action={formAction} className="space-y-5">
      {state.message ? <Notice variant="error">{state.message}</Notice> : null}

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slateBlue">출발지</label>
        {showDepartureSearch ? (
          <PlacePicker
            label="출발지"
            description="필요할 때만 지도 검색을 열어 정확한 출발지를 고를 수 있습니다."
            namePrefix="departure"
            defaultPlaceName={departure}
            searchPlaceholder="예: 역곡역, 부천역, 송내역"
          />
        ) : (
          <>
            <input
              name="departurePlaceName"
              value={departure}
              onChange={(event) => setDeparture(event.target.value)}
              placeholder="예: 역곡역"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base outline-none ring-brand-200 transition focus:ring"
            />
            <input type="hidden" name="departureDetail" value="" />
            <input type="hidden" name="departureLat" value="" />
            <input type="hidden" name="departureLng" value="" />
          </>
        )}
        {state.fieldErrors?.departurePlaceName ? <p className="text-sm text-rose-600">{state.fieldErrors.departurePlaceName[0]}</p> : null}
        {!showDepartureSearch ? (
          <button
            type="button"
            onClick={() => setShowDepartureSearch(true)}
            className="text-sm font-semibold text-brand-700 underline underline-offset-4"
          >
            지도/검색으로 자세히 입력
          </button>
        ) : null}
      </div>

      <div className="space-y-2 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slateBlue">도착지</p>
            <p className="mt-1 text-sm text-slate-500">기본값은 {DEFAULT_DESTINATION.placeName}입니다.</p>
          </div>
          {!showDestinationSearch ? (
            <button
              type="button"
              onClick={() => setShowDestinationSearch(true)}
              className="text-sm font-semibold text-brand-700 underline underline-offset-4"
            >
              도착지 수정
            </button>
          ) : null}
        </div>

        {showDestinationSearch ? (
          <PlacePicker
            label="도착지"
            description="카카오 검색 또는 직접 입력으로 도착지를 바꿀 수 있습니다."
            namePrefix="destination"
            defaultPlaceName={destinationName}
            defaultLat={DEFAULT_DESTINATION.lat}
            defaultLng={DEFAULT_DESTINATION.lng}
            searchPlaceholder="예: 가톨릭대학교 성심교정, 부천시청"
          />
        ) : (
          <>
            <div className="rounded-2xl border border-white bg-white px-4 py-4 text-base font-semibold text-slateBlue">
              {destinationName}
            </div>
            <input type="hidden" name="destinationPlaceName" value={destinationName} />
            <input type="hidden" name="destinationLat" value={String(DEFAULT_DESTINATION.lat)} />
            <input type="hidden" name="destinationLng" value={String(DEFAULT_DESTINATION.lng)} />
          </>
        )}
        {state.fieldErrors?.destinationPlaceName ? <p className="text-sm text-rose-600">{state.fieldErrors.destinationPlaceName[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slateBlue">출발 방식</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("instant")}
            className={`rounded-2xl px-4 py-4 text-sm font-semibold transition ${
              mode === "instant" ? "bg-brand-500 text-slateBlue shadow-md shadow-brand-200/60" : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            바로 출발
          </button>
          <button
            type="button"
            onClick={() => setMode("scheduled")}
            className={`rounded-2xl px-4 py-4 text-sm font-semibold transition ${
              mode === "scheduled" ? "bg-brand-500 text-slateBlue shadow-md shadow-brand-200/60" : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            시간 지정
          </button>
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50/70 px-4 py-4 text-sm font-semibold text-slateBlue">
        <input
          type="checkbox"
          name="isUrgent"
          value="true"
          checked={isUrgent}
          onChange={(event) => setIsUrgent(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-200"
        />
        급해요 표시하기
      </label>

      {mode === "scheduled" ? (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slateBlue">출발 시간</label>
          <input
            type="datetime-local"
            value={localTime}
            onChange={(event) => setLocalTime(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base outline-none ring-brand-200 transition focus:ring"
          />
          {state.fieldErrors?.scheduledAt ? <p className="text-sm text-rose-600">{state.fieldErrors.scheduledAt[0]}</p> : null}
        </div>
      ) : null}
      <input type="hidden" name="scheduledAt" value={scheduledIso} />

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slateBlue">최대 인원</label>
        <select
          name="capacity"
          defaultValue="4"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base outline-none ring-brand-200 transition focus:ring"
        >
          <option value="2">2명</option>
          <option value="3">3명</option>
          <option value="4">4명</option>
        </select>
        {state.fieldErrors?.capacity ? <p className="text-sm text-rose-600">{state.fieldErrors.capacity[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slateBlue">계좌번호</label>
        <input
          name="note"
          placeholder="예: 카카오뱅크 3333-12-3456789"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base outline-none ring-brand-200 transition focus:ring"
        />
        {state.fieldErrors?.note ? <p className="text-sm text-rose-600">{state.fieldErrors.note[0]}</p> : null}
      </div>

      <SubmitButton label="택시팟 만들기" pendingLabel="생성 중..." />
    </form>
  );
}
