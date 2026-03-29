import { Card } from "@/components/ui/card";
import { PartyForm } from "@/components/forms/party-form";
import { requireAuth } from "@/lib/queries/auth";

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewPartyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAuth();
  const params = await searchParams;
  const departure = pickParam(params.departure) ?? "";
  const mode = pickParam(params.mode) === "scheduled" ? "scheduled" : "instant";

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-brand-700">없으면 바로 만들기</p>
        <h1 className="text-3xl font-bold text-slateBlue">택시팟 만들기</h1>
      </div>

      <Card className="p-5">
        <PartyForm initialDeparture={departure} initialMode={mode} />
      </Card>
    </div>
  );
}
