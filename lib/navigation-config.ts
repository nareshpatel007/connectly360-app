import React from "react";
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    GitBranch,
    Filter,
    CheckSquare,
    Megaphone,
    FileText,
    Zap,
    Bot,
    BookOpen,
    PieChart,
    BarChart3,
    MessageCircle,
    Plug,
    Code2,
    Wallet,
    UserPlus,
    Shield,
    Building2,
    BellRing,
    Key,
    Webhook,
    Terminal,
    History,
    Receipt,
    CreditCard
} from "lucide-react";
import type { LeafNavigationItem, GroupNavigationItem, NavigationSection } from "./navigation-matcher";

export interface SubMenuItem extends LeafNavigationItem {
    icon: React.ElementType;
}

export type MenuItem =
    | {
        id: string;
        label: string;
        icon: React.ElementType;
        href: string;
        exact?: boolean;
        patterns?: string[];
        permission?: string;
        badgeKey?: string;
        subItems?: undefined;
    }
    | {
        id: string;
        label: string;
        icon: React.ElementType;
        href?: string;
        exact?: boolean;
        patterns?: string[];
        permission?: string;
        badgeKey?: string;
        subItems: SubMenuItem[];
    };

export interface NavSection extends NavigationSection {
    section: string;
    items: MenuItem[];
}

export const CLIENT_NAV_SECTIONS: NavSection[] = [
    {
        section: "OVERVIEW",
        items: [
            {
                id: "dashboard",
                label: "Dashboard",
                icon: LayoutDashboard,
                href: "/dashboard",
                exact: true,
                permission: "dashboard.view"
            }
        ]
    },
    {
        section: "INBOX & CRM",
        items: [
            {
                id: "inbox",
                label: "Inbox",
                icon: MessageSquare,
                href: "/conversations",
                patterns: ["/conversations/**"],
                permission: "inbox.view",
                badgeKey: "inbox"
            },
            {
                id: "contacts",
                label: "Contacts",
                icon: Users,
                href: "/contacts",
                patterns: ["/contacts/**"],
                permission: "contacts.view"
            },
            {
                id: "leads",
                label: "Leads",
                icon: GitBranch,
                href: "/leads",
                patterns: ["/leads/**"],
                permission: "leads.view"
            },
            {
                id: "segments",
                label: "Segments",
                icon: Filter,
                href: "/segments",
                patterns: ["/segments/**"],
                permission: "contacts.view"
            },
            {
                id: "tasks",
                label: "Tasks",
                icon: CheckSquare,
                href: "/tasks",
                patterns: ["/tasks/**"],
                permission: "tasks.view",
                badgeKey: "tasks"
            }
        ]
    },
    {
        section: "ENGAGEMENT",
        items: [
            {
                id: "campaigns",
                label: "Campaigns",
                icon: Megaphone,
                href: "/marketing/campaigns",
                patterns: ["/marketing/campaigns/**"],
                permission: "campaigns.view"
            },
            {
                id: "templates",
                label: "Templates",
                icon: FileText,
                href: "/marketing/templates",
                patterns: ["/marketing/templates/**"],
                permission: "templates.view"
            },
            {
                id: "automations-group",
                label: "Automations",
                icon: Zap,
                href: "/automations",
                permission: "automations.view",
                subItems: [
                    {
                        id: "automations-workflows",
                        label: "Workflows",
                        icon: Zap,
                        href: "/automations",
                        exact: true,
                        permission: "automations.view"
                    },
                    {
                        id: "automations-auto-replies",
                        label: "Auto-Reply Rules",
                        icon: MessageSquare,
                        href: "/automations/auto-replies",
                        patterns: ["/automations/auto-replies/**"],
                        permission: "automations.view"
                    }
                ]
            }
        ]
    },
    {
        section: "AI",
        items: [
            {
                id: "ai-agents",
                label: "AI Agents",
                icon: Bot,
                href: "/ai-assistant",
                patterns: ["/ai-assistant/**"],
                permission: "ai.view"
            },
            {
                id: "knowledge-base",
                label: "Knowledge Base",
                icon: BookOpen,
                href: "/knowledge-base",
                patterns: ["/knowledge-base/**"],
                permission: "knowledge.view"
            }
        ]
    },
    {
        section: "ANALYTICS",
        items: [
            {
                id: "analytics",
                label: "Analytics",
                icon: PieChart,
                href: "/analytics",
                patterns: ["/analytics/**"],
                permission: "analytics.view"
            },
            {
                id: "reports",
                label: "Reports",
                icon: BarChart3,
                href: "/reports",
                patterns: ["/reports/**"],
                permission: "reports.view"
            }
        ]
    },
    {
        section: "CHANNELS & INTEGRATIONS",
        items: [
            {
                id: "whatsapp",
                label: "WhatsApp",
                icon: MessageCircle,
                href: "/integrations/whatsapp",
                patterns: ["/integrations/whatsapp/**"],
                permission: "whatsapp.view"
            },
            {
                id: "integrations",
                label: "Integrations",
                icon: Plug,
                href: "/integrations",
                exact: true,
                permission: "integrations.view"
            },
            {
                id: "developer-group",
                label: "Developer",
                icon: Code2,
                href: "/developer",
                permission: "developer.view",
                subItems: [
                    {
                        id: "dev-overview",
                        label: "Overview",
                        icon: Code2,
                        href: "/developer",
                        exact: true,
                        permission: "developer.view"
                    },
                    {
                        id: "dev-api-keys",
                        label: "API Keys",
                        icon: Key,
                        href: "/integrations/api-keys",
                        permission: "developer.view"
                    },
                    {
                        id: "dev-webhooks",
                        label: "Webhooks",
                        icon: Webhook,
                        href: "/integrations/webhooks",
                        permission: "developer.view"
                    },
                    {
                        id: "dev-api-logs",
                        label: "API Logs",
                        icon: Terminal,
                        href: "/developer/api-logs",
                        permission: "developer.view"
                    }
                ]
            }
        ]
    },
    {
        section: "BILLING",
        items: [
            {
                id: "billing-group",
                label: "Billing & Credits",
                icon: Wallet,
                href: "/billing",
                permission: "billing.view",
                subItems: [
                    {
                        id: "billing-overview",
                        label: "Overview",
                        icon: Wallet,
                        href: "/billing",
                        exact: true,
                        permission: "billing.view"
                    },
                    {
                        id: "billing-buy-credits",
                        label: "Buy Credits",
                        icon: Zap,
                        href: "/billing/buy-credits",
                        patterns: ["/billing/recharge-credits"],
                        permission: "billing.view"
                    },
                    {
                        id: "billing-credit-history",
                        label: "Credit History",
                        icon: History,
                        href: "/billing/credit-history",
                        permission: "billing.view"
                    },
                    {
                        id: "billing-invoices",
                        label: "Invoices",
                        icon: Receipt,
                        href: "/billing/invoices",
                        permission: "billing.view"
                    },
                    {
                        id: "billing-subscription",
                        label: "Subscription",
                        icon: CreditCard,
                        href: "/billing/subscription",
                        permission: "billing.view"
                    }
                ]
            }
        ]
    },
    {
        section: "WORKSPACE",
        items: [
            {
                id: "team-members",
                label: "Team Members",
                icon: UserPlus,
                href: "/workspace/team-members",
                patterns: ["/workspace/team-members/**"],
                permission: "workspace.members.view"
            },
            {
                id: "roles-permissions",
                label: "Roles & Permissions",
                icon: Shield,
                href: "/workspace/roles-permissions",
                patterns: ["/workspace/roles-permissions/**"],
                permission: "workspace.roles.view"
            },
            {
                id: "company-profile",
                label: "Company Profile",
                icon: Building2,
                href: "/settings/company-profile",
                patterns: ["/settings/company-profile/**", "/settings"],
                permission: "workspace.settings.view"
            },
            {
                id: "notifications",
                label: "Notifications",
                icon: BellRing,
                href: "/settings/notification-settings",
                patterns: ["/settings/notification-settings/**", "/notifications"],
                permission: "workspace.settings.view"
            }
        ]
    }
];
