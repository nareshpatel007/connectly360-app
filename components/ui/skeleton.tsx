import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Base Skeleton Component
 * Supports subtle shimmer/pulse animation, custom width/height/radius,
 * accessibility tags (aria-hidden), and respects prefers-reduced-motion.
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "rounded" | "text" | "button";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-slate-200/80 motion-reduce:animate-none",
        variant === "circular" && "rounded-full",
        variant === "rounded" && "rounded-2xl",
        variant === "text" && "rounded-md h-4 w-full",
        variant === "button" && "rounded-xl h-9 w-24",
        variant === "default" && "rounded-xl",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2 w-full", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-3.5",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = "md", className }: { size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };
  return <Skeleton variant="circular" className={cn(sizeClasses[size], className)} />;
}

export function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton variant="button" className={className} />;
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white border border-slate-200 rounded-2xl p-4.5 space-y-3 shadow-2xs", className)} aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton variant="circular" className="h-8 w-8" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      <div className="space-y-1.5 pt-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-24" />
      </div>
    </div>
  );
}

export function PageHeaderSkeleton({ hasActions = true }: { hasActions?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80 sm:w-96" />
      </div>
      {hasActions && (
        <div className="flex items-center gap-2.5 shrink-0">
          <SkeletonButton className="w-24" />
          <SkeletonButton className="w-32" />
        </div>
      )}
    </div>
  );
}

export function DataTableSkeleton({
  columns = 5,
  rows = 5,
  hasToolbar = true,
}: {
  columns?: number;
  rows?: number;
  hasToolbar?: boolean;
}) {
  return (
    <div className="space-y-4 w-full" aria-hidden="true">
      {hasToolbar && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <Skeleton className="h-9 w-64 rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 w-20" />
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, rIdx) => (
            <div key={rIdx} className="px-4 py-3.5 flex items-center justify-between gap-4">
              {Array.from({ length: columns }).map((_, cIdx) => (
                <div key={cIdx} className="flex items-center gap-2.5 min-w-0 flex-1">
                  {cIdx === 0 && <SkeletonAvatar size="sm" />}
                  <Skeleton className={cn("h-4", cIdx === 0 ? "w-32" : cIdx === 1 ? "w-24" : "w-16")} />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Skeleton className="h-3 w-36" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4", className)} aria-hidden="true">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="h-48 w-full flex items-end justify-between gap-3 pt-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <Skeleton
              className="w-full rounded-t-lg"
              style={{ height: `${30 + (i * 12) % 60}%` }}
            />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5" aria-hidden="true">
      <div className="space-y-1.5 border-b border-slate-100 pb-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3.5 w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="pt-2 flex justify-end gap-3">
        <SkeletonButton className="w-24" />
        <SkeletonButton className="w-32" />
      </div>
    </div>
  );
}

export { Skeleton };
