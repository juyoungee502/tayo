import { redirect } from "next/navigation";

import { LoginForm } from "@/components/forms/login-form";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { ALLOWED_LOGIN_EMAIL_LABEL } from "@/lib/constants";
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
        <div className="space-y-6 py-4 sm:py-10">
          <div className="space-y-3">
            <p className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-brand-700">
              Campus Taxi Share MVP
            </p>
            <h1 className="max-w-xl font-[var(--font-display)] text-4xl font-bold leading-tight text-slateBlue sm:text-5xl">
              처음엔 계정을 만들고, 그다음부터는 바로 로그인하는 합승 앱.
            </h1>
            <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              타요는 성심교정 학생 중심으로 사용하는 택시 합승 웹 앱입니다. 허용된 이메일과 비밀번호로 계정을 만들면,
              첫 로그인에서도 메일 링크 없이 바로 들어올 수 있도록 구성했습니다.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/85 p-4 sm:col-span-2">
              <p className="text-xs text-slate-500">허용 도메인</p>
              <p className="mt-2 text-lg font-semibold leading-8 text-slateBlue">{ALLOWED_LOGIN_EMAIL_LABEL}</p>
            </div>
            <div className="rounded-3xl bg-white/85 p-4">
              <p className="text-xs text-slate-500">정원</p>
              <p className="mt-2 text-lg font-semibold text-slateBlue">2~4명</p>
            </div>
            <div className="rounded-3xl bg-white/85 p-4 sm:col-span-3">
              <p className="text-xs text-slate-500">첫 로그인</p>
              <p className="mt-2 text-lg font-semibold text-slateBlue">이메일 인증 없이 계정 생성</p>
            </div>
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
