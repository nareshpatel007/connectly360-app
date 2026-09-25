import React from "react";
import { DataTableSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

export function KnowledgeBaseSkeleton() {
  return (
    <div className="space-y-6 pb-12 font-sans" aria-busy="true" aria-label="Loading knowledge base">
      <PageHeaderSkeleton hasActions={true} />
      <DataTableSkeleton columns={4} rows={5} hasToolbar={true} />
    </div>
  );
}

export function CampaignListSkeleton() {
  return (
    <div className="space-y-6 pb-12 font-sans" aria-busy="true" aria-label="Loading campaigns">
      <PageHeaderSkeleton hasActions={true} />
      <DataTableSkeleton columns={5} rows={5} hasToolbar={true} />
    </div>
  );
}

export function AutomationListSkeleton() {
  return (
    <div className="space-y-6 pb-12 font-sans" aria-busy="true" aria-label="Loading automations">
      <PageHeaderSkeleton hasActions={true} />
      <DataTableSkeleton columns={4} rows={5} hasToolbar={true} />
    </div>
  );
}
