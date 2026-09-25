import React from "react";
import { DataTableSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

export function ContactsSkeleton() {
  return (
    <div className="space-y-6 pb-12 font-sans" aria-busy="true" aria-label="Loading contacts">
      <PageHeaderSkeleton hasActions={true} />
      <DataTableSkeleton columns={5} rows={6} hasToolbar={true} />
    </div>
  );
}
