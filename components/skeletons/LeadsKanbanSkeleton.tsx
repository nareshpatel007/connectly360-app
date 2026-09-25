import React from "react";
import { Skeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

export function LeadsKanbanSkeleton() {
  const columns = ["New Lead", "Contacted", "Proposal Sent", "Won", "Lost"];

  return (
    <div className="space-y-6 pb-12 font-sans" aria-busy="true" aria-label="Loading lead pipeline">
      <PageHeaderSkeleton hasActions={true} />

      {/* Filter toolbar skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Kanban columns grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
        {columns.map((colName, cIdx) => (
          <div key={cIdx} className="bg-slate-100/80 border border-slate-200/80 rounded-2xl p-3 space-y-3">
            <div className="flex items-center justify-between px-1 py-0.5 border-b border-slate-200 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: cIdx === 0 ? 3 : cIdx === 1 ? 2 : 1 }).map((_, kIdx) => (
                <div key={kIdx} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-3 w-36" />
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <Skeleton className="h-3 w-16 rounded-full" />
                    <Skeleton variant="circular" className="h-6 w-6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
