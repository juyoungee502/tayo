"use client";

import { useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import { shareRandomMenuAction } from "@/lib/actions/app-actions";

const MENU_CANDIDATES = [
  "유부초밥 + 떡볶이",
  "불닭볶음면",
  "카레돈가스",
  "콩나물불고기",
  "라멘",
  "초밥",
  "회덮밥",
  "간장새우덮밥",
  "파스타",
  "피자",
  "치킨",
  "한솥",
  "지지고",
  "학식",
  "엽기떡볶이",
  "김치찜",
  "꼬밥",
  "나비루",
  "이삭토스트",
  "마라탕 + 꿔바로우",
  "떡볶이 + 튀김",
  "김치볶음밥 + 계란후라이",
  "샐러드 + 샌드위치",
  "돈가스",
  "햄버거 세트",
  "국밥",
  "쌀국수",
  "치킨마요",
  "불닭 + 삼각김밥",
  "순두부찌개",
  "부대찌개",
  "제육덮밥",
  "알밥",
  "냉면 + 만두",
  "로제떡볶이",
  "우동 + 유부초밥",
  "샤브샤브",
  "타코야끼 + 어묵탕",
  "삼겹살 정식",
  "규동",
  "텐동",
  "비빔밥",
  "참치김밥 + 라면",
  "스테이크 덮밥",
  "토마토 파스타 + 마늘빵",
  "치즈돈가스",
  "닭갈비 볶음밥",
  "로코모코",
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