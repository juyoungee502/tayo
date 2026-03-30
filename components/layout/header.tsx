import Link from "next/link";

import { signOutAction } from "@/lib/actions/app-actions";

function navLinkClass() {
  return "inline-flex h-10 w-full items-center justify-center rounded-2xl border border-white/70 bg-white/70 px-1 text-[11px] font-semibold text-slateBlue transition hover:bg-white sm:h-11 sm:text-sm";
}

export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slateBlue transition hover:bg-brand-50 sm:px-3 sm:py-1.5 sm:text-xs"
      >
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
        { href: "/parties", label: "택시팟" },
        { href: "/parties/new", label: "생성" },
        { href: "/waiting", label: "뭐먹지" },
        { href: "/mypage", label: "내 현황" },
        ...(profile.role === "admin" ? [{ href: "/admin", label: "관리" }] : []),
      ]
    : [
        { href: "/home", label: "홈" },
        { href: "/parties", label: "택시팟" },
        { href: "/waiting", label: "뭐먹지" },
        { href: "/login", label: "로그인" },
      ];

  const navGridClass =
    navItems.length === 6 ? "grid-cols-6" : navItems.length === 5 ? "grid-cols-5" : "grid-cols-4";

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
        <div className="flex items-center justify-between gap-3">
          <Link href="/home" className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-xs font-bold text-white shadow-md shadow-brand-500/20 sm:h-8 sm:w-8 sm:text-sm">
              T
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-none text-slateBlue">타요</p>
              <p className="hidden truncate pt-0.5 text-[10px] text-slate-500 sm:block">성심교정 학생 택시 합승</p>
            </div>
          </Link>

          {profile ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-24 truncate text-[11px] text-slate-500 sm:inline">{profile.nickname}</span>
              <LogoutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-brand-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slateBlue transition hover:bg-brand-50 sm:px-3 sm:py-1.5 sm:text-xs"
            >
              로그인
            </Link>
          )}
        </div>

        <nav className={`grid ${navGridClass} gap-1`}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={navLinkClass()}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
