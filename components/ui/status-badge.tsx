import React from "react";
import { cn } from "@/lib/utils";

export type StatusType =
  | "active"
  | "enabled"
  | "connected"
  | "operational"
  | "running"
  | "completed"
  | "approved"
  | "paid"
  | "success"
  | "inactive"
  | "disabled"
  | "disconnected"
  | "offline"
  | "paused"
  | "draft"
  | "pending"
  | "processing"
  | "reviewing"
  | "warning"
  | "suspended"
  | "failed"
  | "error"
  | "lost"
  | "rejected"
  | "blocked"
  | "expired"
  | "destructive"
  | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({ status, label, pulse, className }: StatusBadgeProps) {
  const normalized = (status || "").toLowerCase().trim();

  let variantStyles = "bg-slate-100 text-slate-700 border-slate-200";
  let dotColor = "bg-slate-400";

  if (["active", "enabled", "connected", "operational", "running", "completed", "approved", "paid", "success"].includes(normalized)) {
    variantStyles = "bg-emerald-50 text-emerald-700 border-emerald-200";
    dotColor = "bg-emerald-500";
  } else if (["pending", "processing", "reviewing", "warning"].includes(normalized)) {
    variantStyles = "bg-amber-50 text-amber-700 border-amber-200";
    dotColor = "bg-amber-500";
  } else if (["suspended", "failed", "error", "lost", "rejected", "blocked", "expired", "destructive"].includes(normalized)) {
    variantStyles = "bg-rose-50 text-rose-700 border-rose-200";
    dotColor = "bg-rose-500";
  } else if (["inactive", "disabled", "disconnected", "offline", "paused", "draft"].includes(normalized)) {
    variantStyles = "bg-slate-100 text-slate-600 border-slate-200";
    dotColor = "bg-slate-400";
  }

  const displayLabel = label || normalized.replace("_", " ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors",
        variantStyles,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColor, pulse && "animate-pulse")} />
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}
