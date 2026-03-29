import { NextResponse } from "next/server";

import { ALLOWED_LOGIN_EMAIL_LABEL } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedLoginEmail } from "@/lib/utils";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/home";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=인증 코드가 없습니다.", requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message || "로그인에 실패했습니다.")}`, requestUrl.origin),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAllowedLoginEmail(user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(`허용된 이메일 도메인만 로그인할 수 있습니다. (${ALLOWED_LOGIN_EMAIL_LABEL})`)}`,
        requestUrl.origin,
      ),
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
