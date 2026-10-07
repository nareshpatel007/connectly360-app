import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
    interface Window {
        Pusher: typeof Pusher;
    }
}

// Make Pusher available in window context for Echo client-side
if (typeof window !== "undefined") {
    window.Pusher = Pusher;
}

export type RealtimeConnectionStatus = "connected" | "connecting" | "reconnecting" | "disconnected" | "fallback";

let echoInstance: Echo<"pusher"> | null = null;
let currentToken: string | null = null;
let currentTenantId: number | null = null;

export function getEcho(token?: string | null, tenantId?: number | null): Echo<"pusher"> | null {
    if (typeof window === "undefined") return null;

    if (!token) {
        disconnectEcho();
        return null;
    }

    // Reuse active instance if token & tenant match
    if (echoInstance && currentToken === token && currentTenantId === tenantId) {
        return echoInstance;
    }

    // Otherwise clean up existing connection before creating a new one
    disconnectEcho();

    currentToken = token;
    currentTenantId = tenantId ?? null;

    try {
        const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
        const cluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || "ap2";

        if (!appKey) {
            if (process.env.NODE_ENV === "development") {
                console.warn("[Echo] NEXT_PUBLIC_PUSHER_APP_KEY is not defined. Pusher realtime disabled.");
            }
            return null;
        }

        echoInstance = new Echo<"pusher">({
            broadcaster: "pusher",
            key: appKey,
            cluster: cluster,
            forceTLS: true,
            authEndpoint: "/api/broadcasting/auth",
            auth: {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    ...(tenantId ? { "X-Tenant-Id": String(tenantId) } : {}),
                },
            },
        });

        // Setup development logging and connection monitoring
        const pusher = (echoInstance as any).connector?.pusher;
        if (pusher?.connection && process.env.NODE_ENV === "development") {
            pusher.connection.bind("state_change", (states: { previous: string; current: string }) => {
                console.log(`[Pusher] Connection state: ${states.previous} -> ${states.current}`);
            });
            pusher.connection.bind("error", (err: any) => {
                if (err?.status === 401 || err?.status === 403 || err?.error?.data?.code === 401) {
                    console.warn("[Pusher] Channel authorization rejected (401/403). Session token may be expired.");
                } else {
                    console.warn("[Pusher] Connection error:", err?.error?.data?.message || err?.message || err);
                }
            });
        }

        return echoInstance;
    } catch (err) {
        if (process.env.NODE_ENV === "development") {
            console.warn("[Echo] Failed to initialize Pusher Echo instance:", err);
        }
        return null;
    }
}

export function disconnectEcho(): void {
    if (echoInstance) {
        try {
            echoInstance.disconnect();
        } catch {
            // Ignore disconnect error
        }
        echoInstance = null;
    }
    currentToken = null;
    currentTenantId = null;
}
