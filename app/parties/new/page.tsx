import { PartyForm } from "@/components/forms/party-form";
import { Card } from "@/components/ui/card";
import { requireAuth } from "@/lib/queries/auth";

export default async function NewPartyPage() {
  await requireAuth();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue">택시팟 생성</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          카카오 검색이 되면 좌표까지 저장하고, 안 되더라도 수동 입력으로 그대로 생성할 수 있습니다.
        </p>
      </div>
      <Card>
        <PartyForm />
      </Card>
    </div>
  );
}
