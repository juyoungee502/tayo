import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600",
  secondary: "bg-white/80 text-slateBlue ring-1 ring-slate-200 hover:bg-white",
  ghost: "bg-transparent text-slateBlue hover:bg-slate-100",
  danger: "bg-rose-500 text-white hover:bg-rose-600",
};

export function buttonStyles(variant: ButtonVariant = "primary", fullWidth = false) {
  return cn(
    "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    fullWidth && "w-full",
  );
}
