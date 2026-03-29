import { PartyForm } from "@/components/forms/party-form";
import { Card } from "@/components/ui/card";
import { requireAuth } from "@/lib/queries/auth";

export default async function NewPartyPage() {
  await requireAuth();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-brand-700">없으면 바로 모집 시작하기</p>
        <div>
          <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue">택시팟 만들기</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">게시글처럼 길게 쓰지 않아도 됩니다. 출발지, 시간, 인원만 정하면 바로 모집을 시작할 수 있어요.</p>
        </div>
      </div>
      <Card>
        <PartyForm />
      </Card>
    </div>
  );
}