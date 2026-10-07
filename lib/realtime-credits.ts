"use client";

import { useEffect, useRef } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { getEcho } from "@/lib/realtime-echo";
import { useAuth } from "@/lib/auth-context";

export interface CreditBalanceUpdatedEvent {
    workspace_id: number;
    tenant_id?: number;
    balance: number;
    previous_balance?: number;
    change?: number;
    transaction_type?: string;
    reference_type?: string | null;
    reference_id?: string | null;
    transaction_id?: number | null;
    occurred_at?: string;
}

export const creditQueryKey = (workspaceId: number | string) => [
    "workspace",
    Number(workspaceId),
    "credits",
];

export const creditsOverviewQueryKey = () => ["credits-overview"];

/**
 * Hook to subscribe directly to authoritative realtime credit balance updates
 * on the workspace's private Pusher/Echo channel.
 */
export function useRealtimeCredits(workspaceIdProp?: number | null) {
    const { user, token, updateUserCredits } = useAuth();
    const queryClient = useQueryClient();
    const lastTxIdRef = useRef<number>(0);

    const effectiveWorkspaceId = workspaceIdProp ?? user?.tenant_id;

    // Optional query to fetch authoritative balance on mount/reconciliation
    const query = useQuery({
        queryKey: creditQueryKey(effectiveWorkspaceId || 0),
        queryFn: async () => {
            if (!token || !effectiveWorkspaceId) return null;
            const res = await fetch("/api/workspace/credits", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "X-Tenant-Id": String(effectiveWorkspaceId),
                },
            });
            if (!res.ok) {
                const fallbackRes = await fetch("/api/billing/credits", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                });
                if (!fallbackRes.ok) throw new Error("Failed to fetch credits");
                const fallbackData = await fallbackRes.json();
                return fallbackData.data;
            }
            const data = await res.json();
            return data.data;
        },
        enabled: !!token && !!effectiveWorkspaceId,
        staleTime: 60 * 1000,
    });

    useEffect(() => {
        if (!token || !effectiveWorkspaceId) return;

        const echo = getEcho(token, effectiveWorkspaceId);
        if (!echo) return;

        const channelName = `workspace.${effectiveWorkspaceId}`;
        const channel = echo.private(channelName);

        const handleCreditEvent = (payload: any) => {
            const event: CreditBalanceUpdatedEvent = payload?.data || payload;
            const balance = Number(event.balance);
            const txId = Number(event.transaction_id || 0);
            const eventWorkspaceId = Number(event.workspace_id || event.tenant_id);

            // Workspace isolation verification
            if (eventWorkspaceId && eventWorkspaceId !== Number(effectiveWorkspaceId)) {
                return;
            }

            if (isNaN(balance)) return;

            // Out-of-order event check: reject stale events
            if (txId && lastTxIdRef.current && txId < lastTxIdRef.current) {
                return;
            }
            if (txId) {
                lastTxIdRef.current = txId;
            }

            // 1. Authoritative update to AuthContext
            updateUserCredits(balance);

            // 2. Immediate TanStack Query cache updates without full page reload
            queryClient.setQueriesData(
                { queryKey: creditQueryKey(effectiveWorkspaceId) },
                (old: any) => (old ? { ...old, balance } : { balance })
            );
            queryClient.setQueriesData(
                { queryKey: creditsOverviewQueryKey() },
                (old: any) => (old ? { ...old, balance } : { balance })
            );
            queryClient.setQueriesData(
                { queryKey: ["billing/usage-summary"] },
                (old: any) => (old ? { ...old, balance } : old)
            );

            // Refresh transaction history queries
            queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["credit-history"] });
        };

        channel.listen(".credit.balance.updated", handleCreditEvent);
        channel.listen("credit.balance.updated", handleCreditEvent);
        channel.listen(".CreditBalanceUpdated", handleCreditEvent);
        channel.listen("CreditBalanceUpdated", handleCreditEvent);

        return () => {
            channel.stopListening(".credit.balance.updated");
            channel.stopListening("credit.balance.updated");
            channel.stopListening(".CreditBalanceUpdated");
            channel.stopListening("CreditBalanceUpdated");
        };
    }, [token, effectiveWorkspaceId, queryClient, updateUserCredits]);

    const activeBalance =
        typeof query.data?.balance === "number"
            ? query.data.balance
            : typeof user?.credits === "number"
            ? user.credits
            : 0;

    return {
        balance: activeBalance,
        isLoading: query.isLoading,
        refetch: query.refetch,
    };
}
