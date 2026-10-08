"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSlaConfig, useUpdateSlaConfig, useSlaMetrics } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Clock, ShieldCheck, AlertTriangle, CheckCircle2, TrendingUp, Settings2 } from "lucide-react";

interface SlaSettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SlaSettingsModal({ open, onOpenChange }: SlaSettingsModalProps) {
    const { toast } = useToast();
    const { data: configData, isLoading: isLoadingConfig } = useSlaConfig();
    const { data: metricsData } = useSlaMetrics();
    const updateMutation = useUpdateSlaConfig();

    const [isEnabled, setIsEnabled] = useState(true);
    const [frtMinutes, setFrtMinutes] = useState(15);
    const [nextResponseMinutes, setNextResponseMinutes] = useState(30);
    const [resolutionMinutes, setResolutionMinutes] = useState(240);
    const [warningThreshold, setWarningThreshold] = useState(75);

    useEffect(() => {
        if (configData?.config) {
            setIsEnabled(configData.config.is_enabled);
            setFrtMinutes(configData.config.first_response_time_minutes);
            setNextResponseMinutes(configData.config.next_response_time_minutes);
            setResolutionMinutes(configData.config.resolution_time_minutes);
            setWarningThreshold(configData.config.warning_threshold_percentage);
        }
    }, [configData]);

    const handleSave = async () => {
        try {
            await updateMutation.mutateAsync({
                is_enabled: isEnabled,
                first_response_time_minutes: Number(frtMinutes) || 15,
                next_response_time_minutes: Number(nextResponseMinutes) || 30,
                resolution_time_minutes: Number(resolutionMinutes) || 240,
                warning_threshold_percentage: Number(warningThreshold) || 75,
            });
            toast({
                title: "SLA Policy Saved",
                description: "Workspace response time targets have been successfully updated.",
            });
            onOpenChange(false);
        } catch (err: any) {
            toast({
                title: "Failed to save SLA settings",
                description: err?.message || "An unexpected error occurred",
                variant: "destructive",
            });
        }
    };

    const metrics = metricsData?.metrics;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg p-0 overflow-hidden bg-white border border-slate-200 rounded-xl shadow-xl">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/60">
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-lg bg-[#2F8F83]/10 text-[#2F8F83] flex items-center justify-center shrink-0">
                            <Clock size={20} strokeWidth={2.2} />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold text-slate-900">
                                SLA & Response Time Policy
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 mt-0.5">
                                Configure target response times, waiting limits, and resolution benchmarks.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    {/* Live Overview Cards */}
                    {metrics && (
                        <div className="grid grid-cols-3 gap-2.5 bg-[#F8FAFC] p-3 rounded-lg border border-slate-150">
                            <div className="space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                    Compliance
                                </span>
                                <div className="text-base font-bold text-slate-800 flex items-center gap-1">
                                    {metrics.compliance_rate}%
                                    <TrendingUp size={12} className="text-emerald-600" />
                                </div>
                                <span className="text-[9px] text-slate-400">
                                    {metrics.met_count} met / {metrics.breached_count} breached
                                </span>
                            </div>

                            <div className="space-y-0.5 border-l border-slate-200/80 pl-2.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                    Avg First Reply
                                </span>
                                <div className="text-base font-bold text-[#2F8F83]">
                                    {metrics.avg_first_response_time_formatted || "—"}
                                </div>
                                <span className="text-[9px] text-slate-400">Target: {frtMinutes}m</span>
                            </div>

                            <div className="space-y-0.5 border-l border-slate-200/80 pl-2.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                    Overdue Now
                                </span>
                                <div className={`text-base font-bold ${metrics.overdue_count > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                    {metrics.overdue_count}
                                </div>
                                <span className="text-[9px] text-slate-400">
                                    {metrics.active_waiting_count} waiting
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Enable SLA Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                        <div className="space-y-0.5">
                            <Label className="text-xs font-semibold text-slate-800 cursor-pointer">
                                Active SLA Tracking
                            </Label>
                            <p className="text-[11px] text-slate-500">
                                Flag overdue customer messages and monitor team responsiveness.
                            </p>
                        </div>
                        <Switch
                            checked={isEnabled}
                            onCheckedChange={setIsEnabled}
                            className="data-[state=checked]:bg-[#2F8F83]"
                        />
                    </div>

                    {/* Time Target Inputs */}
                    <div className={`space-y-4 transition-opacity ${isEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                        <div className="grid grid-cols-2 gap-3.5">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-700 flex items-center justify-between">
                                    <span>First Response Time</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Minutes</span>
                                </Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={1440}
                                    value={frtMinutes}
                                    onChange={(e) => setFrtMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="h-8.5 text-xs bg-slate-50 border-slate-200 focus:bg-white"
                                />
                                <p className="text-[10px] text-slate-400">Target limit to answer a brand new conversation.</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-700 flex items-center justify-between">
                                    <span>Next Response Time</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Minutes</span>
                                </Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={1440}
                                    value={nextResponseMinutes}
                                    onChange={(e) => setNextResponseMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="h-8.5 text-xs bg-slate-50 border-slate-200 focus:bg-white"
                                />
                                <p className="text-[10px] text-slate-400">Target limit for subsequent customer replies.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-700 flex items-center justify-between">
                                    <span>Resolution Time</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Minutes</span>
                                </Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={10080}
                                    value={resolutionMinutes}
                                    onChange={(e) => setResolutionMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="h-8.5 text-xs bg-slate-50 border-slate-200 focus:bg-white"
                                />
                                <p className="text-[10px] text-slate-400">Total time to mark ticket or chat as resolved ({Math.round(resolutionMinutes / 60 * 10) / 10}h).</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-700 flex items-center justify-between">
                                    <span>Warning Threshold</span>
                                    <span className="text-[10px] text-slate-400 font-normal">% of limit</span>
                                </Label>
                                <Input
                                    type="number"
                                    min={50}
                                    max={95}
                                    value={warningThreshold}
                                    onChange={(e) => setWarningThreshold(Math.max(1, Math.min(99, parseInt(e.target.value) || 75)))}
                                    className="h-8.5 text-xs bg-slate-50 border-slate-200 focus:bg-white"
                                />
                                <p className="text-[10px] text-slate-400">Trigger amber warning badge before SLA breaches.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-3.5 border-t border-slate-150 bg-slate-50 flex items-center justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="text-xs text-slate-600 hover:text-slate-900 h-8"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSave}
                        disabled={updateMutation.isPending || isLoadingConfig}
                        className="text-xs bg-[#2F8F83] hover:bg-[#267A70] text-white font-medium h-8 px-4"
                    >
                        {updateMutation.isPending ? "Saving..." : "Save Policy"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
