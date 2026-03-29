import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand-500 text-slateBlue hover:bg-brand-400 shadow-lg shadow-brand-200/60",
  secondary: "bg-white/85 text-slateBlue ring-1 ring-brand-200 hover:bg-brand-50",
  ghost: "bg-transparent text-slateBlue hover:bg-brand-100/60",
  danger: "bg-rose-400 text-white hover:bg-rose-500",
};

export function buttonStyles(variant: ButtonVariant = "primary", fullWidth = false) {
  return cn(
    "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    fullWidth && "w-full",
  );
}
