import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "nnn" | "gross" | "modified" | "unknown" | "success" | "destructive";
}

const variants = {
  default:     "bg-primary/10 text-primary border-primary/20",
  nnn:         "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  gross:       "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  modified:    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  unknown:     "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  success:     "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  destructive: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", variants[variant], className)} {...props} />
  );
}
