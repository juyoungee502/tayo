import type { Metadata } from "next";
import Link from "next/link";
import { Noto_Sans_KR, Space_Grotesk } from "next/font/google";

import { Header } from "@/components/layout/header";
import { buttonStyles } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getActivePartySnapshotForCurrentUser, getPendingFeedbackPartiesForCurrentUser } from "@/lib/queries/data";
import { getOptionalAuthContext } from "@/lib/queries/auth";
import { estimateTaxiShare, formatRelativeStatus, isUrgentParty } from "@/lib/utils";

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
  let activePartySnapshot = null;

  if (authContext.user) {
    try {
      const [pendingFeedbackParties, activeParty] = await Promise.all([
        getPendingFeedbackPartiesForCurrentUser(),
        getActivePartySnapshotForCurrentUser(),
      ]);
      pendingFeedbackCount = pendingFeedbackParties.length;
      pendingFeedbackHref = pendingFeedbackParties[0] ? `/feedback/${pendingFeedbackParties[0].id}` : "/home";
      activePartySnapshot = activeParty;
    } catch {
      pendingFeedbackCount = 0;
      activePartySnapshot = null;
    }
  }

  const hasActivePartyBar = Boolean(activePartySnapshot);

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
            <div className="border-b border-brand-200 bg-brand-100/70 backdrop-blur-xl">
              <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 text-sm text-slateBlue sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p>
                  후기 작성이 필요한 택시팟이 <strong>{pendingFeedbackCount}개</strong> 있습니다. 다음 방문 때 놓치지 않도록 바로 작성해 주세요.
                </p>
                <Link href={pendingFeedbackHref} className={buttonStyles("secondary")}>
                  피드백 작성하기
                </Link>
              </div>
            </div>
          ) : null}
          <main className={`mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 ${hasActivePartyBar ? "pb-28 sm:pb-32" : ""}`}>
            <div className="mb-4 flex justify-end">
              <ThemeToggle />
            </div>
            {children}
          </main>
          <footer className={`border-t border-brand-100 bg-white/70 backdrop-blur-xl ${hasActivePartyBar ? "pb-24 sm:pb-28" : ""}`}>
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:px-6 sm:text-base">
              <p className="font-[var(--font-display)] font-semibold text-slateBlue">All Rights Reserved. TAYO x OIKOS!!!!</p>
              <p>CEO: 유주영 CTO: 박준서</p>
              <p className="text-sm text-slate-500">We love because he first loved us. 1 John 4:19</p>
            </div>
          </footer>

          {activePartySnapshot ? (
            <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 px-3 sm:bottom-4 sm:px-6">
              <div className="pointer-events-auto mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-3xl border border-brand-200 bg-white/92 px-4 py-3 shadow-xl shadow-brand-200/60 backdrop-blur-xl">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slateBlue">내 참여 현황</p>
                    {isUrgentParty(activePartySnapshot.note) ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-500">급해요</span>
                    ) : null}
                  </div>
                  <p className="truncate text-sm text-slateBlue">
                    {activePartySnapshot.departure_place_name} → {activePartySnapshot.destination_name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatRelativeStatus(activePartySnapshot.scheduled_at)} · {activePartySnapshot.joinedCount}/{activePartySnapshot.capacity}명 · 1인당 약 {estimateTaxiShare(activePartySnapshot.joinedCount, activePartySnapshot.capacity, activePartySnapshot.departure_place_name, false).toLocaleString()}원
                  </p>
                </div>
                <Link href={`/parties/${activePartySnapshot.id}`} className={`${buttonStyles("primary")} shrink-0 px-3 py-2 text-xs sm:text-sm`}>
                  실시간 보기
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </body>
    </html>
  );
}

