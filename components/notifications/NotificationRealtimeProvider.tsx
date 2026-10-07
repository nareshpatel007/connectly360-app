"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { notify } from "@/lib/notifications";
import { getEcho, disconnectEcho, type RealtimeConnectionStatus } from "@/lib/realtime-echo";
import type { AppNotification } from "@/lib/api-client-react";

export interface RealtimeMessageItem {
    id: number;
    customerId: number;
    customerName: string;
    customerPhone: string;
    message: string;
    direction: "inbound" | "outbound";
    status?: string;
    intent?: string | null;
    isRead?: number;
    createdAt: string;
}

interface NotificationRealtimeContextType {
    browserPermission: NotificationPermission | "unsupported";
    requestBrowserPermission: () => Promise<NotificationPermission | "unsupported">;
    isSupported: boolean;
    connectionStatus: RealtimeConnectionStatus;
    activeCustomerId: number | null;
    setActiveCustomerId: (id: number | null) => void;
    lastSyncTimestamp: string | null;
    syncMissedEvents: () => Promise<void>;
}

const NotificationRealtimeContext = createContext<NotificationRealtimeContextType>({
    browserPermission: "default",
    requestBrowserPermission: async () => "default",
    isSupported: false,
    connectionStatus: "disconnected",
    activeCustomerId: null,
    setActiveCustomerId: () => {},
    lastSyncTimestamp: null,
    syncMissedEvents: async () => {},
});

export function useNotificationRealtime() {
    return useContext(NotificationRealtimeContext);
}

// Convenient alias for general realtime usage
export const useRealtime = useNotificationRealtime;

export function NotificationRealtimeProvider({ children }: { children: React.ReactNode }) {
    const { user, token, updateUserCredits } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "unsupported">("default");
    const [isSupported, setIsSupported] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>("disconnected");
    const [activeCustomerId, setActiveCustomerIdState] = useState<number | null>(null);

    const activeCustomerIdRef = useRef<number | null>(null);
    const processedIdsRef = useRef<Set<number>>(new Set());
    const processedMsgIdsRef = useRef<Set<number>>(new Set());
    const lastCreditTxIdRef = useRef<number>(0);
    const channelRef = useRef<BroadcastChannel | null>(null);
    const lastUnreadCountRef = useRef<number | null>(null);
    const lastSyncTimestampRef = useRef<string>(new Date().toISOString());
    const lastGroupedNotificationRef = useRef<{ customerId: number; count: number; timer: NodeJS.Timeout | null }>({
        customerId: 0,
        count: 0,
        timer: null,
    });

    // Synchronize ref for non-reactive callback access
    const setActiveCustomerId = useCallback((id: number | null) => {
        activeCustomerIdRef.current = id;
        setActiveCustomerIdState(id);
    }, []);

    // Initialize browser permission status & multi-tab BroadcastChannel
    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            setIsSupported(true);
            setBrowserPermission(Notification.permission);
        } else {
            setIsSupported(false);
            setBrowserPermission("unsupported");
        }

        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            channelRef.current = new BroadcastChannel("connectly360_realtime_coordination");
            channelRef.current.onmessage = (event) => {
                const { notifId, msgId, creditBalance, txId } = event.data || {};
                if (notifId) processedIdsRef.current.add(notifId);
                if (msgId) processedMsgIdsRef.current.add(msgId);
                if (typeof creditBalance === "number") {
                    if (txId && lastCreditTxIdRef.current && txId < lastCreditTxIdRef.current) {
                        return;
                    }
                    if (txId) {
                        lastCreditTxIdRef.current = txId;
                    }
                    updateUserCredits(creditBalance);
                    queryClient.setQueriesData(
                        { queryKey: ["workspace", user?.tenant_id, "credits"] },
                        (old: any) => (old ? { ...old, balance: creditBalance } : { balance: creditBalance })
                    );
                    queryClient.setQueriesData(
                        { queryKey: ["credits-overview"] },
                        (old: any) => (old ? { ...old, balance: creditBalance } : { balance: creditBalance })
                    );
                }
            };
        }

        return () => {
            channelRef.current?.close();
        };
    }, [updateUserCredits, queryClient, user?.tenant_id]);

    // Request browser permission
    const requestBrowserPermission = useCallback(async (): Promise<NotificationPermission | "unsupported"> => {
        if (typeof window === "undefined" || !("Notification" in window)) {
            return "unsupported";
        }
        try {
            const permission = await Notification.requestPermission();
            setBrowserPermission(permission);
            if (permission === "granted") {
                notify.success("Browser notifications enabled!", {
                    description: "You will receive desktop alerts when customers send new messages.",
                });
            } else if (permission === "denied") {
                notify.warning("Notifications blocked", {
                    description: "Please allow notifications in your browser site settings to receive alerts.",
                });
            }
            return permission;
        } catch {
            return "default";
        }
    }, []);

    // Dispatch Native Browser Notification with deduplication and tab focus
    const showBrowserNotification = useCallback((title: string, body: string, customerId: number, msgId?: number) => {
        if (
            typeof window === "undefined" ||
            !("Notification" in window) ||
            Notification.permission !== "granted"
        ) {
            return;
        }

        try {
            const n = new window.Notification(title, {
                body,
                icon: "/images/favicon.png",
                tag: `connectly360-msg-${customerId}-${msgId || Date.now()}`,
            });

            n.onclick = () => {
                window.focus();
                n.close();
                router.push(`/conversations?customer_id=${customerId}`);
            };
        } catch (err) {
            console.warn("[RealtimeProvider] Browser notification failed:", err);
        }
    }, [router]);

    // Handle incoming notification item (for top bell & in-app alerts)
    const handleIncomingNotification = useCallback(
        (notif: AppNotification, channels?: { toast?: boolean; browser?: boolean }) => {
            if (processedIdsRef.current.has(notif.id)) {
                return;
            }
            processedIdsRef.current.add(notif.id);
            channelRef.current?.postMessage({ notifId: notif.id });

            const shouldToast = channels?.toast ?? true;
            const shouldBrowser = channels?.browser ?? true;

            // In-App Toast
            if (shouldToast) {
                const actionOpts = notif.action_url
                    ? {
                          actionLabel: "View",
                          onAction: () => router.push(notif.action_url!),
                      }
                    : undefined;

                if (notif.priority === "critical") {
                    notify.error(notif.title, { description: notif.message, duration: 8000, ...actionOpts });
                } else if (notif.priority === "high") {
                    notify.warning(notif.title, { description: notif.message, duration: 6000, ...actionOpts });
                } else {
                    notify.info(notif.title, { description: notif.message, duration: 4500, ...actionOpts });
                }
            }

            // Browser System Notification
            if (shouldBrowser && document.hidden) {
                showBrowserNotification(notif.title, notif.message, (notif.data as any)?.customer_id || 0, notif.id);
            }

            // Invalidate React Query counts
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
        },
        [queryClient, router, showBrowserNotification]
    );

    // Sync missed events from cursor endpoint (/api/conversations/sync)
    const syncMissedEvents = useCallback(async () => {
        if (!token || !user) return;
        try {
            const headers: Record<string, string> = {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            };
            if (user.tenant_id) {
                headers["X-Tenant-Id"] = String(user.tenant_id);
            }

            const since = lastSyncTimestampRef.current;
            const res = await fetch(`/api/conversations/sync?since=${encodeURIComponent(since)}`, { headers });
            if (!res.ok) return;

            const data = await res.json();
            if (data.success && Array.isArray(data.messages)) {
                lastSyncTimestampRef.current = data.timestamp || new Date().toISOString();

                // Merge any missed messages into cache
                data.messages.forEach((msg: any) => {
                    const cid = msg.customerId || msg.customer_id;
                    if (!cid || processedMsgIdsRef.current.has(msg.id)) return;
                    processedMsgIdsRef.current.add(msg.id);

                    // Reconcile open customer thread
                    queryClient.setQueryData(
                        ["getCustomerConversations", cid],
                        (old: any[] | undefined) => {
                            if (!old) return [msg];
                            if (old.some((m) => m.id === msg.id)) return old;
                            return [...old, msg].sort(
                                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                            );
                        }
                    );

                    // Reconcile all conversations thread list
                    queryClient.setQueryData(
                        ["listConversations"],
                        (old: any[] | undefined) => {
                            if (!old) return [msg];
                            if (old.some((m) => m.id === msg.id)) return old;
                            return [msg, ...old];
                        }
                    );
                });
            }

            // Reconcile authoritative workspace credit balance upon reconnect / recovery
            try {
                const credRes = await fetch("/api/workspace/credits", { headers });
                if (credRes.ok) {
                    const credData = await credRes.json();
                    if (credData.status && credData.data && typeof credData.data.balance === "number") {
                        const authoritativeBalance = Number(credData.data.balance);
                        updateUserCredits(authoritativeBalance);
                        queryClient.setQueriesData(
                            { queryKey: ["workspace", user.tenant_id, "credits"] },
                            (old: any) => (old ? { ...old, balance: authoritativeBalance } : { balance: authoritativeBalance })
                        );
                        queryClient.setQueriesData(
                            { queryKey: ["credits-overview"] },
                            (old: any) => (old ? { ...old, balance: authoritativeBalance } : { balance: authoritativeBalance })
                        );
                    }
                }
            } catch {
                // silent fallback
            }
        } catch (err) {
            console.warn("[RealtimeProvider] Missed events sync failed:", err);
        }
    }, [token, user, queryClient, updateUserCredits]);

    // Setup Laravel Echo listener with Pusher Channels
    useEffect(() => {
        if (!token || !user || !user.tenant_id) {
            disconnectEcho();
            setConnectionStatus("disconnected");
            return;
        }

        const workspaceId = Number(user.tenant_id);
        const echo = getEcho(token, workspaceId);

        if (!echo) {
            setConnectionStatus("fallback");
            return;
        }

        // Bind Pusher connection status events
        const pusher = (echo as any).connector?.pusher;
        if (pusher && pusher.connection) {
            const handleConnected = () => {
                setConnectionStatus("connected");
                // Run missed event recovery upon reconnection
                syncMissedEvents();
            };
            const handleConnecting = () => setConnectionStatus("connecting");
            const handleDisconnected = () => setConnectionStatus("disconnected");
            const handleUnavailable = () => setConnectionStatus("fallback");
            const handleFailed = () => setConnectionStatus("fallback");

            pusher.connection.bind("connected", handleConnected);
            pusher.connection.bind("connecting", handleConnecting);
            pusher.connection.bind("disconnected", handleDisconnected);
            pusher.connection.bind("unavailable", handleUnavailable);
            pusher.connection.bind("failed", handleFailed);
        }

        // Subscribe to workspace private channel
        const workspaceChannelName = `workspace.${workspaceId}`;
        const channel = echo.private(workspaceChannelName);

        // 1. Handle incoming message received
        const onMessageReceived = (payload: any) => {
            const msg = payload.message || payload;
            const conv = payload.conversation || {};
            const cid = Number(msg.customerId || msg.customer_id || conv.customerId || conv.customer_id);
            const msgId = Number(msg.id);

            if (!cid) return;

            // Prevent duplicate message processing
            if (msgId && processedMsgIdsRef.current.has(msgId)) {
                return;
            }
            if (msgId) {
                processedMsgIdsRef.current.add(msgId);
                channelRef.current?.postMessage({ msgId });
            }

            // Normalized message object matching frontend requirements
            const normalizedMsg: RealtimeMessageItem = {
                id: msgId,
                customerId: cid,
                customerName: msg.customerName || msg.customer_name || conv.customerName || "Customer",
                customerPhone: msg.customerPhone || msg.customer_phone || conv.customerPhone || "",
                message: msg.message || msg.body || "",
                direction: msg.direction || "inbound",
                status: msg.status || "delivered",
                intent: msg.intent || null,
                isRead: msg.isRead ?? 0,
                createdAt: msg.createdAt || msg.created_at || new Date().toISOString(),
            };

            // Update getCustomerConversations query cache immediately
            queryClient.setQueryData(
                ["getCustomerConversations", cid],
                (oldData: any[] | undefined) => {
                    if (!oldData) return [normalizedMsg];
                    if (oldData.some((m) => m.id === msgId)) return oldData;
                    return [...oldData, normalizedMsg].sort(
                        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    );
                }
            );

            // Update listConversations query cache immediately
            queryClient.setQueryData(
                ["listConversations"],
                (oldData: any[] | undefined) => {
                    if (!oldData) return [normalizedMsg];
                    const existingIndex = oldData.findIndex((m) => m.id === msgId);
                    if (existingIndex >= 0) return oldData;
                    return [normalizedMsg, ...oldData];
                }
            );

            // Invalidate notification queries to refresh top bell count
            queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });

            const isCurrentlyViewing = activeCustomerIdRef.current === cid && !document.hidden;

            if (isCurrentlyViewing) {
                // If viewing this chat, mark inbound message as read silently in the background
                fetch(`/api/conversations/${cid}/read`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "X-Tenant-Id": String(workspaceId),
                        Accept: "application/json",
                    },
                }).then(() => {
                    queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
                    queryClient.invalidateQueries({ queryKey: ["notifications"] });
                    queryClient.invalidateQueries({ queryKey: ["getConversationCounts"] });
                    queryClient.invalidateQueries({ queryKey: ["listConversations"] });
                }).catch(() => {});
            } else {
                // If not viewing or tab is hidden, trigger notification alerts
                const senderName = normalizedMsg.customerName || normalizedMsg.customerPhone || "New Message";
                const preview = normalizedMsg.message.length > 80 ? normalizedMsg.message.slice(0, 80) + "..." : normalizedMsg.message;

                // In-App Toast (with Quick Open action)
                notify.info(`Message from ${senderName}`, {
                    description: preview,
                    actionLabel: "Open",
                    onAction: () => {
                        setActiveCustomerId(cid);
                        router.push(`/conversations?customer_id=${cid}`);
                    },
                });

                // Native Desktop Browser Notification (grouped/debounced)
                if (document.hidden) {
                    const group = lastGroupedNotificationRef.current;
                    if (group.timer) clearTimeout(group.timer);

                    if (group.customerId === cid) {
                        group.count += 1;
                    } else {
                        group.customerId = cid;
                        group.count = 1;
                    }

                    group.timer = setTimeout(() => {
                        const notifBody = group.count > 1 ? `${group.count} new messages` : preview;
                        showBrowserNotification(`New message from ${senderName}`, notifBody, cid, msgId);
                        lastGroupedNotificationRef.current = { customerId: 0, count: 0, timer: null };
                    }, 400);
                }
            }
        };

        // 2. Handle outbound message sent (AI bot, automated reply, or another team member)
        const onMessageSent = (payload: any) => {
            const msg = payload.message || payload;
            const cid = Number(msg.customerId || msg.customer_id);
            const msgId = Number(msg.id);

            if (!cid) return;

            if (msgId && processedMsgIdsRef.current.has(msgId)) return;
            if (msgId) {
                processedMsgIdsRef.current.add(msgId);
                channelRef.current?.postMessage({ msgId });
            }

            const normalizedMsg: RealtimeMessageItem = {
                id: msgId,
                customerId: cid,
                customerName: msg.customerName || msg.customer_name || "Customer",
                customerPhone: msg.customerPhone || msg.customer_phone || "",
                message: msg.message || msg.body || "",
                direction: "outbound",
                status: msg.status || "sent",
                intent: msg.intent || null,
                isRead: 1,
                createdAt: msg.createdAt || msg.created_at || new Date().toISOString(),
            };

            // Update active chat messages
            queryClient.setQueryData(
                ["getCustomerConversations", cid],
                (oldData: any[] | undefined) => {
                    if (!oldData) return [normalizedMsg];
                    // Replace temp optimistic message if present, or append
                    const filtered = oldData.filter((m) => m.id !== msgId && !String(m.id).startsWith("temp_"));
                    return [...filtered, normalizedMsg].sort(
                        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    );
                }
            );

            // Update conversation list
            queryClient.setQueryData(
                ["listConversations"],
                (oldData: any[] | undefined) => {
                    if (!oldData) return [normalizedMsg];
                    if (oldData.some((m) => m.id === msgId)) return oldData;
                    return [normalizedMsg, ...oldData];
                }
            );
        };

        // 3. Handle message status updates (sent, delivered, read, failed)
        const onMessageStatus = (payload: any) => {
            const msgId = Number(payload.message_id || payload.id);
            const cid = Number(payload.customerId || payload.customer_id);
            const newStatus = payload.status;

            if (!cid || !msgId || !newStatus) return;

            queryClient.setQueryData(
                ["getCustomerConversations", cid],
                (oldData: any[] | undefined) => {
                    if (!oldData) return oldData;
                    return oldData.map((m) => (m.id === msgId ? { ...m, status: newStatus } : m));
                }
            );
        };

        // 3b. Handle realtime message reaction updated (WhatsApp reaction added/removed)
        const onMessageReactionUpdated = (payload: any) => {
            const cid = Number(payload.conversation_id || payload.customer_id || payload.customerId);
            const msgId = Number(payload.message_id || payload.messageId || payload.id);
            const reaction = payload.reaction || {};
            const action = payload.action || (reaction.emoji ? "added" : "removed");

            if (!cid || !msgId) return;

            queryClient.setQueryData(
                ["getCustomerConversations", cid],
                (oldData: any[] | undefined) => {
                    if (!oldData) return oldData;
                    return oldData.map((m) => {
                        if (m.id !== msgId) return m;
                        let currentReactions = Array.isArray(m.reactions) ? [...m.reactions] : [];
                        const reactorKey = reaction.contact_id
                            ? String(reaction.contact_id)
                            : (reaction.from || (reaction.user_id ? `user_${reaction.user_id}` : "default"));

                        currentReactions = currentReactions.filter((r: any) => {
                            const rKey = r.contact_id
                                ? String(r.contact_id)
                                : (r.from || (r.user_id ? `user_${r.user_id}` : "default"));
                            return rKey !== reactorKey;
                        });

                        if (action === "added" && reaction.emoji) {
                            currentReactions.push(reaction);
                        }

                        return {
                            ...m,
                            reactions: currentReactions,
                        };
                    });
                }
            );

            const isCurrentlyViewing = activeCustomerIdRef.current === cid && !document.hidden;
            if (!isCurrentlyViewing && action === "added" && reaction.emoji) {
                const reactorName = reaction.contact_name || "Customer";
                notify.info(`${reactorName} reacted ${reaction.emoji}`, {
                    description: `Reacted ${reaction.emoji} to your message`,
                    actionLabel: "Open",
                    onAction: () => {
                        setActiveCustomerId(cid);
                        router.push(`/conversations?customer_id=${cid}`);
                    },
                });
            }
        };

        // 4. Handle notification created (for Bell icon & preferences)
        const onNotificationCreated = (payload: any) => {
            handleIncomingNotification(payload);
        };

        // 5. Handle conversation status changed (Open / Pending / Resolved)
        const onConversationStatusChanged = (payload: any) => {
            const cid = Number(payload.customer_id || payload.customerId);
            const newStatus = payload.status || payload.new_status;
            if (!cid || !newStatus) return;

            queryClient.setQueryData(
                ["listConversations"],
                (oldData: any[] | undefined) => {
                    if (!oldData) return oldData;
                    return oldData.map((item) => {
                        const itemId = Number(item.customerId || item.id);
                        if (itemId === cid) {
                            return {
                                ...item,
                                conversationStatus: newStatus,
                                status: newStatus,
                                assignedTo: payload.assigned_to !== undefined ? payload.assigned_to : item.assignedTo,
                            };
                        }
                        return item;
                    });
                }
            );

            queryClient.invalidateQueries({ queryKey: ["getConversationCounts"] });
            queryClient.invalidateQueries({ queryKey: ["listConversations"] });
        };

        // 6. Handle new conversation created
        const onConversationCreated = (payload: any) => {
            queryClient.invalidateQueries({ queryKey: ["listConversations"] });
            queryClient.invalidateQueries({ queryKey: ["getConversationCounts"] });
        };

        // 7. Handle Realtime Credit Balance Updated
        const onCreditBalanceUpdated = (payload: any) => {
            const data = payload?.data || payload;
            const balance = Number(data.balance);
            const txId = Number(data.transaction_id || 0);
            const wid = Number(data.workspace_id || data.tenant_id);

            // Workspace isolation safety check
            if (wid && user?.tenant_id && wid !== Number(user.tenant_id)) {
                return;
            }

            if (isNaN(balance)) return;

            // Out-of-order check: prevent older events from overriding newer known balance
            if (txId && lastCreditTxIdRef.current && txId < lastCreditTxIdRef.current) {
                return;
            }
            if (txId) {
                lastCreditTxIdRef.current = txId;
            }

            // 1. Update AuthContext user credits immediately (updates Header, Badges, Modals)
            updateUserCredits(balance);

            // 2. Multi-tab coordination: Broadcast to other open browser tabs
            channelRef.current?.postMessage({ creditBalance: balance, txId });

            // 3. Authoritative TanStack React Query cache updates without full page refresh
            queryClient.setQueriesData(
                { queryKey: ["workspace", user?.tenant_id, "credits"] },
                (old: any) => (old ? { ...old, balance } : { balance })
            );
            queryClient.setQueriesData(
                { queryKey: ["credits-overview"] },
                (old: any) => (old ? { ...old, balance } : { balance })
            );
            queryClient.setQueriesData(
                { queryKey: ["billing/usage-summary"] },
                (old: any) => (old ? { ...old, balance } : old)
            );

            // Refresh transaction history queries in background if active
            queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["credit-history"] });
        };

        // Register listeners
        channel.listen(".whatsapp.message.received", onMessageReceived);
        channel.listen("whatsapp.message.received", onMessageReceived);
        channel.listen(".whatsapp.message.sent", onMessageSent);
        channel.listen("whatsapp.message.sent", onMessageSent);
        channel.listen(".whatsapp.message.status", onMessageStatus);
        channel.listen("whatsapp.message.status", onMessageStatus);
        channel.listen(".whatsapp.message.reaction_updated", onMessageReactionUpdated);
        channel.listen("whatsapp.message.reaction_updated", onMessageReactionUpdated);
        channel.listen(".notification.created", onNotificationCreated);
        channel.listen("notification.created", onNotificationCreated);
        channel.listen(".conversation.status_changed", onConversationStatusChanged);
        channel.listen("conversation.status_changed", onConversationStatusChanged);
        channel.listen(".conversation.created", onConversationCreated);
        channel.listen("conversation.created", onConversationCreated);
        channel.listen(".credit.balance.updated", onCreditBalanceUpdated);
        channel.listen("credit.balance.updated", onCreditBalanceUpdated);
        channel.listen(".CreditBalanceUpdated", onCreditBalanceUpdated);
        channel.listen("CreditBalanceUpdated", onCreditBalanceUpdated);

        // Also subscribe to private user notifications channel
        const userChannel = echo.private(`user.${user.id}.notifications`);
        userChannel.listen(".notification.created", onNotificationCreated);
        userChannel.listen("notification.created", onNotificationCreated);

        return () => {
            channel.stopListening(".whatsapp.message.received");
            channel.stopListening("whatsapp.message.received");
            channel.stopListening(".whatsapp.message.sent");
            channel.stopListening("whatsapp.message.sent");
            channel.stopListening(".whatsapp.message.status");
            channel.stopListening("whatsapp.message.status");
            channel.stopListening(".whatsapp.message.reaction_updated");
            channel.stopListening("whatsapp.message.reaction_updated");
            channel.stopListening(".notification.created");
            channel.stopListening("notification.created");
            channel.stopListening(".conversation.status_changed");
            channel.stopListening("conversation.status_changed");
            channel.stopListening(".conversation.created");
            channel.stopListening("conversation.created");
            channel.stopListening(".credit.balance.updated");
            channel.stopListening("credit.balance.updated");
            channel.stopListening(".CreditBalanceUpdated");
            channel.stopListening("CreditBalanceUpdated");
            userChannel.stopListening(".notification.created");
            userChannel.stopListening("notification.created");

            echo.leave(workspaceChannelName);
            echo.leave(`user.${user.id}.notifications`);
        };
    }, [token, user, queryClient, syncMissedEvents, showBrowserNotification, handleIncomingNotification, router, setActiveCustomerId, updateUserCredits]);

    // Fallback sync: If Pusher connection is down or disconnected, poll every 20 seconds
    useEffect(() => {
        if (!token || !user) return;
        if (connectionStatus === "connected") return; // Suspend polling when live WebSocket is active

        let isMounted = true;

        const runFallbackSync = async () => {
            if (!isMounted) return;
            await syncMissedEvents();

            // Also check notification unread count
            try {
                const headers: Record<string, string> = {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                };
                if (user.tenant_id) headers["X-Tenant-Id"] = String(user.tenant_id);

                const res = await fetch("/api/notifications/unread-count", { headers });
                if (!res.ok) return;

                const data = await res.json();
                if (data.status && typeof data.count === "number") {
                    const previous = lastUnreadCountRef.current;
                    lastUnreadCountRef.current = data.count;
                    if (previous !== null && data.count > previous) {
                        const notifRes = await fetch("/api/notifications?per_page=1&unread_only=1", { headers });
                        const notifData = await notifRes.json();
                        if (isMounted && notifData.status && notifData.notifications?.length > 0) {
                            handleIncomingNotification(notifData.notifications[0]);
                        }
                    }
                }
            } catch {
                // Ignore transient network hiccups
            }
        };

        const intervalId = setInterval(runFallbackSync, 20000);
        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [token, user, connectionStatus, syncMissedEvents, handleIncomingNotification]);

    return (
        <NotificationRealtimeContext.Provider
            value={{
                browserPermission,
                requestBrowserPermission,
                isSupported,
                connectionStatus,
                activeCustomerId,
                setActiveCustomerId,
                lastSyncTimestamp: lastSyncTimestampRef.current,
                syncMissedEvents,
            }}
        >
            {children}
        </NotificationRealtimeContext.Provider>
    );
}
