"use client";

import { useState } from "react";
import { useListLeads, useUpdateLead } from "@/lib/api-client-react";
import { PipelineBoard } from "@/components/pipelines/pipeline-board";
import { PipelineAnalytics } from "@/components/pipelines/pipeline-analytics";
import { DealForm } from "@/components/pipelines/deal-form";
import { Button } from "@/components/ui/button";
import { Plus, Users2, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";

export default function LeadsPage() {
    const { data: leads = [], isLoading, refetch } = useListLeads();
    const updateLeadMutation = useUpdateLead();

    const [formOpen, setFormOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<any | null>(null);
    const [defaultStatus, setDefaultStatus] = useState("new");

    const handleLeadMoved = async (leadId: number, newStatus: string) => {
        try {
            await updateLeadMutation.mutateAsync({
                id: leadId,
                data: { status: newStatus as any },
            });
            toast.success("Lead stage updated successfully");
            refetch();
        } catch (err: any) {
            toast.error("Failed to move lead");
        }
    };

    const handleAddLead = (status?: string) => {
        setEditingLead(null);
        setDefaultStatus(status || "new");
        setFormOpen(true);
    };

    const handleEditLead = (lead: any) => {
        setEditingLead(lead);
        setFormOpen(true);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
                    <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-200" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
                    ))}
                </div>
                <div className="flex gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-96 w-full animate-pulse rounded-2xl bg-slate-200/50" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                icon={GitBranch}
                title="Leads Pipeline"
                description="Track, move and organize conversational pipeline deals."
                breadcrumbs={[{ label: "Leads" }]}
                actions={
                    <Button
                        onClick={() => handleAddLead("new")}
                        className="bg-[#35877D] hover:bg-[#2c6f66] text-white font-bold h-9 px-4 rounded-xl gap-1.5 shadow-xs transition-all cursor-pointer border-0"
                    >
                        <Plus className="h-4 w-4" />
                        Add Lead
                    </Button>
                }
            />

            {/* Analytics */}
            <PipelineAnalytics leads={leads} />

            {/* Pipeline Board */}
            {leads.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <Users2 size={24} />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-slate-800">
                        No leads created yet
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 font-semibold max-w-sm">
                        Leads are created automatically when customer messages match pricing/ordering keywords, or you can add them manually.
                    </p>
                    <Button
                        onClick={() => handleAddLead("new")}
                        className="mt-5 bg-[#35877D] hover:bg-[#2c6f66] text-white font-bold h-9 px-4 rounded-xl gap-1 border-0 shadow-sm cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        Create Manual Lead
                    </Button>
                </div>
            ) : (
                <PipelineBoard
                    leads={leads}
                    onLeadMoved={handleLeadMoved}
                    onAddLead={handleAddLead}
                    onEditLead={handleEditLead}
                />
            )}

            {/* Deal Form (Sheet) */}
            <DealForm
                open={formOpen}
                onOpenChange={setFormOpen}
                lead={editingLead}
                defaultStatus={defaultStatus}
                onSaved={refetch}
            />
        </div>
    );
}
