"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { ALLOWED_LOGIN_EMAIL_LABEL } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isAllowedLoginEmail } from "@/lib/utils";

function mapAuthErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "인증에 실패했습니다.";
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다. 처음 로그인이라면 '처음 계정 만들기'를 눌러주세요.";
  }

  if (normalized.includes("user already registered")) {
    return "이미 가입된 이메일입니다. 로그인 버튼으로 들어와주세요.";
  }

  if (normalized.includes("email not confirmed")) {
    return "이메일 인증 설정을 먼저 확인해주세요.";
  }

  return message;
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pendingMode, setPendingMode] = useState<"sign-up" | "sign-in" | null>(null);

  const validateInputs = () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!isAllowedLoginEmail(normalizedEmail)) {
      setStatus("error");
      setMessage(`허용된 이메일 도메인만 로그인할 수 있습니다. (${ALLOWED_LOGIN_EMAIL_LABEL})`);
      return null;
    }

    if (password.trim().length < 8) {
      setStatus("error");
      setMessage("비밀번호는 8자 이상으로 입력해주세요.");
      return null;
    }

    return {
      email: normalizedEmail,
      password: password.trim(),
    };
  };

  const handleAuth = async (mode: "sign-up" | "sign-in") => {
    const parsed = validateInputs();

    if (!parsed) {
      return;
    }

    setStatus("loading");
    setPendingMode(mode);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();

      if (mode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.email,
          password: parsed.password,
        });

        if (error) {
          throw error;
        }

        if (!data.session) {
          throw new Error("이메일 인증 설정을 먼저 확인해주세요.");
        }

        setStatus("success");
        setMessage("계정이 만들어졌고 바로 로그인되었습니다.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.email,
          password: parsed.password,
        });

        if (error) {
          throw error;
        }

        setStatus("success");
        setMessage("로그인되었습니다.");
      }

      router.push("/home");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(mapAuthErrorMessage(error));
    } finally {
      setPendingMode(null);
    }
  };

  return (
    <Card className="mx-auto max-w-xl">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleAuth("sign-in");
        }}
        className="space-y-5"
      >
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-slateBlue">
            이메일
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
          />
          <p className="text-xs leading-5 text-slate-500">
            성심교정 학생 중심으로 운영 중이며, 현재는 catholic.ac.kr, korea.ac.kr, gmail.com 도메인을 지원합니다.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-semibold text-slateBlue">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8자 이상 입력"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
          />
          <p className="text-xs text-slate-500">처음에는 계정을 만들고, 이후에는 같은 이메일과 비밀번호로 바로 로그인합니다.</p>
        </div>

        {message ? <Notice variant={status === "success" ? "success" : status === "error" ? "error" : "info"}>{message}</Notice> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={pendingMode !== null}
            onClick={() => void handleAuth("sign-up")}
            className={buttonStyles("secondary", true)}
          >
            {pendingMode === "sign-up" ? "계정 생성 중..." : "처음 계정 만들기"}
          </button>
          <button type="submit" disabled={pendingMode !== null} className={buttonStyles("primary", true)}>
            {pendingMode === "sign-in" ? "로그인 중..." : "로그인"}
          </button>
        </div>
      </form>
    </Card>
  );
}
