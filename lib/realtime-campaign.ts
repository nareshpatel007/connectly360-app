"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getEcho } from "@/lib/realtime-echo";
import { useAuth } from "@/lib/auth-context";

export function useRealtimeCampaign(campaignId?: number | string | null) {
    const { user, token } = useAuth();
    const queryClient = useQueryClient();
    const workspaceId = user?.tenant_id;

    useEffect(() => {
        if (!token || !workspaceId) return;

        const echo = getEcho(token, workspaceId);
        if (!echo) return;

        const channelName = `workspace.${workspaceId}`;
        const channel = echo.private(channelName);

        const handleProgressUpdated = (event: any) => {
            const data = event?.campaign || event;
            if (!data) return;

            // Invalidate or update active queries
            if (campaignId && String(data.id) === String(campaignId)) {
                queryClient.setQueryData(["getCampaign", String(campaignId)], (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        campaign: {
                            ...old.campaign,
                            ...data,
                        },
                    };
                });
                queryClient.invalidateQueries({ queryKey: ["campaignAnalytics", String(campaignId)] });
            }

            queryClient.invalidateQueries({ queryKey: ["listCampaigns"] });
            queryClient.invalidateQueries({ queryKey: ["campaignStats"] });
        };

        const handleStatusUpdated = (event: any) => {
            const data = event?.campaign || event;
            if (!data) return;

            if (campaignId && String(data.id) === String(campaignId)) {
                queryClient.setQueryData(["getCampaign", String(campaignId)], (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        campaign: {
                            ...old.campaign,
                            ...data,
                        },
                    };
                });
                queryClient.invalidateQueries({ queryKey: ["campaignAnalytics", String(campaignId)] });
                queryClient.invalidateQueries({ queryKey: ["campaignRecipients", String(campaignId)] });
            }

            queryClient.invalidateQueries({ queryKey: ["listCampaigns"] });
            queryClient.invalidateQueries({ queryKey: ["campaignStats"] });
        };

        channel.listen(".campaign.progress.updated", handleProgressUpdated);
        channel.listen("campaign.progress.updated", handleProgressUpdated);
        channel.listen(".campaign.status.updated", handleStatusUpdated);
        channel.listen("campaign.status.updated", handleStatusUpdated);

        return () => {
            channel.stopListening(".campaign.progress.updated");
            channel.stopListening("campaign.progress.updated");
            channel.stopListening(".campaign.status.updated");
            channel.stopListening("campaign.status.updated");
        };
    }, [token, workspaceId, campaignId, queryClient]);
}
