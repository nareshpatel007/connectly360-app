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
        if (token && token !== "undefined" && token !== "null" && token.split(".").length === 3) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        try {
            const rawUser = localStorage.getItem("auth_user");
            if (rawUser) {
                const parsedUser = JSON.parse(rawUser);
                if (parsedUser?.tenant_id) {
                    headers["X-Tenant-Id"] = String(parsedUser.tenant_id);
                }
            }
        } catch {}
    }

    const res = await fetch(url, {
        ...options,
        headers,
    });

    if (res.status === 401 && typeof window !== "undefined") {
        const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register");
        if (!isAuthEndpoint) {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
        }
    }

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
    createdAt: string;
}

export interface ConversationCounts {
    all: number;
    open: number;
    pending: number;
    resolved: number;
    unread: number;
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
    title: string;
    shortcut: string;
    content: string;
    is_active: boolean;
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
    phone: string;
    city?: string;
    messageCount: number;
    createdAt: string;
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

// Conversations
export function useListConversations(params?: { status?: string; search?: string; limit?: number; format?: string }) {
    return useQuery<Conversation[]>({
        queryKey: ["listConversations", params?.status, params?.search, params?.limit, params?.format],
        queryFn: async () => {
            const query = new URLSearchParams();
            if (params?.status) query.set("status", params.status);
            if (params?.search) query.set("search", params.search);
            if (params?.limit) query.set("limit", String(params.limit));
            if (params?.format) query.set("format", params.format);

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

export function useListQuickReplies() {
    return useQuery<QuickReplyItem[]>({
        queryKey: ["listQuickReplies"],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/quick-replies`);
            if (!res.ok) throw new Error("Failed to fetch quick replies");
            return res.json();
        },
    });
}

export function useCreateQuickReply() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { title: string; shortcut: string; content: string }) => {
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
export function useListLeads(params?: { status?: string }) {
    return useQuery<Lead[]>({
        queryKey: [getListLeadsQueryKey(), params?.status],
        queryFn: async () => {
            const url = params?.status ? `${API_BASE}/leads?status=${params.status}` : `${API_BASE}/leads`;
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

export function useSendMessage() {
    return useMutation({
        mutationFn: async ({ data }: { data: { to: string; body: string } }) => {
            const res = await apiFetch(`${API_BASE}/whatsapp/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to send WhatsApp message");
            }
            return res.json();
        },
    });
}

// Customers
export function useListCustomers(params?: { search?: string }) {
    return useQuery<Customer[]>({
        queryKey: ["listCustomers", params?.search],
        queryFn: async () => {
            const url = params?.search ? `${API_BASE}/customers?search=${encodeURIComponent(params.search)}` : `${API_BASE}/customers`;
            const res = await apiFetch(url);
            if (!res.ok) throw new Error("Failed to fetch customers");
            return res.json();
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
    name: string;
    category: 'Marketing' | 'Utility' | 'Authentication';
    language: string;
    header_type?: 'none' | 'text' | 'image' | 'video' | 'document' | null;
    header_content?: string | null;
    header_media_url?: string | null;
    body_text: string;
    footer_text?: string | null;
    buttons?: TemplateButton[] | null;
    status?: string;
    rejection_reason?: string | null;
    submission_error?: string | null;
    quality_score?: string | null;
    meta_template_id?: string | null;
    sample_values?: TemplateSampleValues | null;
    created_at?: string;
}

export type TemplateButton =
  | { type: 'QUICK_REPLY'; text: string }
  | { type: 'URL'; text: string; url: string; example?: string }
  | { type: 'PHONE_NUMBER'; text: string; phone_number: string }
  | { type: 'COPY_CODE'; text: string; example: string };

export interface TemplateSampleValues {
  body?: string[];
  header?: string[];
}

// -------------------------------------------------------------
// Message Template Hooks
// -------------------------------------------------------------
export function useListTemplates() {
    return useQuery<MessageTemplate[]>({
        queryKey: ["listTemplates"],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/whatsapp/templates`);
            if (!res.ok) throw new Error("Failed to fetch message templates");
            return res.json();
        },
    });
}

export function useCreateTemplate() {
    return useMutation({
        mutationFn: async ({ data }: { data: Omit<MessageTemplate, "id" | "status" | "created_at"> }) => {
            const res = await apiFetch(`${API_BASE}/whatsapp/templates/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "Failed to submit template");
            }
            return res.json();
        },
    });
}

export function useUpdateTemplate() {
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Omit<MessageTemplate, "id" | "name" | "language" | "created_at">> }) => {
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
        mutationFn: async () => {
            const res = await apiFetch(`${API_BASE}/whatsapp/templates/sync`, {
                method: "POST",
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
    template_name: string;
    template_language: string;
    template_variables?: Record<string, string[]> | null;
    audience_filter?: { type: 'all' | 'contacts'; contact_ids?: number[] } | null;
    status: 'draft' | 'sending' | 'sent' | 'failed' | 'paused';
    total_recipients: number;
    sent_count: number;
    delivered_count: number;
    read_count: number;
    replied_count: number;
    failed_count: number;
    scheduled_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface CampaignRecipient {
    id: number;
    campaign_id: number;
    customer_id?: number | null;
    phone: string;
    name?: string | null;
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
    wamid?: string | null;
    error_message?: string | null;
    sent_at?: string | null;
    delivered_at?: string | null;
    read_at?: string | null;
    replied_at?: string | null;
    contact_name?: string | null;
    contact_phone?: string | null;
    created_at: string;
}

export interface CampaignStats {
    total_campaigns: number;
    total_messages: number;
    total_sent: number;
    delivery_rate: number;
}

// -------------------------------------------------------------
// Campaign Hooks
// -------------------------------------------------------------

export function useListCampaigns(options?: any) {
    return useQuery<Campaign[]>({
        queryKey: ["listCampaigns"],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/campaigns`);
            if (!res.ok) throw new Error("Failed to fetch campaigns");
            return res.json();
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
            return res.json();
        },
        ...options,
    });
}

export function useGetCampaign(id: number | string | null | undefined) {
    return useQuery<{ campaign: Campaign; recipients: CampaignRecipient[] }>({
        queryKey: ["getCampaign", id],
        queryFn: async () => {
            const res = await apiFetch(`${API_BASE}/campaigns/${id}`);
            if (!res.ok) throw new Error("Failed to fetch campaign");
            return res.json();
        },
        enabled: !!id,
    });
}

export function useCreateCampaign() {
    return useMutation({
        mutationFn: async ({ data }: { data: Omit<Campaign, "id" | "tenant_id" | "sent_count" | "delivered_count" | "read_count" | "replied_count" | "failed_count" | "total_recipients" | "created_at" | "updated_at"> }) => {
            const res = await apiFetch(`${API_BASE}/campaigns`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "Failed to create campaign");
            }
            return res.json();
        },
    });
}

export function useUpdateCampaign() {
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Pick<Campaign, "name" | "status" | "template_variables" | "scheduled_at">> }) => {
            const res = await apiFetch(`${API_BASE}/campaigns/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "Failed to update campaign");
            }
            return res.json();
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

export function useSendCampaign() {
    return useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            const res = await apiFetch(`${API_BASE}/campaigns/${id}/send`, {
                method: "POST",
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "Failed to send campaign");
            }
            return res.json() as Promise<{ message: string; sent_count: number; failed_count: number; status: string }>;
        },
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
            const headers: Record<string, string> = {};
            if (workspaceId) {
                headers["X-Tenant-Id"] = String(workspaceId);
            }
            const res = await apiFetch(`${API_BASE}/notifications/unread-count`, { headers });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to fetch unread count");
            }
            return (data.count ?? 0) as number;
        },
        staleTime: 15 * 1000,
        refetchInterval: 30 * 1000, // automatic background heartbeat poll
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



