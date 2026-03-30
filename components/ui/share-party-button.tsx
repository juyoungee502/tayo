"use client";

import { useState } from "react";

import { buttonStyles } from "@/components/ui/button";

export function SharePartyButton({ partyId }: { partyId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const url = `${window.location.origin}/parties/${partyId}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "타요 택시팟 초대",
          text: "같이 탈 사람 찾았어요. 여기서 바로 확인해보세요!",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
    }
  }

  return (
    <button type="button" onClick={handleClick} className={buttonStyles("secondary", true)}>
      {copied ? "링크를 복사했어요" : "친구 초대 링크 공유"}
    </button>
  );
}
