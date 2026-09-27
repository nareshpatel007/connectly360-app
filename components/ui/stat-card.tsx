import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  iconBg?: string;
  iconColor?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtitle?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconBg = "bg-[#35877D]/10",
  iconColor = "text-[#35877D]",
  change,
  changeType = "positive",
  subtitle,
  loading = false,
  className
}: StatCardProps) {
  let badgeStyles = "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (changeType === "negative") {
    badgeStyles = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (changeType === "neutral") {
    badgeStyles = "bg-slate-100 text-slate-700 border-slate-200";
  }

  return (
    <Card className={cn("p-5 bg-white border border-slate-200/80 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 font-sans", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 font-bold", iconBg, iconColor)}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div>
        {loading ? (
          <Skeleton className="h-8 w-24 my-1" />
        ) : (
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{value}</div>
        )}

        {(change || subtitle) && (
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
            {change && (
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black border", badgeStyles)}>
                {change}
              </span>
            )}
            {subtitle && <div className="text-slate-500 font-medium truncate">{subtitle}</div>}
          </div>
        )}
      </div>
    </Card>
  );
}
