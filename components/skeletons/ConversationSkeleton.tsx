import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function ConversationSkeleton() {
  return (
    <div className="h-[calc(100vh-4rem)] w-full flex overflow-hidden bg-white border-t border-slate-200 font-sans" aria-busy="true" aria-label="Loading inbox">
      {/* Left Conversations Sidebar */}
      <div className="w-80 sm:w-96 border-r border-slate-200 flex flex-col h-full bg-white shrink-0">
        <div className="p-3.5 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-3 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Skeleton variant="circular" className="h-10 w-10 shrink-0" />
                <div className="space-y-1.5 min-w-0">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <Skeleton className="h-3 w-10 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Content Panel */}
      <div className="flex-1 flex flex-col h-full bg-slate-50/60 min-w-0">
        {/* Chat Header */}
        <div className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" className="h-9 w-9" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-xl" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
        </div>

        {/* Message Bubbles Body */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          <div className="flex items-start gap-3 max-w-md">
            <Skeleton variant="circular" className="h-8 w-8 shrink-0" />
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-xs space-y-2 shadow-2xs w-64">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-2.5 w-12 ml-auto" />
            </div>
          </div>

          <div className="flex items-start justify-end gap-3 max-w-md ml-auto">
            <div className="bg-[#35877D]/10 border border-[#35877D]/20 p-3.5 rounded-2xl rounded-tr-xs space-y-2 shadow-2xs w-64">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-2.5 w-12 ml-auto" />
            </div>
          </div>

          <div className="flex items-start gap-3 max-w-md">
            <Skeleton variant="circular" className="h-8 w-8 shrink-0" />
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-xs space-y-2 shadow-2xs w-56">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-2.5 w-12 ml-auto" />
            </div>
          </div>
        </div>

        {/* Composer Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-3 shrink-0">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl shrink-0" />
        </div>
      </div>
    </div>
  );
}
