import { Card } from "@/components/ui/card";

export default function WaitingPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <Card className="bg-mesh-glow p-6 sm:p-8">
        <div className="space-y-3 text-center">
          <p className="text-3xl">𐔌՞⁔•͈ ·̫ •͈⁔՞𐦯</p>
          <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue sm:text-4xl">
            오늘 뭐먹지??
          </h1>
          <p className="text-sm text-slate-500 sm:text-base">
            사장님들의 제휴를 기다리고 있어요
          </p>
        </div>
      </Card>

      <Card className="p-5">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slateBlue">기다리는 동안 이런 건 어때요</h2>
            <p className="mt-1 text-sm text-slate-500">택시 오기 전에 잠깐 보고 웃고 지나갈 수 있는 공간이에요.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-brand-200 bg-brand-50/70 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slateBlue">오늘의 희망 메뉴</p>
              <p className="mt-2">김치볶음밥, 마라탕, 떡볶이 중 하나는 결국 먹게 될지도 몰라요.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <p className="font-semibold text-slateBlue">제휴 대기중</p>
              <p className="mt-2">언젠가 학교 앞 맛집들이 이 칸을 가득 채워주길 기다리는 중입니다.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
