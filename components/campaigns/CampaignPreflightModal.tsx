"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Rocket, AlertTriangle, ShieldCheck } from "lucide-react";
import { CampaignPreflightWidget } from "./CampaignPreflightWidget";
import { useGetCampaignPreflight, type CampaignPreflightResult } from "@/lib/api-client-react";

interface CampaignPreflightModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaignId: number;
    campaignName: string;
    onConfirmLaunch: () => Promise<void>;
    isLaunching: boolean;
}

export function CampaignPreflightModal({
    isOpen,
    onClose,
    campaignId,
    campaignName,
    onConfirmLaunch,
    isLaunching,
}: CampaignPreflightModalProps) {
    const {
        data: preflight,
        isLoading,
        error,
        refetch,
        isFetching,
    } = useGetCampaignPreflight(campaignId, { enabled: isOpen });

    const isLaunchable = Boolean(preflight?.is_launchable);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isLaunching && !open && onClose()}>
            <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-[#2F8F83]/10 text-[#2F8F83]">
                            <Rocket className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold">
                                Campaign Preflight Audit & Launch Authorization
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Verification of channel connectivity, templates, audience hygiene, opt-in policies, and credits for <strong>{campaignName}</strong>.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-2">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-[#2F8F83]" />
                            <span className="text-xs text-muted-foreground font-medium">
                                Running 12-point preflight system audit...
                            </span>
                        </div>
                    ) : error || !preflight ? (
                        <div className="p-6 text-center space-y-3">
                            <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
                            <p className="text-sm text-rose-600 font-medium">
                                {error instanceof Error ? error.message : "Failed to run campaign preflight audit."}
                            </p>
                            <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
                                Retry Audit
                            </Button>
                        </div>
                    ) : (
                        <CampaignPreflightWidget
                            preflight={preflight}
                            onRefresh={() => refetch()}
                            isRefreshing={isFetching}
                        />
                    )}
                </div>

                <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                        {isLaunchable
                            ? "Campaign meets all delivery standards."
                            : "Launch button disabled until critical blockers are resolved."}
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            disabled={isLaunching}
                            className="text-xs"
                        >
                            Close
                        </Button>

                        <Button
                            type="button"
                            size="sm"
                            disabled={!isLaunchable || isLaunching || isLoading}
                            onClick={onConfirmLaunch}
                            className="bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs px-4 font-semibold shadow-xs"
                        >
                            {isLaunching ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Launching...
                                </>
                            ) : (
                                <>
                                    <Play className="h-3.5 w-3.5 mr-1.5" /> Confirm & Launch Broadcast
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
