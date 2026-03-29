"use client";

import { useFormStatus } from "react-dom";

import { buttonStyles } from "@/components/ui/button";

export function SubmitButton({
  label,
  pendingLabel,
  variant = "primary",
  fullWidth = true,
}: {
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  fullWidth?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={buttonStyles(variant, fullWidth)}>
      {pending ? pendingLabel ?? `${label} 처리 중...` : label}
    </button>
  );
}
