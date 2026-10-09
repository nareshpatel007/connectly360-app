import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";

// Base API URL
const API_BASE = "/api";

export async function apiFetch(url: string, options: RequestInit = {}) {
    const headers = {
        ...options.headers,
    } as Record<string, string>;

    if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (typeof window !== "undefined") {
        const token = localStorage.getItem("auth_token");
        if (!headers["Authorization"] && token && token !== "undefined" && token !== "null" && token.split(".").length === 3) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        try {
            if (!headers["X-Tenant-Id"]) {
                const rawUser = localStorage.getItem("auth_user");
                if (rawUser) {
                    const parsedUser = JSON.parse(rawUser);
                    if (parsedUser?.tenant_id) {
                        headers["X-Tenant-Id"] = String(parsedUser.tenant_id);
                    }
                }
            }
        } catch {}
    }

    const res = await fetch(url, {
        ...options,
        headers,
    });

    return res;
}

// -------------------------------------------------------------
// Type Definitions
// -------------------------------------------------------------

export interface AnalyticsSummary {
    totalCustomers: number;
    newCustomersToday: number;
    totalLeads: number;
    newLeadsToday: number;
    totalMessages: number;
    totalInbound: number;
    totalOutbound: number;
    totalUnreadMessages: number;
    totalTeamMembers: number;
}

export interface Conversation {
    id: number;
    customerId: number;
    customerName?: string;
    customerPhone: string;
    email?: string;
    city?: string;
    stage?: string;
    conversationStatus?: "open" | "pending" | "resolved" | "closed";
    status?: string;
    assignedTo?: number | null;
    assignee?: { id: number; name: string; email: string } | null;
    message: string;
    lastMessage?: string;
    direction: "inbound" | "outbound";
    lastMessageDirection?: "inbound" | "outbound";
    lastMessageTime?: string;
    unreadCount?: number;
    intent?: string;
    isRead?: number;
    resolvedAt?: string | null;
    pendingAt?: string | null;
    isInside24hWindow?: boolean;
    secondsRemaining?: number;
    notes?: string | null;
    tags?: Array<{ id: number; name: string; color?: string }>;
    matchedMessage?: {
        id: number;
        message: string;
        caption?: string | null;
        type: string;
        createdAt: string;
    } | null;
    createdAt: string;

    // SLA / Response Time fields
    sla?: any;
    isOverdue?: boolean;
    slaStatus?: "on_track" | "warning" | "breached" | "met" | "disabled";
    waitingTimeSeconds?: number;
    waitingTimeFormatted?: string;
    firstResponseTimeSeconds?: number | null;
    averageResponseTimeSeconds?: number | null;

    // WhatsApp Rich Message Fields
    type?: string;
    mediaType?: string | null;
    media_type?: string | null;
    mediaUrl?: string | null;
    media_url?: string | null;
    mediaFilename?: string | null;
    media_filename?: string | null;
    filename?: string | null;
    mediaMimeType?: string | null;
    media_mime_type?: string | null;
    mediaSize?: number | null;
    media_size?: number | null;
    caption?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    locationName?: string | null;
    location_name?: string | null;
    locationAddress?: string | null;
    location_address?: string | null;
    contacts?: any[] | null;
    contact_data?: any[] | null;
    reactionEmoji?: string | null;
    reaction_emoji?: string | null;
    reactionTargetMessageId?: string | null;
    reaction_target_message_id?: string | null;
    replyToMessageId?: string | null;
    reply_to_message_id?: string | null;
    contextMessageId?: string | null;
    context_message_id?: string | null;
    interactiveType?: string | null;
    interactive_type?: string | null;
    interactiveData?: any | null;
    interactive_data?: any | null;
    templateName?: string | null;
    template_name?: string | null;
    templateData?: any | null;
    template_data?: any | null;
    orderData?: any | null;
    order_data?: any | null;
    reactions?: Array<{ emoji: string; from?: string; contact_name?: string; contact_id?: number; user_id?: number }>;
    quotedMessage?: {
        id?: number;
        message?: string;
        direction?: string;
        senderName?: string;
        type?: string;
    } | null;
    errorMessage?: string | null;
    error_message?: string | null;
}

export interface ConversationCounts {
    all: number;
    open: number;
    pending: number;
    resolved: number;
    unread: number;
    overdue?: number;
}

export interface InboxSettings {
    default_status: string;
    allow_pending: boolean;
    allow_resolved: boolean;
    auto_reopen_on_customer_reply: boolean;
    auto_reopen_pending: boolean;
    auto_close_enabled: boolean;
    auto_close_after: string;
    composer: {
        ai_copilot: boolean;
        templates: boolean;
        emoji: boolean;
        attachments: boolean;
        image: boolean;
        video: boolean;
        document: boolean;
        audio: boolean;
        quick_replies: boolean;
    };
    copilot: {
        enabled: boolean;
        suggest_reply: boolean;
        rewrite: boolean;
        shorten: boolean;
        professional: boolean;
        friendly: boolean;
        translate: boolean;
        summarize: boolean;
    };
}

export interface QuickReplyItem {
    id: number;
    tenant_id?: number | null;
    user_id?: number | null;
    title: string;
    shortcut: string;
    content: string;
    category?: string;
    scope?: "personal" | "team" | "global";
    is_active: boolean;
    user?: {
        id: number;
        name: string;
        email: string;
    } | null;
    created_at?: string;
    updated_at?: string;
}

export interface InternalNoteItem {
    id: number;
    tenant_id: number;
    user_id: number;
    customer_id: number;
    conversation_id?: number | null;
    content: string;
    mentions?: Array<{
        id: number;
        name: string;
        email?: string;
    }> | null;
    is_pinned: boolean;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    } | null;
}

export interface WorkspaceTag {
    id: number;
    name: string;
    slug?: string;
    color?: string;
    description?: string;
    routing_user_id?: number | null;
    routing_team_id?: number | null;
    routing_user?: { id: number; name: string; email: string } | null;
    routing_team?: { id: number; name: string } | null;
    usage_count?: number;
    created_at?: string;
}

export interface MessageStat {
    period: string;
    count: number;
    inbound: number;
    outbound: number;
}

export interface Lead {
    id: number;
    customerName?: string;
    phone: string;
    location?: string;
    status: "new" | "contacted" | "converted" | "lost";
    custom_attributes?: Record<string, string>;
    createdAt: string;
}

export interface LeadStageHistory {
    id: number;
    fromStatus: string | null;
    toStatus: string;
    userName?: string | null;
    createdAt: string;
}

export interface WhatsappStatus {
    status: "connected" | "pending" | "failed" | "disconnected";
    displayName?: string;
    phoneNumber?: string;
    wabaId?: string;
    businessId?: string;
    connectedAt?: string;
}

export interface Customer {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    phone: string;
    email?: string;
    city?: string;
    state?: string;
    country?: string;
    company?: string;
    source?: string;
    stage?: string;
    whatsapp_opt_in?: boolean;
    whatsapp_opt_in_at?: string;
    whatsapp_opt_in_source?: string;
    whatsapp_opt_in_evidence?: string;
    whatsapp_opt_in_categories?: string[];
    whatsapp_opt_out?: boolean;
    whatsapp_opt_out_at?: string;
    whatsapp_opt_out_reason?: string;
    is_blocked?: boolean;
    blocked_at?: string;
    blocked_reason?: string;
    blocked_notes?: string;
    notes?: string;
    custom_attributes?: Record<string, string>;
    messageCount: number;
    createdAt: string;
    last_interaction_at?: string;
}

export interface SuppressedNumber {
    id: number;
    tenant_id: number;
    phone: string;
    normalized_phone?: string;
    customer_id?: number | null;
    reason: string;
    notes?: string | null;
    blocked_by?: number | null;
    created_at: string;
    updated_at: string;
    customer?: {
        id: number;
        name?: string;
        phone: string;
    } | null;
    user?: {
        id: number;
        name?: string;
        email?: string;
    } | null;
}

export interface Product {
    id: number;
    name: string;
    unit: string;
    price: number;
    active: boolean;
}

export interface Settings {
    companyName: string;
    contactNumber?: string;
    deliveryInformation?: string;
    businessHours?: string;
}

// -------------------------------------------------------------
// Helper Query Keys
// -------------------------------------------------------------

export const getGetWhatsappStatusQueryKey = () => ["getWhatsappStatus"];
export const getListProductsQueryKey = () => ["listProducts"];
export const getGetSettingsQueryKey = () => ["getSettings"];
export const getListLeadsQueryKey = () => ["listLeads"];

// -------------------------------------------------------------
// API Hooks
// -------------------------------------------------------------

// Analytics
export function useGetAnalyticsSummary() {
    return useQuery<AnalyticsSummary>({
        queryKey: ["analyticsSummary"],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/analytics/summary`);
            if (!res.ok) throw new Error("Failed to fetch analytics summary");
            return res.json();
        },
    });
}

export function useGetMessageStats(params: { period: "daily" | "monthly" }, options?: any) {
    return useQuery<MessageStat[]>({
        queryKey: ["messageStats", params.period],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/analytics/messages?period=${params.period}`);
            if (!res.ok) throw new Error("Failed to fetch message stats");
            return res.json();
        },
        ...options?.query,
    });
}

export function useGetTopIntents() {
    return useQuery<{ intent: string; count: number }[]>({
        queryKey: ["topIntents"],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/analytics/intents`);
            if (!res.ok) throw new Error("Failed to fetch top intents");
            return res.json();
        },
    });
}

export interface ConversationFilterOptions {
    agents: Array<{ id: number; name: string; email: string }>;
    waba_accounts: Array<{ id: number; waba_id: string; phone_number_id: string; whatsapp_number: string; display_name: string; status: string }>;
    message_types: Array<{ id: string; name: string }>;
    statuses: Array<{ id: string; name: string }>;
    date_presets: Array<{ id: string; name: string }>;
}

export function useConversationFilterOptions() {
    return useQuery<{ success: boolean; data: ConversationFilterOptions }>({
        queryKey: ["conversationFilterOptions"],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/conversations/filter-options`);
            if (!res.ok) throw new Error("Failed to fetch conversation filter options");
            return res.json();
        },
        staleTime: 60_000,
    });
}

// Conversations
export function useListConversations(params?: {
    status?: string;
    search?: string;
    limit?: number;
    format?: string;
    tag?: string;
    tag_id?: number;
    agent?: string | number;
    team?: number;
    date_preset?: string;
    date_from?: string;
    date_to?: string;
    waba?: string | number;
    message_type?: string;
    sla?: string;
    view_id?: number;
}) {
    return useQuery<Conversation[]>({
        queryKey: [
            "listConversations",
            params?.status,
            params?.search,
            params?.limit,
            params?.format,
            params?.tag,
            params?.tag_id,
            params?.agent,
            params?.team,
            params?.date_preset,
            params?.date_from,
            params?.date_to,
            params?.waba,
            params?.message_type,
            params?.sla,
            params?.view_id,
        ],
        queryFn: async () => {
            const query = new URLSearchParams();
            if (params?.status) query.set("status", params.status);
            if (params?.search) query.set("search", params.search);
            if (params?.limit) query.set("limit", String(params.limit));
            if (params?.format) query.set("format", params.format);
            if (params?.tag && params.tag !== "all") query.set("tag", params.tag);
            if (params?.tag_id) query.set("tag_id", String(params.tag_id));
            if (params?.agent && params.agent !== "all") query.set("agent", String(params.agent));
            if (params?.team) query.set("team", String(params.team));
            if (params?.date_preset && params.date_preset !== "all_time") query.set("date_preset", params.date_preset);
            if (params?.date_from) query.set("date_from", params.date_from);
            if (params?.date_to) query.set("date_to", params.date_to);
            if (params?.waba && params.waba !== "all") query.set("waba", String(params.waba));
            if (params?.message_type && params.message_type !== "all") query.set("message_type", params.message_type);
            if (params?.sla) query.set("sla", params.sla);
            if (params?.view_id) query.set("view_id", String(params.view_id));

            const queryString = query.toString();
            const url = queryString ? `${API_BASE}/conversations?${queryString}` : `${API_BASE}/conversations`;
            const res = await apiFetch(url);
            if (!res.ok) throw new Error("Failed to fetch conversations");
            return res.json();
        },
    });
}

export function useGetConversationCounts() {
    return useQuery<{ success: boolean; counts: ConversationCounts }>({
        queryKey: ["getConversationCounts"],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/conversations/counts`);
            if (!res.ok) throw new Error("Failed to fetch conversation counts");
            return res.json();
        },
    });
}

export function useMarkConversationAsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (customerId: number) => {
            const res = await apiFetch(`${API_BASE}/conversations/${customerId}/read`, {
                method: "POST",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to mark conversation as read");
            }
            return res.json();
        },
        onSuccess: (_data, customerId) => {
            queryClient.setQueriesData<Conversation[]>(
                { queryKey: ["listConversations"] },
                (old) => {
                    if (!old) return old;
                    return old.map((t) =>
                        t.customerId === customerId ? { ...t, unreadCount: 0 } : t
                    );
                }
            );
            queryClient.invalidateQueries({ queryKey: ["getCustomerConversations", customerId] });
            queryClient.invalidateQueries({ queryKey: ["listConversations"] });
            queryClient.invalidateQueries({ queryKey: ["getConversationCounts"] });
            queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}

export function useUpdateConversationStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const res = await apiFetch(`${API_BASE}/conversations/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to update conversation status");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["listConversations"] });
            queryClient.invalidateQueries({ queryKey: ["getConversationCounts"] });
        },
    });
}

export function useAssignConversation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, assignedTo }: { id: number; assignedTo: number | null }) => {
            const res = await apiFetch(`${API_BASE}/conversations/${id}/assign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assigned_to: assignedTo }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to assign conversation");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["listConversations"] });
        },
    });
}

export function useAutoAssignConversation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await apiFetch(`${API_BASE}/conversations/${id}/auto-assign`, {
                method: "POST",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to auto-assign conversation");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["listConversations"] });
        },
    });
}

export function useCreateConversation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            customer_id?: number;
            phone?: string;
            first_name?: string;
            last_name?: string;
            email?: string;
            type?: "text" | "template";
            message?: string;
            template_name?: string;
            language?: string;
            components?: any[];
        }) => {
            const res = await apiFetch(`${API_BASE}/conversations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const err: any = new Error(data.message || "Failed to start conversation");
                err.requires_template = data.requires_template;
                err.error_code = data.error_code;
                throw err;
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["listConversations"] });
            queryClient.invalidateQueries({ queryKey: ["getConversationCounts"] });
        },
    });
}

export function useGetWindowStatus(customerId: number | null | undefined) {
    return useQuery<{
        success: boolean;
        inside_window: boolean;
        last_inbound_at: string | null;
        expires_at: string | null;
        seconds_remaining: number;
        requires_template: boolean;
    }>({
        queryKey: ["getWindowStatus", customerId],
        queryFn: async () => {
            if (!customerId) return { success: false, inside_window: false, last_inbound_at: null, expires_at: null, seconds_remaining: 0, requires_template: true };
            const res = await apiFetch(`${API_BASE}/conversations/${customerId}/window-status`);
            if (!res.ok) throw new Error("Failed to check 24-hour window status");
            return res.json();
        },
        enabled: !!customerId,
    });
}

export function useGetInboxSettings() {
    return useQuery<{ success: boolean; settings: InboxSettings }>({
        queryKey: ["getInboxSettings"],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/conversations/settings`);
            if (!res.ok) throw new Error("Failed to fetch inbox settings");
            return res.json();
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useCopilotAction() {
    return useMutation({
        mutationFn: async (payload: {
            action: string;
            text?: string;
            customer_id?: number;
            language?: string;
        }) => {
            const res = await apiFetch(`${API_BASE}/conversations/copilot`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Copilot action failed");
            }
            return res.json();
        },
    });
}

export function useListQuickReplies(params?: { search?: string; category?: string; scope?: string }) {
    return useQuery<QuickReplyItem[]>({
        queryKey: ["listQuickReplies", params],
        queryFn: async () => {
            const query = new URLSearchParams();
            if (params?.search) query.append("search", params.search);
            if (params?.category) query.append("category", params.category);
            if (params?.scope) query.append("scope", params.scope);

            const queryString = query.toString();
            const url = `${API_BASE}/quick-replies${queryString ? `?${queryString}` : ""}`;
            const res = await apiFetch(url);
            if (!res.ok) throw new Error("Failed to fetch quick replies");
            return res.json();
        },
    });
}

export function useQuickReplyCategories() {
    return useQuery<string[]>({
        queryKey: ["quickReplyCategories"],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/quick-replies/categories`);
            if (!res.ok) throw new Error("Failed to fetch quick reply categories");
            const data = await res.json();
            return data.data || [];
        },
    });
}

export function useCreateQuickReply() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { title: string; shortcut: string; content: string; category?: string; scope?: "personal" | "team" }) => {
            const res = await apiFetch(`${API_BASE}/quick-replies`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to create quick reply");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["listQuickReplies"] });
            queryClient.invalidateQueries({ queryKey: ["quickReplyCategories"] });
        },
    });
}

export function useUpdateQuickReply() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { id: number; title?: string; shortcut?: string; content?: string; category?: string; scope?: "personal" | "team"; is_active?: boolean }) => {
            const { id, ...body } = payload;
            const res = await apiFetch(`${API_BASE}/quick-replies/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to update quick reply");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["listQuickReplies"] });
            queryClient.invalidateQueries({ queryKey: ["quickReplyCategories"] });
        },
    });
}

export function useDeleteQuickReply() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await apiFetch(`${API_BASE}/quick-replies/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to delete quick reply");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["listQuickReplies"] });
            queryClient.invalidateQueries({ queryKey: ["quickReplyCategories"] });
        },
    });
}

// ==========================================
// INTERNAL NOTES HOOKS
// ==========================================

export function useCustomerNotes(customerId?: number) {
    return useQuery<InternalNoteItem[]>({
        queryKey: ["getCustomerNotes", customerId],
        queryFn: async () => {
            if (!customerId) return [];
            const res = await apiFetch(`${API_BASE}/customers/${customerId}/notes`);
            if (!res.ok) throw new Error("Failed to fetch customer notes");
            const data = await res.json();
            return data.data || [];
        },
        enabled: !!customerId,
    });
}

export function useConversationNotes(conversationId?: number) {
    return useQuery<InternalNoteItem[]>({
        queryKey: ["getConversationNotes", conversationId],
        queryFn: async () => {
            if (!conversationId) return [];
            const res = await apiFetch(`${API_BASE}/conversations/${conversationId}/notes`);
            if (!res.ok) throw new Error("Failed to fetch conversation notes");
            const data = await res.json();
            return data.data || [];
        },
        enabled: !!conversationId,
    });
}

export function useCreateCustomerNote() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ customerId, content, conversationId, is_pinned, mention_user_ids }: { customerId: number; content: string; conversationId?: number; is_pinned?: boolean; mention_user_ids?: number[] }) => {
            const res = await apiFetch(`${API_BASE}/customers/${customerId}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, conversation_id: conversationId, is_pinned, mention_user_ids }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to save internal note");
            }
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["getCustomerNotes", variables.customerId] });
            if (variables.conversationId) {
                queryClient.invalidateQueries({ queryKey: ["getConversationNotes", variables.conversationId] });
            }
            queryClient.invalidateQueries({ queryKey: ["getCustomerTimeline", variables.customerId] });
            queryClient.invalidateQueries({ queryKey: ["getCustomer", variables.customerId] });
        },
    });
}

export function useCreateConversationNote() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ conversationId, content, is_pinned, mention_user_ids }: { conversationId: number; content: string; is_pinned?: boolean; mention_user_ids?: number[] }) => {
            const res = await apiFetch(`${API_BASE}/conversations/${conversationId}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, is_pinned, mention_user_ids }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to save conversation note");
            }
            return res.json();
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["getConversationNotes", variables.conversationId] });
            const custId = data?.data?.customer_id;
            if (custId) {
                queryClient.invalidateQueries({ queryKey: ["getCustomerNotes", custId] });
                queryClient.invalidateQueries({ queryKey: ["getCustomerTimeline", custId] });
            }
        },
    });
}

export function useUpdateInternalNote() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, content, is_pinned, mention_user_ids }: { id: number; content?: string; is_pinned?: boolean; mention_user_ids?: number[] }) => {
            const res = await apiFetch(`${API_BASE}/internal-notes/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, is_pinned, mention_user_ids }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to update internal note");
            }
            return res.json();
        },
        onSuccess: (data) => {
            const note = data?.data;
            if (note?.customer_id) {
                queryClient.invalidateQueries({ queryKey: ["getCustomerNotes", note.customer_id] });
                queryClient.invalidateQueries({ queryKey: ["getCustomerTimeline", note.customer_id] });
            }
            if (note?.conversation_id) {
                queryClient.invalidateQueries({ queryKey: ["getConversationNotes", note.conversation_id] });
            }
        },
    });
}

export function useDeleteInternalNote() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, customerId, conversationId }: { id: number; customerId?: number; conversationId?: number }) => {
            const res = await apiFetch(`${API_BASE}/internal-notes/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to delete note");
            }
            return res.json();
        },
        onSuccess: (_, variables) => {
            if (variables.customerId) {
                queryClient.invalidateQueries({ queryKey: ["getCustomerNotes", variables.customerId] });
                queryClient.invalidateQueries({ queryKey: ["getCustomerTimeline", variables.customerId] });
            }
            if (variables.conversationId) {
                queryClient.invalidateQueries({ queryKey: ["getConversationNotes", variables.conversationId] });
            }
        },
    });
}



export type WhatsAppTemplateItem = MessageTemplate;


export function useListWorkspaceMembers() {
    return useQuery<{ id: number; name: string; email: string; role?: string }[]>({
        queryKey: ["listWorkspaceMembers"],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/workspace/members`);
            if (!res.ok) return [];
            const data = await res.json();
            if (Array.isArray(data)) return data;
            if (Array.isArray(data?.data)) return data.data;
            if (Array.isArray(data?.members)) return data.members;
            return [];
        },
    });
}

// Leads
export function useListLeads(params?: {
    status?: string;
    priority?: string;
    stage?: string;
    source?: string;
    assigned_user_id?: number;
    search?: string;
    view_id?: number;
}) {
    return useQuery<Lead[]>({
        queryKey: [getListLeadsQueryKey(), params],
        queryFn: async () => {
            const query = new URLSearchParams();
            if (params?.status) query.set("status", params.status);
            if (params?.priority) query.set("priority", params.priority);
            if (params?.stage) query.set("stage", params.stage);
            if (params?.source) query.set("source", params.source);
            if (params?.assigned_user_id) query.set("assigned_user_id", String(params.assigned_user_id));
            if (params?.search) query.set("search", params.search);
            if (params?.view_id) query.set("view_id", String(params.view_id));

            const queryString = query.toString();
            const url = queryString ? `${API_BASE}/leads?${queryString}` : `${API_BASE}/leads`;
            const res = await apiFetch(url);
            if (!res.ok) throw new Error("Failed to fetch leads");
            return res.json();
        },
    });
}

export function useUpdateLead() {
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Lead> }) => {
            const res = await apiFetch(`${API_BASE}/leads/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update lead");
            return res.json();
        },
    });
}

export function useCreateLead() {
    return useMutation({
        mutationFn: async ({ data }: { data: Omit<Lead, "id" | "createdAt"> }) => {
            const res = await apiFetch(`${API_BASE}/leads`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to create lead");
            return res.json();
        },
    });
}

export function useDeleteLead() {
    return useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            const res = await apiFetch(`${API_BASE}/leads/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete lead");
            return res.json();
        },
    });
}

export function useGetLeadHistory(leadId: number | null | undefined) {
    return useQuery<LeadStageHistory[]>({
        queryKey: ["getLeadHistory", leadId],
        queryFn: async () => {
            if (!leadId) return [];
            const res = await apiFetch(`${API_BASE}/leads/${leadId}/history`);
            if (!res.ok) throw new Error("Failed to fetch lead history");
            return res.json();
        },
        enabled: !!leadId,
    });
}



// WhatsApp Integration
export function useGetWhatsappStatus(options?: any) {
    return useQuery<WhatsappStatus>({
        queryKey: getGetWhatsappStatusQueryKey(),
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/whatsapp/status`);
            if (!res.ok) throw new Error("Failed to fetch WhatsApp status");
            return res.json();
        },
        ...options?.query,
    });
}

export function useExchangeMetaToken() {
    return useMutation({
        mutationFn: async ({ data }: { data: { code: string; redirect_uri?: string } }) => {
            const res = await apiFetch(`${API_BASE}/whatsapp/token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to exchange Meta token");
            return res.json();
        },
    });
}

export function useDisconnectWhatsapp() {
    return useMutation({
        mutationFn: async () => {
            const res = await apiFetch(`${API_BASE}/whatsapp/disconnect`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Failed to disconnect WhatsApp");
            return res.json();
        },
    });
}

export interface SendMessagePayload {
    to: string;
    body?: string;
    type?: string;
    media_id?: string;
    media_url?: string;
    filename?: string;
    caption?: string;
    latitude?: number;
    longitude?: number;
    location_name?: string;
    location_address?: string;
    contacts?: any[];
    reaction_emoji?: string;
    reaction_message_id?: string;
    emoji?: string;
    target_wamid?: string;
    message_id?: string;
    reply_to_message_id?: string;
    interactive_type?: string;
    interactive_data?: any;
    template_name?: string;
    template_language?: string;
    template_data?: any;
    force?: boolean;
    force_send?: boolean;
}

export function useSendMessage() {
    return useMutation({
        mutationFn: async ({ data }: { data: SendMessagePayload }) => {
            const res = await apiFetch(`${API_BASE}/whatsapp/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const err = new Error(errorData.message || "Failed to send WhatsApp message") as any;
                err.status = res.status;
                err.collision_detected = errorData.collision_detected;
                err.agent_name = errorData.agent_name;
                err.seconds_ago = errorData.seconds_ago;
                err.allow_force = errorData.allow_force;
                throw err;
            }
            return res.json();
        },
    });
}

export function useUploadMedia() {
    return useMutation({
        mutationFn: async ({ file, caption }: { file: File; caption?: string }) => {
            const formData = new FormData();
            formData.append("file", file);
            if (caption) formData.append("caption", caption);

            const res = await apiFetch(`${API_BASE}/whatsapp/media/upload`, {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to upload media");
            }
            return res.json();
        },
    });
}

export function useRetryMessage() {
    return useMutation({
        mutationFn: async ({ messageId }: { messageId: number | string }) => {
            const res = await apiFetch(`${API_BASE}/whatsapp/messages/${messageId}/retry`, {
                method: "POST",
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to retry message");
            }
            return res.json();
        },
    });
}

// Customers
export function useListCustomers(params?: {
    search?: string;
    city?: string;
    stage?: string;
    whatsapp_opt_in?: string;
    last_interaction?: string;
    created_within?: string;
    company?: string;
    sort_by?: string;
}) {
    return useQuery<Customer[]>({
        queryKey: ["listCustomers", params],
        queryFn: async () => {
            const query = new URLSearchParams();
            if (params?.search) query.set("search", params.search);
            if (params?.city) query.set("city", params.city);
            if (params?.stage) query.set("stage", params.stage);
            if (params?.whatsapp_opt_in) query.set("whatsapp_opt_in", params.whatsapp_opt_in);
            if (params?.last_interaction) query.set("last_interaction", params.last_interaction);
            if (params?.created_within) query.set("created_within", params.created_within);
            if (params?.company) query.set("company", params.company);
            if (params?.sort_by) query.set("sort_by", params.sort_by);

            const queryString = query.toString();
            const url = queryString ? `${API_BASE}/customers?${queryString}` : `${API_BASE}/customers`;
            const res = await apiFetch(url);
            if (!res.ok) throw new Error("Failed to fetch customers");
            return res.json();
        },
    });
}

export function useCustomerStats() {
    return useQuery<{
        total: number;
        opted_in: number;
        active_30d: number;
        new_this_month: number;
    }>({
        queryKey: ["customerStats"],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/customers/stats`);
            if (!res.ok) throw new Error("Failed to fetch customer stats");
            const data = await res.json();
            return data.data;
        },
    });
}

export function useCreateCustomer() {
    return useMutation({
        mutationFn: async ({ data }: { data: { name: string; phone: string; city?: string; firstMessage?: string } }) => {
            const res = await apiFetch(`${API_BASE}/customers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to create contact");
            }
            return res.json();
        },
    });
}

// Duplicate Detection & Merge
export interface DuplicateCandidate {
    id: number;
    name: string;
    first_name?: string;
    last_name?: string;
    phone: string;
    normalized_phone?: string;
    email?: string;
    city?: string;
    company?: string;
    stage?: string;
    whatsapp_opt_in?: boolean;
    conversations_count?: number;
    tasks_count?: number;
    leads_count?: number;
    match_reasons?: string[];
    confidence?: "high" | "medium";
    created_at?: string;
}

export interface DuplicateGroup {
    group_key: string;
    type: "phone" | "email";
    match_value: string;
    reason: string;
    contacts_count: number;
    contacts: DuplicateCandidate[];
}

export interface MergeContactParams {
    master_id: number;
    source_ids: number[];
    field_overrides?: {
        name?: string;
        phone?: string;
        email?: string;
        company?: string;
        city?: string;
        stage?: string;
    };
}

export function useCustomerDuplicates(customerId?: number) {
    return useQuery<DuplicateCandidate[]>({
        queryKey: ["getCustomerDuplicates", customerId],
        queryFn: async () => {
            if (!customerId) return [];
            const res = await apiFetch(`${API_BASE}/customers/${customerId}/duplicates`);
            if (!res.ok) return [];
            const json = await res.json();
            return json.data || [];
        },
        enabled: !!customerId,
    });
}

export function useTenantDuplicates() {
    return useQuery<DuplicateGroup[]>({
        queryKey: ["getTenantDuplicates"],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/customers/duplicates`);
            if (!res.ok) throw new Error("Failed to scan for duplicate contacts");
            const json = await res.json();
            return json.data || [];
        },
    });
}

export function useMergeContacts() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (params: MergeContactParams) => {
            const res = await apiFetch(`${API_BASE}/customers/merge`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to merge contacts");
            }
            return res.json();
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["listCustomers"] });
            queryClient.invalidateQueries({ queryKey: ["customerStats"] });
            queryClient.invalidateQueries({ queryKey: ["getTenantDuplicates"] });
            queryClient.invalidateQueries({ queryKey: ["getCustomer", variables.master_id] });
            queryClient.invalidateQueries({ queryKey: ["customerDetail", variables.master_id] });
            queryClient.invalidateQueries({ queryKey: ["getCustomerDuplicates", variables.master_id] });
            queryClient.invalidateQueries({ queryKey: ["getCustomerConversations", variables.master_id] });
            queryClient.invalidateQueries({ queryKey: ["getCustomerTimeline", variables.master_id] });
            queryClient.invalidateQueries({ queryKey: ["getCustomerNotes", variables.master_id] });
            for (const srcId of variables.source_ids) {
                queryClient.invalidateQueries({ queryKey: ["getCustomer", srcId] });
                queryClient.invalidateQueries({ queryKey: ["customerDetail", srcId] });
            }
        },
    });
}

// Automations
export interface AutomationRule {
    id: number;
    name?: string;
    trigger_type: string;
    action_type: string;
    keyword: string;
    reply: string;
    status: number | boolean;
    executed_count: number;
    created_at: string;
    updated_at: string;
}

export function useListAutomations() {
    return useQuery<AutomationRule[]>({
        queryKey: ["listAutomations"],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/automations`);
            if (!res.ok) throw new Error("Failed to fetch automation rules");
            return res.json();
        },
    });
}

export function useCreateAutomation() {
    return useMutation({
        mutationFn: async ({ data }: { data: { name: string; keyword: string; reply: string; trigger_type?: string; action_type?: string; status?: number | boolean } }) => {
            const res = await apiFetch(`${API_BASE}/automations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to create automation rule");
            }
            return res.json();
        },
    });
}

export function useUpdateAutomation() {
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Omit<AutomationRule, "id" | "executed_count" | "created_at" | "updated_at">> }) => {
            const res = await apiFetch(`${API_BASE}/automations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update automation rule");
            }
            return res.json();
        },
    });
}

export function useDeleteAutomation() {
    return useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            const res = await apiFetch(`${API_BASE}/automations/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to delete automation rule");
            }
            return res.json();
        },
    });
}

export function useGetCustomer(id: number, options?: any) {
    return useQuery<Customer>({
        queryKey: ["getCustomer", id],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/customers/${id}`);
            if (!res.ok) throw new Error("Failed to fetch customer");
            return res.json();
        },
        ...options?.query,
    });
}

export function useGetCustomerConversations(id: number, options?: any) {
    return useQuery<Conversation[]>({
        queryKey: ["getCustomerConversations", id],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/customers/${id}/conversations`);
            if (!res.ok) throw new Error("Failed to fetch customer conversations");
            return res.json();
        },
        ...options?.query,
    });
}

// Products
export function useListProducts() {
    return useQuery<Product[]>({
        queryKey: getListProductsQueryKey(),
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/products`);
            if (!res.ok) throw new Error("Failed to fetch products");
            return res.json();
        },
    });
}

export function useCreateProduct() {
    return useMutation({
        mutationFn: async ({ data }: { data: Omit<Product, "id"> }) => {
            const res = await apiFetch(`${API_BASE}/products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to create product");
            return res.json();
        },
    });
}

export function useUpdateProduct() {
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Product> }) => {
            const res = await apiFetch(`${API_BASE}/products/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update product");
            return res.json();
        },
    });
}

export function useDeleteProduct() {
    return useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            const res = await apiFetch(`${API_BASE}/products/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete product");
            return res.json();
        },
    });
}

// Settings
export function useGetSettings() {
    return useQuery<Settings>({
        queryKey: getGetSettingsQueryKey(),
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/settings`);
            if (!res.ok) throw new Error("Failed to fetch settings");
            return res.json();
        },
    });
}

export function useUpdateSettings() {
    return useMutation({
        mutationFn: async ({ data }: { data: Settings }) => {
            const res = await apiFetch(`${API_BASE}/settings`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update settings");
            return res.json();
        },
    });
}

// -------------------------------------------------------------
// Knowledge Base & AI Settings Types
// -------------------------------------------------------------
export interface KnowledgeBaseItem {
    id: number;
    tenant_id: number;
    question: string;
    answer: string;
    status: number | boolean;
    created_at: string;
    updated_at: string;
}

export interface AiSettings {
    ai_auto_reply: boolean;
    ai_system_prompt: string | null;
}

// -------------------------------------------------------------
// Knowledge Base & AI Settings Hooks
// -------------------------------------------------------------
export function useListKnowledgeBase() {
    return useQuery<KnowledgeBaseItem[]>({
        queryKey: ["listKnowledgeBase"],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/knowledge-base`);
            if (!res.ok) throw new Error("Failed to fetch knowledge base items");
            return res.json();
        },
    });
}

export function useCreateKnowledgeBase() {
    return useMutation({
        mutationFn: async ({ data }: { data: { question: string; answer: string; status?: boolean } }) => {
            const res = await apiFetch(`${API_BASE}/knowledge-base`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to create knowledge base item");
            return res.json();
        },
    });
}

export function useUpdateKnowledgeBase() {
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Omit<KnowledgeBaseItem, "id" | "tenant_id" | "created_at" | "updated_at">> }) => {
            const res = await apiFetch(`${API_BASE}/knowledge-base/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update knowledge base item");
            return res.json();
        },
    });
}

export function useDeleteKnowledgeBase() {
    return useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            const res = await apiFetch(`${API_BASE}/knowledge-base/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete knowledge base item");
            return res.json();
        },
    });
}

export function useGetAiSettings() {
    return useQuery<AiSettings>({
        queryKey: ["getAiSettings"],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/ai-settings`);
            if (!res.ok) throw new Error("Failed to fetch AI settings");
            return res.json();
        },
    });
}

export function useUpdateAiSettings() {
    return useMutation({
        mutationFn: async ({ data }: { data: AiSettings }) => {
            const res = await apiFetch(`${API_BASE}/ai-settings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update AI settings");
            return res.json();
        },
    });
}

export function useSimulateAiReply() {
    return useMutation({
        mutationFn: async ({ message, ai_system_prompt }: { message: string; ai_system_prompt?: string | null }) => {
            const res = await apiFetch(`${API_BASE}/ai-settings/simulate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, ai_system_prompt }),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to simulate AI response");
            }
            return res.json();
        },
    });
}

// -------------------------------------------------------------
// Message Template Types
// -------------------------------------------------------------
export interface MessageTemplate {
    id: number;
    tenant_id?: number;
    waba_id?: string | null;
    phone_number_id?: string | null;
    name: string;
    category: 'Marketing' | 'Utility' | 'Authentication';
    template_type?: string | null;
    language: string;
    header_type?: 'none' | 'text' | 'image' | 'video' | 'document' | null;
    header_content?: string | null;
    header_media_url?: string | null;
    header_handle?: string | null;
    body_text: string;
    footer_text?: string | null;
    buttons?: TemplateButton[] | null;
    status?: string;
    previous_status?: string | null;
    rejection_reason?: string | null;
    submission_error?: string | null;
    quality_score?: string | null;
    meta_template_id?: string | null;
    sample_values?: TemplateSampleValues | null;
    components_json?: any[] | null;
    meta_payload_json?: any | null;
    meta_response_json?: any | null;
    account_verified_name?: string | null;
    account_profile_picture_url?: string | null;
    company_name?: string | null;
    synced_at?: string | null;
    last_submitted_at?: string | null;
    created_at?: string;
    updated_at?: string;
}

export type TemplateButton =
  | { type: 'QUICK_REPLY'; text: string }
  | { type: 'URL'; text: string; url: string; example?: string }
  | { type: 'PHONE_NUMBER'; text: string; phone_number: string }
  | { type: 'COPY_CODE'; text?: string; example: string }
  | { type: 'OTP'; text?: string; otp_type?: 'COPY_CODE' | 'ONE_TAP' };

export interface TemplateSampleValues {
  body?: string[];
  header?: string[];
}

export interface TemplateFilters {
  waba_id?: string;
  category?: string;
  status?: string;
  language?: string;
  search?: string;
}

export interface WhatsAppAccountOption {
  id: number;
  waba_id: string;
  phone_number_id?: string | null;
  display_phone_number?: string | null;
  verified_name?: string | null;
  quality_rating?: string | null;
  status?: string;
  profile_picture_url?: string | null;
  company_name?: string | null;
}

export interface LibraryTemplate {
  id: string;
  title: string;
  description: string;
  category: 'Marketing' | 'Utility' | 'Authentication';
  template_type: string;
  header_type: 'none' | 'text' | 'image' | 'video' | 'document';
  header_content?: string;
  header_media_url?: string;
  body_text: string;
  sample_values?: TemplateSampleValues;
  footer_text?: string;
  buttons?: TemplateButton[];
}

// -------------------------------------------------------------
// Message Template Hooks
// -------------------------------------------------------------
export function useListTemplates(filters?: TemplateFilters) {
    return useQuery<MessageTemplate[]>({
        queryKey: ["listTemplates", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.waba_id && filters.waba_id !== 'all') params.set('waba_id', filters.waba_id);
            if (filters?.category && filters.category !== 'all') params.set('category', filters.category);
            if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
            if (filters?.language && filters.language !== 'all') params.set('language', filters.language);
            if (filters?.search) params.set('search', filters.search);

            const queryString = params.toString();
            const url = `${API_BASE}/whatsapp/templates${queryString ? `?${queryString}` : ''}`;
            const res = await apiFetch(url);
            if (!res.ok) throw new Error("Failed to fetch message templates");
            return res.json();
        },
    });
}

export function useGetTemplate(id: number | null) {
    return useQuery<MessageTemplate>({
        queryKey: ["getTemplate", id],
        enabled: !!id,
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/whatsapp/templates/${id}`);
            if (!res.ok) throw new Error("Failed to fetch template detail");
            return res.json();
        },
    });
}

export function useListTemplateAccounts() {
    return useQuery<WhatsAppAccountOption[]>({
        queryKey: ["listTemplateAccounts"],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/whatsapp/templates/accounts`);
            if (!res.ok) return [];
            const data = await res.json();
            if (Array.isArray(data)) return data;
            if (Array.isArray(data?.data)) return data.data;
            if (Array.isArray(data?.accounts)) return data.accounts;
            return [];
        },
    });
}

export function useListTemplateLibrary() {
    return useQuery<{ marketing: LibraryTemplate[]; utility: LibraryTemplate[]; authentication: LibraryTemplate[] }>({
        queryKey: ["listTemplateLibrary"],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/whatsapp/templates/library`);
            if (!res.ok) throw new Error("Failed to load template library");
            return res.json();
        },
    });
}

export function useCreateTemplate() {
    return useMutation({
        mutationFn: async ({ data }: { data: any }) => {
            const res = await apiFetch(`${API_BASE}/whatsapp/templates/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "Failed to submit template to Meta");
            }
            return res.json();
        },
    });
}

export function useSaveTemplateDraft() {
    return useMutation({
        mutationFn: async ({ data }: { data: any }) => {
            const res = await apiFetch(`${API_BASE}/whatsapp/templates/draft`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "Failed to save draft");
            }
            return res.json();
        },
    });
}

export function useUpdateTemplate() {
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            const res = await apiFetch(`${API_BASE}/whatsapp/templates/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "Failed to update template");
            }
            return res.json();
        },
    });
}

export function useDuplicateTemplate() {
    return useMutation({
        mutationFn: async ({ id, name }: { id: number; name?: string }) => {
            const res = await apiFetch(`${API_BASE}/whatsapp/templates/${id}/duplicate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "Failed to duplicate template");
            }
            return res.json();
        },
    });
}

export function usePreviewTemplatePayload() {
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await apiFetch(`${API_BASE}/whatsapp/templates/preview-payload`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "Failed to build preview payload");
            }
            return res.json();
        },
    });
}

export function useDeleteTemplate() {
    return useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            const res = await apiFetch(`${API_BASE}/whatsapp/templates/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "Failed to delete template");
            }
            return res.json();
        },
    });
}

export function useSyncTemplates() {
    return useMutation({
        mutationFn: async (params?: { waba_id?: string }) => {
            const res = await apiFetch(`${API_BASE}/whatsapp/templates/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params || {}),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "Failed to sync templates");
            }
            return res.json();
        },
    });
}

// -------------------------------------------------------------
// Campaign Types
// -------------------------------------------------------------

export interface Campaign {
    id: number;
    tenant_id: number;
    name: string;
    description?: string | null;
    channel: 'whatsapp' | 'email' | 'sms';
    whatsapp_account_id?: number | null;
    waba_id?: string | null;
    phone_number_id?: string | null;
    template_id?: number | null;
    template_name?: string | null;
    template_language?: string | null;
    template_category?: string | null;
    template_variables?: any | null;
    audience_type?: string | null;
    audience_filter?: any | null;
    status: 'draft' | 'validating' | 'ready' | 'scheduled' | 'queued' | 'running' | 'paused' | 'completed' | 'partially_completed' | 'failed' | 'cancelled';
    total_recipients: number;
    eligible_recipients: number;
    excluded_recipients: number;
    queued_count?: number;
    processing_count?: number;
    sent_count: number;
    delivered_count: number;
    read_count: number;
    failed_count: number;
    skipped_count?: number;
    credits_estimated?: number;
    credits_reserved?: number;
    credits_consumed?: number;
    credits_refunded?: number;
    progress_percentage?: number;
    delivery_rate?: number;
    read_rate?: number;
    rate_limit?: number;
    batch_size?: number;
    scheduled_at?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    paused_at?: string | null;
    cancelled_at?: string | null;
    created_at: string;
    updated_at: string;
    template?: any;
    whatsapp_account?: any;
    creator?: any;
    batches?: any[];
}

export interface CampaignRecipient {
    id: number;
    campaign_id: number;
    workspace_id?: number;
    customer_id?: number | null;
    phone: string;
    phone_number?: string;
    name?: string | null;
    template_variables?: any;
    status: 'pending' | 'validating' | 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'skipped' | 'cancelled';
    wamid?: string | null;
    external_message_id?: string | null;
    error_code?: string | null;
    error_message?: string | null;
    attempts?: number;
    credits_consumed?: number;
    sent_at?: string | null;
    delivered_at?: string | null;
    read_at?: string | null;
    failed_at?: string | null;
    contact_name?: string | null;
    contact_phone?: string | null;
    customer?: any;
    created_at: string;
}

export interface CampaignStats {
    total_campaigns: number;
    active_campaigns: number;
    scheduled_campaigns: number;
    messages_sent: number;
    delivered: number;
    read: number;
    failed: number;
    delivery_rate: number;
    read_rate: number;
    credits_used: number;
}

export interface AudienceValidationResult {
    total_contacts: number;
    eligible_count: number;
    excluded_count: number;
    reasons: {
        no_phone: number;
        invalid_phone: number;
        duplicate_phone: number;
        opted_out_or_blocked: number;
        no_marketing_opt_in: number;
    };
    sample_eligible: Array<{ id: number; name: string; phone: string }>;
    sample_excluded: Array<{ id: number; name: string; phone: string; reason: string }>;
}

export interface CampaignEstimateResult {
    audience_count: number;
    unit_credits: number;
    required_credits: number;
    available_credits: number;
    shortfall: number;
    has_enough_credits: boolean;
    market_name: string;
    category: string;
}

export interface CampaignAnalytics {
    campaign_id: number;
    name: string;
    status: string;
    channel: string;
    total_recipients: number;
    eligible_recipients: number;
    sent_count: number;
    delivered_count: number;
    read_count: number;
    failed_count: number;
    skipped_count: number;
    delivery_rate: number;
    read_rate: number;
    credits_reserved: number;
    credits_consumed: number;
    credits_refunded: number;
    started_at?: string | null;
    completed_at?: string | null;
    status_breakdown: Record<string, number>;
    error_breakdown: Record<string, number>;
}

// -------------------------------------------------------------
// Campaign Hooks
// -------------------------------------------------------------

export function useListCampaigns(params?: { status?: string; channel?: string; search?: string; page?: number; per_page?: number; view_id?: number }, options?: any) {
    return useQuery<Campaign[]>({
        queryKey: ["listCampaigns", params],
        queryFn: async () => {
            const query = new URLSearchParams();
            if (params?.status) query.set('status', params.status);
            if (params?.channel) query.set('channel', params.channel);
            if (params?.search) query.set('search', params.search);
            if (params?.page) query.set('page', String(params.page));
            if (params?.per_page) query.set('per_page', String(params.per_page));
            if (params?.view_id) query.set('view_id', String(params.view_id));

            const res = await apiFetch(`${API_BASE}/campaigns?${query.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch campaigns");
            const data = await res.json();
            return Array.isArray(data) ? data : (data.data || []);
        },
        ...options,
    });
}

export function useGetCampaignStats(options?: any) {
    return useQuery<CampaignStats>({
        queryKey: ["campaignStats"],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/campaigns/stats`);
            if (!res.ok) throw new Error("Failed to fetch campaign stats");
            const data = await res.json();
            return data.data || data;
        },
        ...options,
    });
}

export function useGetCampaign(id: number | string | null | undefined) {
    return useQuery<{ campaign: Campaign; recipients?: CampaignRecipient[] }>({
        queryKey: ["getCampaign", id],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/campaigns/${id}`);
            if (!res.ok) throw new Error("Failed to fetch campaign");
            const data = await res.json();
            if (data.campaign) return data;
            return { campaign: data.data || data, recipients: [] };
        },
        enabled: !!id,
    });
}

export function useCreateCampaign() {
    return useMutation({
        mutationFn: async ({ data }: { data: any }) => {
            const res = await apiFetch(`${API_BASE}/campaigns`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "Failed to create campaign");
            }
            const resData = await res.json();
            return resData.data || resData;
        },
    });
}

export function useUpdateCampaign() {
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            const res = await apiFetch(`${API_BASE}/campaigns/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "Failed to update campaign");
            }
            const resData = await res.json();
            return resData.data || resData;
        },
    });
}

export function useDeleteCampaign() {
    return useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            const res = await apiFetch(`${API_BASE}/campaigns/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "Failed to delete campaign");
            }
            return res.json();
        },
    });
}

export function useValidateAudience() {
    return useMutation({
        mutationFn: async (audienceFilter: any) => {
            const res = await apiFetch(`${API_BASE}/campaigns/validate-audience`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ audience_filter: audienceFilter }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to evaluate audience");
            }
            const resData = await res.json();
            return (resData.data || resData) as AudienceValidationResult;
        },
    });
}

export function useEstimateCampaignCredits(id: number | string | null | undefined) {
    return useQuery<CampaignEstimateResult>({
        queryKey: ["campaignEstimate", id],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/campaigns/${id}/estimate`);
            if (!res.ok) throw new Error("Failed to estimate campaign credits");
            const data = await res.json();
            return data.data || data;
        },
        enabled: !!id,
    });
}

export function usePrepareCampaign() {
    return useMutation({
        mutationFn: async ({ id, async = false }: { id: number; async?: boolean }) => {
            const res = await apiFetch(`${API_BASE}/campaigns/${id}/prepare`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ async }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to prepare campaign snapshot");
            }
            return res.json();
        },
    });
}

export function useLaunchCampaign() {
    return useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            const res = await apiFetch(`${API_BASE}/campaigns/${id}/launch`, {
                method: "POST",
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || "Failed to launch campaign");
            }
            const data = await res.json();
            return data.data || data;
        },
    });
}

export function useSendCampaign() {
    return useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            const res = await apiFetch(`${API_BASE}/campaigns/${id}/send`, {
                method: "POST",
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || "Failed to launch campaign");
            }
            return res.json();
        },
    });
}

export function useScheduleCampaign() {
    return useMutation({
        mutationFn: async ({ id, scheduledAt }: { id: number; scheduledAt: string }) => {
            const res = await apiFetch(`${API_BASE}/campaigns/${id}/schedule`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scheduled_at: scheduledAt }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to schedule campaign");
            }
            return res.json();
        },
    });
}

export function usePauseCampaign() {
    return useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            const res = await apiFetch(`${API_BASE}/campaigns/${id}/pause`, {
                method: "POST",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to pause campaign");
            }
            return res.json();
        },
    });
}

export function useResumeCampaign() {
    return useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            const res = await apiFetch(`${API_BASE}/campaigns/${id}/resume`, {
                method: "POST",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to resume campaign");
            }
            return res.json();
        },
    });
}

export function useCancelCampaign() {
    return useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            const res = await apiFetch(`${API_BASE}/campaigns/${id}/cancel`, {
                method: "POST",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to cancel campaign");
            }
            return res.json();
        },
    });
}

export function useRetryCampaignFailed() {
    return useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            const res = await apiFetch(`${API_BASE}/campaigns/${id}/retry-failed`, {
                method: "POST",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to retry campaign");
            }
            return res.json();
        },
    });
}

export function useDuplicateCampaign() {
    return useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            const res = await apiFetch(`${API_BASE}/campaigns/${id}/duplicate`, {
                method: "POST",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to duplicate campaign");
            }
            const data = await res.json();
            return data.data || data;
        },
    });
}

export function useGetCampaignAnalytics(id: number | string | null | undefined) {
    return useQuery<CampaignAnalytics>({
        queryKey: ["campaignAnalytics", id],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/campaigns/${id}/analytics`);
            if (!res.ok) throw new Error("Failed to fetch campaign analytics");
            const data = await res.json();
            return data.data || data;
        },
        enabled: !!id,
    });
}

export function useGetCampaignRecipients(id: number | string | null | undefined, params?: { status?: string; search?: string; page?: number; per_page?: number }) {
    return useQuery<{ data: CampaignRecipient[]; pagination: { current_page: number; last_page: number; per_page: number; total: number } }>({
        queryKey: ["campaignRecipients", id, params],
        queryFn: async () => {
            const query = new URLSearchParams();
            if (params?.status) query.set('status', params.status);
            if (params?.search) query.set('search', params.search);
            if (params?.page) query.set('page', String(params.page));
            if (params?.per_page) query.set('per_page', String(params.per_page));

            const res = await apiFetch(`${API_BASE}/campaigns/${id}/recipients?${query.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch campaign recipients");
            return res.json();
        },
        enabled: !!id,
    });
}

// -------------------------------------------------------------
// Workspace Company Profile Hooks
// -------------------------------------------------------------

export interface CompanyProfile {
    id: number;
    workspace_id: number;
    company_name: string;
    legal_name?: string | null;
    industry?: string | null;
    website_url?: string | null;
    business_phone?: string | null;
    address?: string | null;
    company_size?: string | null;
    founded_year?: number | null;
    description?: string | null;
    tax_id?: string | null;
    gst_number?: string | null;
    timezone?: string | null;
    currency?: string | null;
    logo_path?: string | null;
    logo_url?: string | null;
    display_logo_url?: string | null;
    media?: any[];
    created_at?: string;
    updated_at?: string;
}

export function useCompanyProfile(workspaceId?: number | null) {
    return useQuery<CompanyProfile | null>({
        queryKey: ["workspace", "company-profile", workspaceId],
        queryFn: async () => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/workspace/company-profile`, {
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to load company profile");
            }
            const data = await res.json();
            return data.data || null;
        },
        enabled: workspaceId !== undefined && workspaceId !== null,
        staleTime: 60 * 1000,
    });
}

export function useUpdateCompanyProfile(workspaceId?: number | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<CompanyProfile>) => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/workspace/company-profile`, {
                method: "PATCH",
                headers,
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const error: any = new Error(data.message || "Failed to update company profile");
                error.errors = data.errors;
                error.status = res.status;
                throw error;
            }
            return data.data as CompanyProfile;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(["workspace", "company-profile", workspaceId], updated);
            queryClient.invalidateQueries({ queryKey: ["workspace", "company-profile", workspaceId] });
        },
    });
}

export function useUploadCompanyLogo(workspaceId?: number | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("logo", file);
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/workspace/company-profile/logo`, {
                method: "POST",
                headers,
                body: formData,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const error: any = new Error(data.message || "Failed to upload logo");
                error.errors = data.errors;
                error.status = res.status;
                throw error;
            }
            return data.data as CompanyProfile;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(["workspace", "company-profile", workspaceId], updated);
            queryClient.invalidateQueries({ queryKey: ["workspace", "company-profile", workspaceId] });
        },
    });
}

export function useRemoveCompanyLogo(workspaceId?: number | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/workspace/company-profile/logo`, {
                method: "DELETE",
                headers,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const error: any = new Error(data.message || "Failed to remove logo");
                error.status = res.status;
                throw error;
            }
            return data.data as CompanyProfile;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(["workspace", "company-profile", workspaceId], updated);
            queryClient.invalidateQueries({ queryKey: ["workspace", "company-profile", workspaceId] });
        },
    });
}

// -------------------------------------------------------------
// Notification System Interfaces & Hooks
// -------------------------------------------------------------

export interface AppNotification {
    id: number;
    tenant_id?: number;
    workspace_id: number;
    user_id: number | null;
    type: string;
    title: string;
    message: string;
    priority: "low" | "normal" | "high" | "critical";
    data?: any;
    action_url: string | null;
    dedup_key?: string | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
}

export interface NotificationPreferenceItem {
    key: string;
    category: string;
    title: string;
    description: string;
    priority: "low" | "normal" | "high" | "critical";
    action_url: string | null;
    locked: boolean;
    in_app: boolean;
    toast: boolean;
    browser: boolean;
    email: boolean;
    has_custom?: boolean;
}

export interface NotificationCategoryGroup {
    id: string;
    name: string;
    description: string;
    icon: string;
    items: NotificationPreferenceItem[];
}

export interface NotificationPreferencesPayload {
    workspace_id: number;
    user_id: number;
    categories: NotificationCategoryGroup[];
    preferences: NotificationPreferenceItem[];
}

export function useNotifications(options?: {
    unreadOnly?: boolean;
    page?: number;
    perPage?: number;
    category?: string;
    priority?: string;
    workspaceId?: number | null;
}) {
    const unreadOnly = options?.unreadOnly ?? false;
    const page = options?.page ?? 1;
    const perPage = options?.perPage ?? 20;
    const category = options?.category;
    const priority = options?.priority;
    const workspaceId = options?.workspaceId;

    return useQuery({
        queryKey: ["notifications", { unreadOnly, page, perPage, category, priority, workspaceId }],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (unreadOnly) params.set("unread_only", "1");
            if (page) params.set("page", String(page));
            if (perPage) params.set("per_page", String(perPage));
            if (category) params.set("category", category);
            if (priority) params.set("priority", priority);

            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }

            const res = await apiFetch(`${API_BASE}/notifications?${params.toString()}`, { headers });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to fetch notifications");
            }
            return {
                notifications: (data.notifications || []) as AppNotification[],
                unreadCount: (data.unread_count ?? 0) as number,
                pagination: data.pagination,
            };
        },
        staleTime: 10 * 1000,
    });
}

export function useUnreadNotificationCount(workspaceId?: number | null) {
    return useQuery({
        queryKey: ["notifications", "unread-count", workspaceId],
        queryFn: async () => {
            const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
            if (!token) return 0;
            const headers: Record<string, string> = {
                Authorization: `Bearer ${token}`,
            };
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            try {
                const res = await apiFetch(`${API_BASE}/notifications/unread-count`, { headers });
                if (!res.ok) {
                    return 0;
                }
                const data = await res.json().catch(() => ({}));
                return (data.count ?? 0) as number;
            } catch {
                return 0;
            }
        },
        enabled: typeof window !== "undefined" ? Boolean(localStorage.getItem("auth_token")) : false,
        staleTime: 30 * 1000,
        refetchInterval: 30 * 1000, // automatic background heartbeat poll
        retry: false,
    });
}

export function useNotificationPreferences(workspaceId?: number | null) {
    return useQuery({
        queryKey: ["notification-preferences", workspaceId],
        queryFn: async () => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/notification-preferences`, { headers });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to fetch notification preferences");
            }
            return data.data as NotificationPreferencesPayload;
        },
        staleTime: 60 * 1000,
    });
}

export function useUpdateNotificationPreferences(workspaceId?: number | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (preferences: Partial<NotificationPreferenceItem>[]) => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/notification-preferences`, {
                method: "PUT",
                headers,
                body: JSON.stringify({ preferences }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to update notification preferences");
            }
            return data.data as NotificationPreferencesPayload;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(["notification-preferences", workspaceId], updated);
            queryClient.invalidateQueries({ queryKey: ["notification-preferences", workspaceId] });
        },
    });
}

export function useMarkNotificationRead(workspaceId?: number | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/notifications/${id}/read`, {
                method: "POST",
                headers,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to mark notification as read");
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
        },
    });
}

export function useMarkAllNotificationsRead(workspaceId?: number | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/notifications/read-all`, {
                method: "POST",
                headers,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to mark all as read");
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
        },
    });
}

export function useDeleteNotification(workspaceId?: number | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/notifications/${id}`, {
                method: "DELETE",
                headers,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to delete notification");
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
        },
    });
}

// -------------------------------------------------------------
// Outbound Webhooks (Developer Platform)
// -------------------------------------------------------------

export interface WebhookEndpointItem {
    id: number;
    workspace_id: number;
    name: string;
    url: string;
    status: "active" | "inactive" | "failing" | "disabled";
    description?: string | null;
    events: string[];
    masked_secret?: string;
    secret?: string; // One-time plain secret only present on creation or rotation
    custom_headers?: Record<string, string> | null;
    failure_count: number;
    success_count: number;
    consecutive_failures: number;
    last_delivery_at?: string | null;
    last_success_at?: string | null;
    last_failure_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface WebhookEventDefinition {
    key: string;
    label: string;
    description: string;
    category: string;
    version: string;
    available: boolean;
}

export interface WebhookDeliveryAttemptItem {
    id: number;
    webhook_delivery_id: number;
    attempt_number: number;
    started_at: string;
    completed_at?: string | null;
    http_status?: number | null;
    duration_ms?: number | null;
    request_headers?: Record<string, any> | null;
    request_body_preview?: any;
    response_headers?: Record<string, any> | null;
    response_body?: string | null;
    response_truncated?: boolean;
    error_type?: string | null;
    error_message?: string | null;
    created_at: string;
}

export interface WebhookDeliveryLogItem {
    id: number;
    workspace_id: number;
    webhook_endpoint_id: number;
    event_id: string;
    event_type: string;
    endpoint_name?: string;
    endpoint_url?: string;
    status: "pending" | "processing" | "delivered" | "retrying" | "failed" | "cancelled";
    http_status?: number | null;
    duration_ms?: number | null;
    attempt_count: number;
    next_retry_at?: string | null;
    delivered_at?: string | null;
    failed_at?: string | null;
    payload?: any;
    request_headers?: Record<string, any> | null;
    response_headers?: Record<string, any> | null;
    response_body?: string | null;
    response_truncated?: boolean;
    error_type?: string | null;
    error_message?: string | null;
    created_at: string;
    attempts?: WebhookDeliveryAttemptItem[];
    endpoint?: WebhookEndpointItem;
}

export interface WebhookLogsResponse {
    data: WebhookDeliveryLogItem[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

export interface WebhookTestResult {
    success: boolean;
    http_status?: number | null;
    duration_ms?: number | null;
    error_message?: string | null;
    event_id?: string;
    message?: string;
}

// Webhooks List Query
export function useWebhookEndpoints(workspaceId?: number | null) {
    return useQuery<WebhookEndpointItem[]>({
        queryKey: ["webhooks", workspaceId],
        queryFn: async () => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/developer/webhooks`, { headers });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to load webhook endpoints");
            }
            return data.data || [];
        },
    });
}

// Webhook Event Registry Query
export function useWebhookEvents(workspaceId?: number | null) {
    return useQuery<Record<string, WebhookEventDefinition[]>>({
        queryKey: ["webhook-events", workspaceId],
        queryFn: async () => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/developer/webhooks/events`, { headers });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to load webhook event definitions");
            }
            return data.categories || {};
        },
        staleTime: 1000 * 60 * 30, // 30 mins
    });
}

// Create Webhook Mutation
export function useCreateWebhookEndpoint(workspaceId?: number | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            name: string;
            url: string;
            events: string[];
            description?: string;
            custom_headers?: Record<string, string>;
        }) => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/developer/webhooks`, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to create webhook endpoint");
            }
            return data.data as WebhookEndpointItem;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["webhooks", workspaceId] });
        },
    });
}

// Update Webhook Mutation
export function useUpdateWebhookEndpoint(workspaceId?: number | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            id,
            ...payload
        }: {
            id: number;
            name?: string;
            url?: string;
            events?: string[];
            description?: string;
            custom_headers?: Record<string, string>;
        }) => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/developer/webhooks/${id}`, {
                method: "PUT",
                headers,
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to update webhook endpoint");
            }
            return data.data as WebhookEndpointItem;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["webhooks", workspaceId] });
        },
    });
}

// Delete Webhook Mutation
export function useDeleteWebhookEndpoint(workspaceId?: number | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/developer/webhooks/${id}`, {
                method: "DELETE",
                headers,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to delete webhook endpoint");
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["webhooks", workspaceId] });
        },
    });
}

// Rotate Secret Mutation
export function useRotateWebhookSecret(workspaceId?: number | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/developer/webhooks/${id}/rotate-secret`, {
                method: "POST",
                headers,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to regenerate secret");
            }
            return data.data as WebhookEndpointItem;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["webhooks", workspaceId] });
        },
    });
}

// Toggle Webhook Status (Enable / Disable)
export function useToggleWebhookStatus(workspaceId?: number | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, action }: { id: number; action: "enable" | "disable" }) => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/developer/webhooks/${id}/${action}`, {
                method: "POST",
                headers,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || `Failed to ${action} webhook endpoint`);
            }
            return data.data as WebhookEndpointItem;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["webhooks", workspaceId] });
        },
    });
}

// Test Webhook Ping Mutation
export function useTestWebhookPing(workspaceId?: number | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/developer/webhooks/${id}/test`, {
                method: "POST",
                headers,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Webhook test delivery failed");
            }
            return data as { success: boolean; message: string; delivery: WebhookDeliveryLogItem; attempt: WebhookDeliveryAttemptItem };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["webhooks", workspaceId] });
            queryClient.invalidateQueries({ queryKey: ["webhook-logs", workspaceId] });
        },
    });
}

// Webhook Delivery Logs Query
export function useWebhookLogs(options: {
    workspaceId?: number | null;
    page?: number;
    per_page?: number;
    endpoint_id?: number | string;
    event_type?: string;
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
}) {
    const {
        workspaceId,
        page = 1,
        per_page = 25,
        endpoint_id,
        event_type,
        status,
        search,
        date_from,
        date_to,
    } = options;

    return useQuery<WebhookLogsResponse>({
        queryKey: ["webhook-logs", { workspaceId, page, per_page, endpoint_id, event_type, status, search, date_from, date_to }],
        queryFn: async () => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }

            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("per_page", String(per_page));
            if (endpoint_id) params.set("endpoint_id", String(endpoint_id));
            if (event_type && event_type !== "all") params.set("event_type", event_type);
            if (status && status !== "all") params.set("status", status);
            if (search) params.set("search", search);
            if (date_from) params.set("date_from", date_from);
            if (date_to) params.set("date_to", date_to);

            const res = await apiFetch(`${API_BASE}/developer/webhook-logs?${params.toString()}`, { headers });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to load webhook delivery logs");
            }
            return data;
        },
    });
}

// Single Webhook Log Query with detailed attempts
export function useWebhookLogDetail(id?: number | null, workspaceId?: number | null) {
    return useQuery<WebhookDeliveryLogItem>({
        queryKey: ["webhook-log-detail", id, workspaceId],
        enabled: !!id,
        queryFn: async () => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/developer/webhook-logs/${id}`, { headers });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to load delivery log detail");
            }
            return data.data;
        },
    });
}

// Retry Delivery Mutation
export function useRetryWebhookDelivery(workspaceId?: number | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/developer/webhook-logs/${id}/retry`, {
                method: "POST",
                headers,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to queue delivery retry");
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["webhook-logs", workspaceId] });
            queryClient.invalidateQueries({ queryKey: ["webhook-log-detail"] });
            queryClient.invalidateQueries({ queryKey: ["webhooks", workspaceId] });
        },
    });
}

// -------------------------------------------------------------
// WhatsApp Business Profile Management
// -------------------------------------------------------------

export interface WhatsAppProfileCategory {
    value: string;
    label: string;
}

export interface WhatsAppAvailableAccount {
    id: number;
    phone_number: string;
    display_name: string;
    phone_number_id: string;
    status: string;
}

export interface WhatsAppBusinessProfile {
    business_name: string | null;
    business_name_status: string;
    business_name_notice: string;
    about: string;
    description: string;
    category: string;
    category_label: string;
    categories: WhatsAppProfileCategory[];
    address: string;
    email: string;
    websites: string[];
    profile_picture_url: string | null;
    phone_number: string | null;
    phone_number_id: string | null;
    waba_id: string | null;
    status: "connected" | "disconnected" | "needs_attention";
    status_notice: string | null;
    quality_rating: string | null;
    messaging_limit: string | null;
    can_edit: boolean;
    is_test_mode: boolean;
    available_accounts: WhatsAppAvailableAccount[];
    last_synced_at: string | null;
}

export interface UpdateWhatsAppProfilePayload {
    phone_number_id?: string;
    about?: string;
    description?: string;
    category?: string;
    address?: string;
    email?: string;
    websites?: string[];
}

export function useWhatsAppBusinessProfile(phoneNumberId?: string, workspaceId?: number | null) {
    return useQuery<WhatsAppBusinessProfile>({
        queryKey: ["whatsapp-business-profile", workspaceId ?? null, phoneNumberId ?? null],
        queryFn: async () => {
            const queryParams = new URLSearchParams();
            if (phoneNumberId) queryParams.set("phone_number_id", phoneNumberId);

            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }

            const url = `${API_BASE}/whatsapp/business-profile${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
            const res = await apiFetch(url, { headers });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to load WhatsApp business profile");
            }
            return data.data;
        },
        staleTime: 60 * 1000,
    });
}

export function useUpdateWhatsAppBusinessProfile(workspaceId?: number | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: UpdateWhatsAppProfilePayload) => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/whatsapp/business-profile`, {
                method: "PUT",
                headers,
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to update WhatsApp business profile");
            }
            return data.data as WhatsAppBusinessProfile;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["whatsapp-business-profile"] });
        },
    });
}

export function useUploadWhatsAppBusinessProfilePicture(workspaceId?: number | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ file, phoneNumberId }: { file: File; phoneNumberId?: string }) => {
            const formData = new FormData();
            formData.append("profile_picture", file);
            if (phoneNumberId) {
                formData.append("phone_number_id", phoneNumberId);
            }

            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }

            const res = await apiFetch(`${API_BASE}/whatsapp/business-profile/profile-picture`, {
                method: "POST",
                headers,
                body: formData,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to upload WhatsApp profile picture");
            }
            return data.data as WhatsAppBusinessProfile;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["whatsapp-business-profile"] });
        },
    });
}

export function useSyncWhatsAppBusinessProfile(workspaceId?: number | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (phoneNumberId?: string) => {
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/whatsapp/business-profile/sync`, {
                method: "POST",
                headers,
                body: JSON.stringify({ phone_number_id: phoneNumberId }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to sync profile from WhatsApp");
            }
            return data.data as WhatsAppBusinessProfile;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["whatsapp-business-profile"] });
        },
    });
}

export function useCustomerOptIn() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            customerId,
            source = "manual_admin",
            evidence,
            categories = ["MARKETING", "UTILITY"],
        }: {
            customerId: number;
            source?: string;
            evidence?: string;
            categories?: string[];
        }) => {
            const res = await apiFetch(`/api/contacts/${customerId}/opt-in`, {
                method: "POST",
                body: JSON.stringify({ source, evidence, categories }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to record customer opt-in");
            }
            return data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["customerDetail", variables.customerId] });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.invalidateQueries({ queryKey: ["getCustomerTimeline", variables.customerId] });
        },
    });
}

export function useCustomerOptOut() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            customerId,
            reason = "user_request",
        }: {
            customerId: number;
            reason?: string;
        }) => {
            const res = await apiFetch(`/api/contacts/${customerId}/opt-out`, {
                method: "POST",
                body: JSON.stringify({ reason }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to record customer opt-out");
            }
            return data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["customerDetail", variables.customerId] });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.invalidateQueries({ queryKey: ["getCustomerTimeline", variables.customerId] });
        },
    });
}

export function useBulkCustomerOptIn() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            ids,
            source = "bulk_action",
            evidence,
        }: {
            ids: number[];
            source?: string;
            evidence?: string;
        }) => {
            const res = await apiFetch(`/api/contacts/bulk-opt-in`, {
                method: "POST",
                body: JSON.stringify({ ids, source, evidence }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to bulk opt-in contacts");
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });
}

export function useBulkCustomerOptOut() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            ids,
            reason = "bulk_suppression",
        }: {
            ids: number[];
            reason?: string;
        }) => {
            const res = await apiFetch(`/api/contacts/bulk-opt-out`, {
                method: "POST",
                body: JSON.stringify({ ids, reason }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to bulk opt-out contacts");
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });
}

// -------------------------------------------------------------
// Blocklist & Suppression Hooks
// -------------------------------------------------------------

export function useBlockContact() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            customerId,
            reason = "manual_block",
            notes,
        }: {
            customerId: number;
            reason?: string;
            notes?: string;
        }) => {
            const res = await apiFetch(`/api/contacts/${customerId}/block`, {
                method: "POST",
                body: JSON.stringify({ reason, notes }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to block contact");
            }
            return data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["customerDetail", variables.customerId] });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.invalidateQueries({ queryKey: ["getCustomerTimeline", variables.customerId] });
            queryClient.invalidateQueries({ queryKey: ["suppressionList"] });
        },
    });
}

export function useUnblockContact() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ customerId }: { customerId: number }) => {
            const res = await apiFetch(`/api/contacts/${customerId}/unblock`, {
                method: "POST",
                body: JSON.stringify({}),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to unblock contact");
            }
            return data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["customerDetail", variables.customerId] });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.invalidateQueries({ queryKey: ["getCustomerTimeline", variables.customerId] });
            queryClient.invalidateQueries({ queryKey: ["suppressionList"] });
        },
    });
}

export function useBulkBlockContacts() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            ids,
            reason = "manual_block",
            notes,
        }: {
            ids: number[];
            reason?: string;
            notes?: string;
        }) => {
            const res = await apiFetch(`/api/contacts/bulk-block`, {
                method: "POST",
                body: JSON.stringify({ ids, reason, notes }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to bulk block contacts");
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.invalidateQueries({ queryKey: ["suppressionList"] });
        },
    });
}

export function useBulkUnblockContacts() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ ids }: { ids: number[] }) => {
            const res = await apiFetch(`/api/contacts/bulk-unblock`, {
                method: "POST",
                body: JSON.stringify({ ids }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to bulk unblock contacts");
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.invalidateQueries({ queryKey: ["suppressionList"] });
        },
    });
}

export function useSuppressionList(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    reason?: string;
}) {
    const page = params?.page ?? 1;
    const perPage = params?.per_page ?? 25;
    const search = params?.search ?? "";
    const reason = params?.reason ?? "";

    const queryKey = ["suppressionList", page, perPage, search, reason];

    return useQuery({
        queryKey,
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (page) searchParams.append("page", String(page));
            if (perPage) searchParams.append("per_page", String(perPage));
            if (search) searchParams.append("search", search);
            if (reason && reason !== "all") searchParams.append("reason", reason);

            const res = await apiFetch(`/api/suppression-list?${searchParams.toString()}`);
            if (!res.ok) {
                throw new Error("Failed to fetch suppression list");
            }
            return res.json();
        },
    });
}

export function useAddSuppressedNumber() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            phone,
            reason = "manual_suppression",
            notes,
        }: {
            phone: string;
            reason?: string;
            notes?: string;
        }) => {
            const res = await apiFetch(`/api/suppression-list`, {
                method: "POST",
                body: JSON.stringify({ phone, reason, notes }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to suppress phone number");
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppressionList"] });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });
}

export function useRemoveSuppressedNumber() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await apiFetch(`/api/suppression-list/${id}`, {
                method: "DELETE",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to remove from suppression list");
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppressionList"] });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });
}

// -------------------------------------------------------------
// Conversation Tags & Labels Hooks
// -------------------------------------------------------------

export function useWorkspaceTags() {
    return useQuery<{ success: boolean; data: WorkspaceTag[] }>({
        queryKey: ["workspaceTags"],
        queryFn: async () => {
            const res = await apiFetch(`/api/tags`);
            if (!res.ok) {
                throw new Error("Failed to fetch workspace tags");
            }
            return res.json();
        },
    });
}

export function useCreateWorkspaceTag() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            name: string;
            color?: string;
            description?: string;
            routing_user_id?: number | null;
            routing_team_id?: number | null;
        }) => {
            const res = await apiFetch(`/api/tags`, {
                method: "POST",
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || data.message || "Failed to create tag");
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspaceTags"] });
        },
    });
}

export function useConversationTags(conversationId?: number) {
    return useQuery<{ success: boolean; data: Array<{ id: number; name: string; color?: string }> }>({
        queryKey: ["conversationTags", conversationId],
        queryFn: async () => {
            if (!conversationId) return { success: true, data: [] };
            const res = await apiFetch(`/api/conversations/${conversationId}/tags`);
            if (!res.ok) {
                throw new Error("Failed to fetch conversation tags");
            }
            return res.json();
        },
        enabled: !!conversationId,
    });
}

export function useAttachConversationTag() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ conversationId, tag }: { conversationId: number; tag: string }) => {
            const res = await apiFetch(`/api/conversations/${conversationId}/tags`, {
                method: "POST",
                body: JSON.stringify({ tag }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to attach tag to conversation");
            }
            return data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["conversationTags", variables.conversationId] });
            queryClient.invalidateQueries({ queryKey: ["listConversations"] });
            queryClient.invalidateQueries({ queryKey: ["workspaceTags"] });
            queryClient.invalidateQueries({ queryKey: ["customerDetail", variables.conversationId] });
            queryClient.invalidateQueries({ queryKey: ["getCustomerTimeline", variables.conversationId] });
        },
    });
}

export function useDetachConversationTag() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ conversationId, tag }: { conversationId: number; tag: string }) => {
            const res = await apiFetch(`/api/conversations/${conversationId}/tags/${encodeURIComponent(tag)}`, {
                method: "DELETE",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to remove tag from conversation");
            }
            return data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["conversationTags", variables.conversationId] });
            queryClient.invalidateQueries({ queryKey: ["listConversations"] });
            queryClient.invalidateQueries({ queryKey: ["workspaceTags"] });
            queryClient.invalidateQueries({ queryKey: ["customerDetail", variables.conversationId] });
            queryClient.invalidateQueries({ queryKey: ["getCustomerTimeline", variables.conversationId] });
        },
    });
}

export function useBulkTagConversations() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            conversation_ids: number[];
            add_tags?: string[];
            remove_tags?: string[];
        }) => {
            const res = await apiFetch(`/api/conversations/bulk-tag`, {
                method: "POST",
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to bulk tag conversations");
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["listConversations"] });
            queryClient.invalidateQueries({ queryKey: ["workspaceTags"] });
        },
    });
}

// -------------------------------------------------------------
// Business Hours Interfaces & Hooks
// -------------------------------------------------------------

export interface BusinessHoursDaySchedule {
    is_open: boolean;
    open: string;
    close: string;
}

export interface BusinessHoursWeeklySchedule {
    monday: BusinessHoursDaySchedule;
    tuesday: BusinessHoursDaySchedule;
    wednesday: BusinessHoursDaySchedule;
    thursday: BusinessHoursDaySchedule;
    friday: BusinessHoursDaySchedule;
    saturday: BusinessHoursDaySchedule;
    sunday: BusinessHoursDaySchedule;
}

export interface BusinessHoursHoliday {
    date: string;
    name: string;
}

export interface BusinessHoursConfig {
    id: number;
    tenant_id: number;
    timezone: string;
    is_enabled: boolean;
    weekly_schedule: BusinessHoursWeeklySchedule;
    holidays: BusinessHoursHoliday[];
    outside_hours_action: "auto_reply" | "none";
    outside_hours_message: string;
    cooldown_minutes: number;
    automation_id?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface BusinessHoursStatus {
    is_open: boolean;
    status: "open" | "closed" | "holiday" | "disabled";
    reason: string;
    timezone: string;
    current_time: string;
    current_day: string;
    next_open_at: string | null;
    today_schedule?: BusinessHoursDaySchedule | null;
    holiday?: BusinessHoursHoliday | null;
}

export interface BusinessHoursSimulationResult {
    evaluated_at: string;
    timezone: string;
    is_open: boolean;
    status: string;
    reason: string;
    would_reply: boolean;
    reply_message: string | null;
    cooldown_minutes: number;
}

export function useBusinessHoursConfig() {
    return useQuery<{ success: boolean; config: BusinessHoursConfig; status: BusinessHoursStatus }>({
        queryKey: ["businessHoursConfig"],
        queryFn: async () => {
            const res = await apiFetch("/api/business-hours");
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to fetch business hours configuration");
            }
            return res.json();
        },
    });
}

export function useUpdateBusinessHoursConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<BusinessHoursConfig>) => {
            const res = await apiFetch("/api/business-hours", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to update business hours configuration");
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["businessHoursConfig"] });
            queryClient.invalidateQueries({ queryKey: ["businessHoursStatus"] });
        },
    });
}

export function useBusinessHoursStatus(datetime?: string) {
    return useQuery<{ success: boolean; status: BusinessHoursStatus }>({
        queryKey: ["businessHoursStatus", datetime],
        queryFn: async () => {
            const url = datetime
                ? `/api/business-hours/status?datetime=${encodeURIComponent(datetime)}`
                : "/api/business-hours/status";
            const res = await apiFetch(url);
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to fetch business hours status");
            }
            return res.json();
        },
        refetchInterval: 60 * 1000, // Refresh status every minute
    });
}

export function useTestBusinessHoursSimulation() {
    return useMutation({
        mutationFn: async (payload: { datetime?: string }) => {
            const res = await apiFetch("/api/business-hours/test", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to run business hours simulation");
            }
            return data as { success: boolean; simulation: BusinessHoursSimulationResult };
        },
    });
}

// -------------------------------------------------------------
// SLA & Response Time Interfaces & Hooks
// -------------------------------------------------------------

export interface SlaConfig {
    id: number;
    tenant_id: number;
    is_enabled: boolean;
    first_response_time_minutes: number;
    next_response_time_minutes: number;
    resolution_time_minutes: number;
    warning_threshold_percentage: number;
    created_at?: string;
    updated_at?: string;
}

export interface ConversationSla {
    is_enabled: boolean;
    is_overdue: boolean;
    sla_status: "on_track" | "warning" | "breached" | "met" | "disabled";
    is_waiting: boolean;
    waiting_time_seconds: number;
    waiting_time_formatted: string;
    first_response_time_seconds: number | null;
    first_response_time_formatted: string | null;
    average_response_time_seconds: number | null;
    average_response_time_formatted: string | null;
    resolution_time_seconds: number | null;
    resolution_time_formatted: string | null;
    target_type: "first_response" | "next_response" | "resolution";
    target_limit_seconds: number;
    time_to_breach_seconds: number | null;
    time_to_breach_formatted: string | null;
    breach_reason?: string | null;
}

export interface SlaMetrics {
    is_enabled: boolean;
    compliance_rate: number;
    total_conversations: number;
    active_waiting_count: number;
    overdue_count: number;
    warning_count: number;
    on_track_count: number;
    met_count: number;
    breached_count: number;
    avg_first_response_time_seconds: number | null;
    avg_first_response_time_formatted: string;
    avg_response_time_seconds: number | null;
    avg_response_time_formatted: string;
    avg_resolution_time_seconds: number | null;
    avg_resolution_time_formatted: string;
    config: SlaConfig;
}

export function useSlaConfig() {
    return useQuery<{ success: boolean; config: SlaConfig }>({
        queryKey: ["slaConfig"],
        queryFn: async () => {
            const res = await apiFetch("/api/sla/config");
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to fetch SLA configuration");
            }
            return res.json();
        },
    });
}

export function useUpdateSlaConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<SlaConfig>) => {
            const res = await apiFetch("/api/sla/config", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to update SLA configuration");
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["slaConfig"] });
            queryClient.invalidateQueries({ queryKey: ["slaMetrics"] });
            queryClient.invalidateQueries({ queryKey: ["listConversations"] });
            queryClient.invalidateQueries({ queryKey: ["getConversationCounts"] });
        },
    });
}

export function useSlaMetrics() {
    return useQuery<{ success: boolean; metrics: SlaMetrics }>({
        queryKey: ["slaMetrics"],
        queryFn: async () => {
            const res = await apiFetch("/api/sla/metrics");
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to fetch SLA metrics");
            }
            return res.json();
        },
        refetchInterval: 60 * 1000,
    });
}

export function useConversationSla(conversationId?: number) {
    return useQuery<{ success: boolean; conversation_id: number; sla: ConversationSla }>({
        queryKey: ["conversationSla", conversationId],
        queryFn: async () => {
            if (!conversationId) throw new Error("Conversation ID is required");
            const res = await apiFetch(`/api/conversations/${conversationId}/sla`);
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to fetch conversation SLA");
            }
            return res.json();
        },
        enabled: !!conversationId,
        refetchInterval: 30 * 1000,
    });
}export interface MentionableUser {
    id: number;
    name: string;
    email: string;
    handle: string;
    role?: string;
    avatar?: string | null;
}

export function useMentionableUsers(query?: string) {
    return useQuery<MentionableUser[]>({
        queryKey: ["mentionableUsers", query],
        queryFn: async () => {
            const url = query ? `${API_BASE}/workspace/mentionable-users?query=${encodeURIComponent(query)}` : `${API_BASE}/workspace/mentionable-users`;
            const res = await apiFetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            return data.data || [];
        },
    });
}

// Conversation Collision Protection & Presence
export interface ActiveAgentPresence {
    id: number;
    name: string;
    avatar?: string | null;
    state: "viewing" | "composing" | "left";
    last_seen_seconds_ago: number;
}

export interface ConversationPresenceData {
    customer_id: number;
    conversation_id?: number | null;
    viewing_agents: ActiveAgentPresence[];
    composing_agents: ActiveAgentPresence[];
    active_agents: ActiveAgentPresence[];
    has_collision: boolean;
    collision_type?: "composing" | "recent_reply" | null;
    collision_warning?: string | null;
    recent_reply?: {
        message_id: number;
        sender_id: number;
        sender_name: string;
        seconds_ago: number;
        snippet: string;
    } | null;
    timestamp: string;
}

export function useConversationPresence(customerId?: number, conversationId?: number | null) {
    return useQuery<ConversationPresenceData>({
        queryKey: ["conversationPresence", customerId, conversationId],
        queryFn: async () => {
            if (!customerId) throw new Error("Customer ID required");
            const endpoint = conversationId
                ? `${API_BASE}/conversations/${conversationId}/presence`
                : `${API_BASE}/customers/${customerId}/presence`;
            const res = await apiFetch(endpoint);
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to fetch presence");
            }
            const body = await res.json();
            return body.data;
        },
        enabled: !!customerId,
        refetchInterval: 8000, // Poll every 8s as fallback or when active
    });
}

export function useUpdatePresence() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            customerId,
            conversationId,
            state,
        }: {
            customerId: number;
            conversationId?: number | null;
            state: "viewing" | "composing" | "left";
        }) => {
            const endpoint = conversationId
                ? `${API_BASE}/conversations/${conversationId}/presence`
                : `${API_BASE}/customers/${customerId}/presence`;
            const res = await apiFetch(endpoint, {
                method: "POST",
                body: JSON.stringify({ state, conversation_id: conversationId }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to update presence");
            }
            return res.json();
        },
        onSuccess: (data, variables) => {
            if (data?.data) {
                queryClient.setQueryData(
                    ["conversationPresence", variables.customerId, variables.conversationId],
                    data.data
                );
            }
        },
    });
}

// -------------------------------------------------------------
// Saved Views / Filters (TASK 14)
// -------------------------------------------------------------

export interface SavedViewItem {
    id: number;
    tenant_id: number;
    user_id?: number | null;
    entity_type: "contacts" | "inbox" | "leads" | "campaigns";
    name: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    filters: Record<string, any>;
    rules_json?: any;
    segment_id?: number | null;
    is_default?: boolean;
    is_shared?: boolean;
    is_system?: boolean;
    sort_order?: number;
    calculated_count?: number | null;
    created_at?: string;
    updated_at?: string;
}

export function useListSavedViews(entityType?: string) {
    return useQuery<SavedViewItem[]>({
        queryKey: ["savedViews", entityType],
        queryFn: async () => {
            const endpoint = entityType
                ? `${API_BASE}/saved-views?entity_type=${encodeURIComponent(entityType)}`
                : `${API_BASE}/saved-views`;
            const res = await apiFetch(endpoint);
            if (!res.ok) {
                throw new Error("Failed to fetch saved views");
            }
            const body = await res.json();
            return body.data || [];
        },
    });
}

export function useCreateSavedView() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<SavedViewItem>) => {
            const res = await apiFetch(`${API_BASE}/saved-views`, {
                method: "POST",
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Failed to create saved view");
            }
            const body = await res.json();
            return body.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["savedViews"] });
            if (variables.entity_type) {
                queryClient.invalidateQueries({ queryKey: ["savedViews", variables.entity_type] });
            }
        },
    });
}

export function useUpdateSavedView() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<SavedViewItem> }) => {
            const res = await apiFetch(`${API_BASE}/saved-views/${id}`, {
                method: "PUT",
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Failed to update saved view");
            }
            const body = await res.json();
            return body.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["savedViews"] });
        },
    });
}

export function useDeleteSavedView() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await apiFetch(`${API_BASE}/saved-views/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Failed to delete saved view");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["savedViews"] });
        },
    });
}

export function useSetDefaultSavedView() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await apiFetch(`${API_BASE}/saved-views/${id}/set-default`, {
                method: "POST",
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Failed to set view as default");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["savedViews"] });
        },
    });
}


