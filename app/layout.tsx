import type { Metadata } from "next";
import Link from "next/link";
import { Noto_Sans_KR, Space_Grotesk } from "next/font/google";

import { Header } from "@/components/layout/header";
import { buttonStyles } from "@/components/ui/button";
import { getPendingFeedbackPartiesForCurrentUser } from "@/lib/queries/data";
import { getOptionalAuthContext } from "@/lib/queries/auth";

import "./globals.css";

const bodyFont = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "타요 | 성심교정 택시 합승 MVP",
  description: "가톨릭대학교 성심교정 학생을 위한 허용 이메일 기반 택시 합승 웹 MVP",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const authContext = await getOptionalAuthContext();
  let pendingFeedbackCount = 0;
  let pendingFeedbackHref = "/home";

  if (authContext.user) {
    try {
      const pendingFeedbackParties = await getPendingFeedbackPartiesForCurrentUser();
      pendingFeedbackCount = pendingFeedbackParties.length;
      pendingFeedbackHref = pendingFeedbackParties[0] ? `/feedback/${pendingFeedbackParties[0].id}` : "/home";
    } catch {
      pendingFeedbackCount = 0;
    }
  }

  return (
    <html lang="ko">
      <body className={`${bodyFont.variable} ${displayFont.variable} bg-sand font-sans text-slateBlue`}>
        <div className="flex min-h-screen flex-col">
          <Header
            profile={
              authContext.profile
                ? {
                    nickname: authContext.profile.nickname,
                    role: authContext.profile.role,
                  }
                : null
            }
          />
          {pendingFeedbackCount > 0 ? (
            <div className="border-b border-amber-200 bg-amber-50">
              <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p>
                  후기 작성이 필요한 택시팟이 <strong>{pendingFeedbackCount}개</strong> 있습니다. 다음 방문 때 놓치지 않도록 바로 작성해 주세요.
                </p>
                <Link href={pendingFeedbackHref} className={buttonStyles("secondary")}>
                  피드백 작성하기
                </Link>
              </div>
            </div>
          ) : null}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
          <footer className="border-t border-slate-200 bg-white/70 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:px-6 sm:text-base">
              <p className="font-[var(--font-display)] font-semibold text-slateBlue">All Rights Reserved. TAYO x OIKOS!!!!</p>
              <p>CEO: 유주영 CTO: 박준서</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
