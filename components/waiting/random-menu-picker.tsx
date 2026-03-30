"use client";

import { useState } from "react";

import { shareRandomMenuAction } from "@/lib/actions/app-actions";
import { buttonStyles } from "@/components/ui/button";

const MENU_CANDIDATES = [
  "마라탕 + 꿔바로우",
  "떡볶이 + 튀김",
  "김치볶음밥 + 계란후라이",
  "샐러드 + 샌드위치",
  "돈가스",
  "햄버거 세트",
  "국밥",
  "쌀국수",
  "파스타",
  "치킨마요",
  "불닭 + 삼각김밥",
  "순두부찌개",
];

function pickRandomMenu() {
  return MENU_CANDIDATES[Math.floor(Math.random() * MENU_CANDIDATES.length)] ?? MENU_CANDIDATES[0];
}

export function RandomMenuPicker({ canShare }: { canShare: boolean }) {
  const [menu, setMenu] = useState<string>(pickRandomMenu());

  return (
    <div className="rounded-3xl border border-brand-200 bg-brand-50/70 p-4 text-sm text-slate-600">
      <div className="space-y-3">
        <div>
          <p className="font-semibold text-slateBlue">랜덤 메뉴 추천</p>
          <p className="mt-2 text-base font-semibold text-brand-700">{menu}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setMenu(pickRandomMenu())} className={`${buttonStyles("secondary")} px-3 py-2 text-xs`}>
            다시 뽑기
          </button>
          {canShare ? (
            <form action={shareRandomMenuAction}>
              <input type="hidden" name="menu" value={menu} />
              <button type="submit" className={`${buttonStyles("primary")} px-3 py-2 text-xs`}>
                방명록에 공유
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
