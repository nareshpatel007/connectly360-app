"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    GitBranch,
    Bot,
    BookOpen,
    Zap,
    Megaphone,
    FileText,
    MessageCircle,
    Key,
    Webhook,
    PieChart,
    BarChart3,
    Wallet,
    Sparkles,
    Receipt,
    CreditCard,
    UserPlus,
    Shield,
    Building2,
    BellRing,
    Search,
    ArrowRight,
    X,
    PlusCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const NAVIGATION_ITEMS = [
    { label: "Dashboard Overview", icon: LayoutDashboard, href: "/dashboard", group: "Overview", desc: "Workspace metrics, KPIs & system status" },
    { label: "Conversations Inbox", icon: MessageSquare, href: "/conversations", group: "CRM", desc: "Realtime messaging & customer chats" },
    { label: "Contacts Directory", icon: Users, href: "/contacts", group: "CRM", desc: "Customer profiles, attributes & tags" },
    { label: "Leads & Pipeline", icon: GitBranch, href: "/leads", group: "CRM", desc: "Deal pipeline & lead stage management" },
    { label: "AI Assistant", icon: Bot, href: "/ai-assistant", group: "AI & Automation", desc: "Custom AI agent configuration & behavior" },
    { label: "Knowledge Base", icon: BookOpen, href: "/knowledge-base", group: "AI & Automation", desc: "AI training documents & website indexing" },
    { label: "Automations & Workflows", icon: Zap, href: "/automations", group: "AI & Automation", desc: "Automated triggers, webhooks & responses" },
    { label: "WhatsApp Campaigns", icon: Megaphone, href: "/marketing/campaigns", group: "Marketing", desc: "Outbound message broadcasts & schedule" },
    { label: "Message Templates", icon: FileText, href: "/marketing/templates", group: "Marketing", desc: "Meta-approved WhatsApp message templates" },
    { label: "WhatsApp Integration", icon: MessageCircle, href: "/integrations/whatsapp", group: "Integrations", desc: "Sandbox testing & official WABA connection" },
    { label: "WhatsApp Business Profile", icon: Building2, href: "/integrations/whatsapp/business-profile", group: "Integrations", desc: "WhatsApp display name, about, vertical, websites & profile photo" },
    { label: "API Keys", icon: Key, href: "/integrations/api-keys", group: "Integrations", desc: "REST API keys & developer credentials" },
    { label: "Webhooks", icon: Webhook, href: "/integrations/webhooks", group: "Integrations", desc: "Custom HTTP callback endpoints" },
    { label: "Analytics", icon: PieChart, href: "/analytics", group: "Analytics", desc: "Performance breakdown & chat metrics" },
    { label: "Usage Reports", icon: BarChart3, href: "/reports/usage-reports", group: "Analytics", desc: "Credit usage logs & export reports" },
    { label: "Billing & Wallet Overview", icon: Wallet, href: "/billing", group: "Billing", desc: "Credit balance, subscriptions & history" },
    { label: "Buy Credit Packs", icon: Sparkles, href: "/billing/buy-credits", group: "Billing", desc: "Recharge wallet credits instantly" },
    { label: "Credit History", icon: Receipt, href: "/billing/credit-history", group: "Billing", desc: "Detailed credit consumption ledger" },
    { label: "Invoices & Receipts", icon: FileText, href: "/billing/invoices", group: "Billing", desc: "Payment receipts & TAX invoices" },
    { label: "Team Members", icon: UserPlus, href: "/workspace/team-members", group: "Settings", desc: "Invite & manage workspace collaborators" },
    { label: "Roles & Permissions", icon: Shield, href: "/workspace/roles-permissions", group: "Settings", desc: "Access control & privilege policies" },
    { label: "Company Profile", icon: Building2, href: "/settings/company-profile", group: "Settings", desc: "Workspace name, company details & branding" },
    { label: "Notification Settings", icon: BellRing, href: "/settings/notification-settings", group: "Settings", desc: "Email, web push & SMS alert preferences" },
];

const QUICK_ACTIONS = [
    { label: "Open Inbox", icon: MessageSquare, href: "/conversations", desc: "View and respond to customer messages" },
    { label: "Create Campaign", icon: Megaphone, href: "/marketing/campaigns", desc: "Draft a new WhatsApp broadcast campaign" },
    { label: "Add New Contact", icon: Users, href: "/contacts", desc: "Manually add or import customer contacts" },
    { label: "Recharge Wallet Credits", icon: Sparkles, href: "/billing/buy-credits", desc: "Top up credits for AI & WhatsApp messages" },
];

export function AppCommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const router = useRouter();
    const [query, setQuery] = useState("");

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                onOpenChange(!open);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onOpenChange]);

    const filteredNav = NAVIGATION_ITEMS.filter(
        (item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.desc.toLowerCase().includes(query.toLowerCase()) ||
            item.group.toLowerCase().includes(query.toLowerCase())
    );

    const handleSelect = (href: string) => {
        onOpenChange(false);
        setQuery("");
        router.push(href);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl p-0 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden [&>button]:hidden font-sans">
                <DialogTitle className="sr-only">Connectly360 Command Palette Search</DialogTitle>
                <div className="flex items-center px-4 py-3 border-b border-slate-200 bg-slate-50/60">
                    <Search size={18} className="text-[#35877D] shrink-0 mr-3" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search contacts, leads, campaigns, AI, billing, settings... (Ctrl + K)"
                        className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        autoFocus
                    />
                    {query && (
                        <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600 mr-2 cursor-pointer">
                            <X size={16} />
                        </button>
                    )}
                    <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold text-slate-500 bg-white border border-slate-200 rounded-md shadow-2xs">
                        ESC
                    </kbd>
                </div>

                <div className="max-h-96 overflow-y-auto p-3 space-y-4 font-sans scrollbar-thin">
                    {!query && (
                        <div className="space-y-1.5">
                            <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                Quick Actions
                            </div>
                            {QUICK_ACTIONS.map((action, idx) => {
                                const Icon = action.icon;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect(action.href)}
                                        className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#35877D]/10 hover:text-[#35877D] text-left transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-xl bg-slate-100 group-hover:bg-[#35877D] group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
                                                <Icon size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 group-hover:text-[#35877D]">{action.label}</p>
                                                <p className="text-[10px] text-slate-500">{action.desc}</p>
                                            </div>
                                        </div>
                                        <ArrowRight size={14} className="text-slate-300 group-hover:text-[#35877D] transition-transform group-hover:translate-x-1" />
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="space-y-1">
                        <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            {query ? `Search Results (${filteredNav.length})` : "All Navigation Modules"}
                        </div>
                        {filteredNav.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-400 font-semibold">
                                No matching modules, pages or actions found.
                            </div>
                        ) : (
                            filteredNav.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.href}
                                        onClick={() => handleSelect(item.href)}
                                        className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-100/90 text-left transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-8 w-8 rounded-xl bg-[#35877D]/10 text-[#35877D] flex items-center justify-center shrink-0">
                                                <Icon size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-900 group-hover:text-[#35877D] truncate">{item.label}</span>
                                                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                                                        {item.group}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                                            </div>
                                        </div>
                                        <ArrowRight size={14} className="text-slate-300 group-hover:text-[#35877D] transition-transform group-hover:translate-x-1 shrink-0" />
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="p-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                    <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">⌘K</kbd> or <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">Ctrl+K</kbd> anytime</span>
                    <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">ESC</kbd> to close</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
