"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { notify, toast } from "@/lib/notifications";
import type { AppNotification } from "@/lib/api-client-react";

interface NotificationRealtimeContextType {
    browserPermission: NotificationPermission | "unsupported";
    requestBrowserPermission: () => Promise<NotificationPermission | "unsupported">;
    isSupported: boolean;
}

const NotificationRealtimeContext = createContext<NotificationRealtimeContextType>({
    browserPermission: "default",
    requestBrowserPermission: async () => "default",
    isSupported: false,
});

export function useNotificationRealtime() {
    return useContext(NotificationRealtimeContext);
}

export function NotificationRealtimeProvider({ children }: { children: React.ReactNode }) {
    const { user, token } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "unsupported">("default");
    const [isSupported, setIsSupported] = useState(false);

    const processedIdsRef = useRef<Set<number>>(new Set());
    const channelRef = useRef<BroadcastChannel | null>(null);
    const lastUnreadCountRef = useRef<number | null>(null);

    // Initialize browser permission status
    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            setIsSupported(true);
            setBrowserPermission(Notification.permission);
        } else {
            setIsSupported(false);
            setBrowserPermission("unsupported");
        }

        // Setup BroadcastChannel for cross-tab coordination
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            channelRef.current = new BroadcastChannel("connectly360_realtime_notifications");
            channelRef.current.onmessage = (event) => {
                const { id } = event.data || {};
                if (id) {
                    processedIdsRef.current.add(id);
                }
            };
        }

        return () => {
            channelRef.current?.close();
        };
    }, []);

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
                    description: "You'll now receive timely updates even when this tab is not active.",
                });
            } else if (permission === "denied") {
                notify.warning("Notifications blocked", {
                    description: "Please allow notifications in your browser settings to receive alerts.",
                });
            }
            return permission;
        } catch {
            return "default";
        }
    }, []);

    // Dispatch in-app toast and browser notification for an incoming item
    const handleIncomingNotification = useCallback(
        (notif: AppNotification, channels?: { toast?: boolean; browser?: boolean }) => {
            if (processedIdsRef.current.has(notif.id)) {
                return;
            }
            processedIdsRef.current.add(notif.id);

            // Inform other browser tabs so they don't fire duplicate browser notifications
            channelRef.current?.postMessage({ id: notif.id });

            const shouldToast = channels?.toast ?? true;
            const shouldBrowser = channels?.browser ?? true;

            // 1. In-App Toast
            if (shouldToast) {
                const actionOpts = notif.action_url
                    ? {
                          actionLabel: "View",
                          onAction: () => router.push(notif.action_url!),
                      }
                    : undefined;

                if (notif.priority === "critical") {
                    notify.error(notif.title, {
                        description: notif.message,
                        duration: 10000,
                        ...actionOpts,
                    });
                } else if (notif.priority === "high") {
                    notify.warning(notif.title, {
                        description: notif.message,
                        duration: 7000,
                        ...actionOpts,
                    });
                } else {
                    notify.info(notif.title, {
                        description: notif.message,
                        duration: 5000,
                        ...actionOpts,
                    });
                }
            }

            // 2. Browser System Notification
            if (
                shouldBrowser &&
                typeof window !== "undefined" &&
                "Notification" in window &&
                Notification.permission === "granted" &&
                document.hidden // only show native OS notification when tab is in background or minimized
            ) {
                try {
                    const browserNotif = new window.Notification(notif.title, {
                        body: notif.message,
                        icon: "/images/favicon.png",
                        tag: `connectly360-notif-${notif.id}`,
                    });

                    browserNotif.onclick = () => {
                        window.focus();
                        browserNotif.close();
                        if (notif.action_url) {
                            router.push(notif.action_url);
                        }
                    };
                } catch {
                    // Ignore browser notification dispatch errors
                }
            }

            // Invalidate React Query
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
        },
        [queryClient, router]
    );

    // Active polling & reconciliation to guarantee zero missed events
    useEffect(() => {
        if (!token || !user) return;

        let isMounted = true;

        const checkLatest = async () => {
            try {
                const headers: Record<string, string> = {
                    Authorization: `Bearer ${token}`,
                };
                if (user.tenant_id) {
                    headers["X-Tenant-Id"] = String(user.tenant_id);
                }

                const res = await fetch("/api/notifications/unread-count", { headers });
                if (!res.ok) return;

                const data = await res.json();
                if (data.status && typeof data.count === "number") {
                    const previous = lastUnreadCountRef.current;
                    lastUnreadCountRef.current = data.count;

                    // If count increased, fetch newest notification to trigger toast/browser notification
                    if (previous !== null && data.count > previous) {
                        const notifRes = await fetch("/api/notifications?per_page=1&unread_only=1", { headers });
                        const notifData = await notifRes.json();
                        if (isMounted && notifData.status && notifData.notifications?.length > 0) {
                            const latest = notifData.notifications[0];
                            handleIncomingNotification(latest);
                        }
                    }
                }
            } catch {
                // Ignore transient network hiccups
            }
        };

        // Initial check
        checkLatest();

        // Polling interval (every 12 seconds)
        const intervalId = setInterval(checkLatest, 12000);

        // Window focus reconciliation
        const handleFocus = () => {
            checkLatest();
            queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
        };
        window.addEventListener("focus", handleFocus);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
            window.removeEventListener("focus", handleFocus);
        };
    }, [token, user, queryClient, handleIncomingNotification]);

    return (
        <NotificationRealtimeContext.Provider
            value={{
                browserPermission,
                requestBrowserPermission,
                isSupported,
            }}
        >
            {children}
        </NotificationRealtimeContext.Provider>
    );
}
