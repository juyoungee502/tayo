import { redirect } from "next/navigation";

import { LoginForm } from "@/components/forms/login-form";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { getOptionalAuthContext } from "@/lib/queries/auth";

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await getOptionalAuthContext();

  if (user) {
    redirect("/home");
  }

  const params = await searchParams;
  const error = pickParam(params.error);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
      <Card className="overflow-hidden bg-mesh-glow">
        <div className="space-y-4 py-6 sm:py-12">
          <div className="space-y-3">
            <p className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-brand-700">
              Campus Taxi Share MVP
            </p>
            <h1 className="max-w-xl font-[var(--font-display)] text-4xl font-bold leading-tight text-slateBlue sm:text-5xl">
              우울하지말자. 택시타자.
            </h1>
            <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              가톨릭대학교 성심교정 학생 중심, 역에서 강의실까지 엔빵해서 합승하는 합리적인 서비스
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {error ? <Notice variant="error">{error}</Notice> : null}
        <LoginForm />
      </div>
    </div>
  );
}
