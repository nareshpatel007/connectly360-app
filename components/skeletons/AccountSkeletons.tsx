import React from "react";
import { Skeleton, StatCardSkeleton, PageHeaderSkeleton, DataTableSkeleton, FormSkeleton } from "@/components/ui/skeleton";

export function BillingSkeleton() {
  return (
    <div className="space-y-6 pb-12 font-sans" aria-busy="true" aria-label="Loading billing and credits">
      <PageHeaderSkeleton hasActions={true} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <DataTableSkeleton columns={5} rows={5} hasToolbar={true} />
    </div>
  );
}

export function IntegrationsSkeleton() {
  return (
    <div className="space-y-6 pb-12 font-sans" aria-busy="true" aria-label="Loading integrations">
      <PageHeaderSkeleton hasActions={false} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <Skeleton variant="circular" className="h-10 w-10" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-9 w-full rounded-xl pt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 pb-12 font-sans" aria-busy="true" aria-label="Loading settings">
      <PageHeaderSkeleton hasActions={false} />
      <FormSkeleton fields={6} />
    </div>
  );
}
