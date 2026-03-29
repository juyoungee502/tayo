"use client";

import type { KakaoSdkGlobal } from "@/types/kakao";

let kakaoSdkPromise: Promise<KakaoSdkGlobal> | null = null;

const KAKAO_SCRIPT_ID = "kakao-maps-sdk";
const KAKAO_SDK_TIMEOUT_MS = 10000;

export async function loadKakaoSdk() {
  if (typeof window === "undefined") {
    throw new Error("카카오 지도 SDK는 브라우저에서만 로드할 수 있습니다.");
  }

  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;

  if (!appKey) {
    throw new Error("NEXT_PUBLIC_KAKAO_MAP_APP_KEY가 비어 있어 수동 입력 모드로 전환합니다.");
  }

  if (window.kakao?.maps?.services) {
    return window.kakao;
  }

  if (kakaoSdkPromise) {
    return kakaoSdkPromise;
  }

  kakaoSdkPromise = new Promise<KakaoSdkGlobal>((resolve, reject) => {
    const rejectWithReset = (message: string) => {
      kakaoSdkPromise = null;
      reject(new Error(message));
    };

    const existingScript = document.getElementById(KAKAO_SCRIPT_ID);
    if (existingScript && !window.kakao?.maps?.services) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.id = KAKAO_SCRIPT_ID;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;

    const timeoutId = window.setTimeout(() => {
      script.remove();
      rejectWithReset(
        `카카오 SDK 로드가 지연되고 있습니다. 앱 키와 Web 플랫폼 도메인(${window.location.origin})을 확인해주세요.`,
      );
    }, KAKAO_SDK_TIMEOUT_MS);

    script.onload = () => {
      if (!window.kakao?.maps) {
        window.clearTimeout(timeoutId);
        rejectWithReset("카카오 전역 객체를 찾을 수 없습니다.");
        return;
      }

      window.kakao.maps.load(() => {
        window.clearTimeout(timeoutId);

        if (!window.kakao?.maps?.services) {
          rejectWithReset("카카오 장소 검색 서비스를 초기화하지 못했습니다.");
          return;
        }

        resolve(window.kakao as KakaoSdkGlobal);
      });
    };

    script.onerror = () => {
      window.clearTimeout(timeoutId);
      script.remove();
      rejectWithReset(
        `카카오 SDK를 불러오지 못했습니다. 앱 키와 Web 플랫폼 도메인(${window.location.origin})을 확인해주세요.`,
      );
    };

    document.head.appendChild(script);
  });

  return kakaoSdkPromise;
}
