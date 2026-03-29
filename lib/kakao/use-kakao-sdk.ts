"use client";

import { useEffect, useState } from "react";
import type { KakaoSdkGlobal } from "@/types/kakao";

import { loadKakaoSdk } from "@/lib/kakao/load-kakao-sdk";

type KakaoSdkState =
  | { status: "idle" | "loading" }
  | { status: "ready"; kakao: KakaoSdkGlobal }
  | { status: "error"; message: string };

export function useKakaoSdk() {
  const [state, setState] = useState<KakaoSdkState>({ status: "idle" });

  useEffect(() => {
    let active = true;

    setState({ status: "loading" });

    loadKakaoSdk()
      .then((kakao) => {
        if (active) {
          setState({ status: "ready", kakao });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "카카오 SDK를 사용할 수 없습니다.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
