import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";

// Base API URL
const API_BASE = "/api";

async function apiFetch(url: string, options: RequestInit = {}) {
    const headers = {
        ...options.headers,
    } as Record<string, string>;

    if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (typeof window !== "undefined") {
        const token = localStorage.getItem("auth_token");
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }

    return fetch(url, {
        ...options,
        headers,
    });
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
    message: string;
    direction: "inbound" | "outbound";
    intent?: string;
    isRead?: number;
    createdAt: string;
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
export function useListConversations(params?: { limit?: number }) {
    return useQuery<Conversation[]>({
        queryKey: ["listConversations", params?.limit],
        queryFn: async () => {
            const url = params?.limit ? `${API_BASE}/conversations?limit=${params.limit}` : `${API_BASE}/conversations`;
            const res = await apiFetch(url);
            if (!res.ok) throw new Error("Failed to fetch conversations");
            return res.json();
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

