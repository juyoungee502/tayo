import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/app-actions";

export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <button type="submit" className={buttonStyles("ghost")}>
        로그아웃
      </button>
    </form>
  );
}

export function Header({
  profile,
}: {
  profile:
    | {
        nickname: string;
        role: "user" | "admin";
      }
    | null;
}) {
  const navItems = profile
    ? [
        { href: "/home", label: "홈" },
        { href: "/parties", label: "택시팟 찾기" },
        { href: "/parties/new", label: "생성" },
        { href: "/mypage", label: "내 현황" },
        ...(profile.role === "admin" ? [{ href: "/admin", label: "관리" }] : []),
      ]
    : [
        { href: "/home", label: "홈" },
        { href: "/parties", label: "택시팟 찾기" },
        { href: "/login", label: "로그인" },
      ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/home" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-lg font-bold text-white shadow-lg shadow-brand-500/20">
            T
          </div>
          <div>
            <p className="font-semibold text-slateBlue">타요</p>
            <p className="text-xs text-slate-500">성심교정 학생 택시 합승</p>
          </div>
        </Link>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:gap-3">
          <nav className="flex flex-wrap items-center gap-1 rounded-full bg-sand px-2 py-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={buttonStyles("ghost")}>
                {item.label}
              </Link>
            ))}
          </nav>
          {profile ? (
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              <span className="hidden max-w-32 truncate sm:inline">{profile.nickname}</span>
              <LogoutButton />
            </div>
          ) : (
            <Link href="/login" className={buttonStyles("primary")}>
              참여하려면 로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}