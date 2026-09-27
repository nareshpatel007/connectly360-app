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
    BellRing
} from "lucide-react";

export interface SubMenuItem {
    label: string;
    icon: React.ElementType;
    href: string;
    permission?: string;
    badgeKey?: string;
}

export interface MenuItem {
    label: string;
    icon: React.ElementType;
    href: string;
    permission?: string;
    badgeKey?: string;
    subItems?: SubMenuItem[];
}

export interface NavSection {
    section: string;
    items: MenuItem[];
}

export const CLIENT_NAV_SECTIONS: NavSection[] = [
    {
        section: "OVERVIEW",
        items: [
            {
                label: "Dashboard",
                icon: LayoutDashboard,
                href: "/dashboard",
                permission: "dashboard.view"
            }
        ]
    },
    {
        section: "INBOX & CRM",
        items: [
            {
                label: "Inbox",
                icon: MessageSquare,
                href: "/conversations",
                permission: "inbox.view",
                badgeKey: "inbox"
            },
            {
                label: "Contacts",
                icon: Users,
                href: "/contacts",
                permission: "contacts.view"
            },
            {
                label: "Leads",
                icon: GitBranch,
                href: "/leads",
                permission: "leads.view"
            },
            {
                label: "Segments",
                icon: Filter,
                href: "/segments",
                permission: "contacts.view"
            },
            {
                label: "Tasks",
                icon: CheckSquare,
                href: "/tasks",
                permission: "tasks.view",
                badgeKey: "tasks"
            }
        ]
    },
    {
        section: "ENGAGEMENT",
        items: [
            {
                label: "Campaigns",
                icon: Megaphone,
                href: "/marketing/campaigns",
                permission: "campaigns.view"
            },
            {
                label: "Templates",
                icon: FileText,
                href: "/marketing/templates",
                permission: "templates.view"
            },
            {
                label: "Automations",
                icon: Zap,
                href: "/automations",
                permission: "automations.view"
            }
        ]
    },
    {
        section: "AI",
        items: [
            {
                label: "AI Agents",
                icon: Bot,
                href: "/ai-assistant",
                permission: "ai.view"
            },
            {
                label: "Knowledge Base",
                icon: BookOpen,
                href: "/knowledge-base",
                permission: "knowledge.view"
            }
        ]
    },
    {
        section: "ANALYTICS",
        items: [
            {
                label: "Analytics",
                icon: PieChart,
                href: "/analytics",
                permission: "analytics.view"
            },
            {
                label: "Reports",
                icon: BarChart3,
                href: "/reports",
                permission: "reports.view"
            }
        ]
    },
    {
        section: "CHANNELS & INTEGRATIONS",
        items: [
            {
                label: "WhatsApp",
                icon: MessageCircle,
                href: "/integrations/whatsapp",
                permission: "whatsapp.view"
            },
            {
                label: "Integrations",
                icon: Plug,
                href: "/integrations",
                permission: "integrations.view"
            },
            {
                label: "Developer",
                icon: Code2,
                href: "/developer",
                permission: "developer.view"
            }
        ]
    },
    {
        section: "BILLING",
        items: [
            {
                label: "Billing & Credits",
                icon: Wallet,
                href: "/billing",
                permission: "billing.view"
            }
        ]
    },
    {
        section: "WORKSPACE",
        items: [
            {
                label: "Team Members",
                icon: UserPlus,
                href: "/workspace/team-members",
                permission: "workspace.members.view"
            },
            {
                label: "Roles & Permissions",
                icon: Shield,
                href: "/workspace/roles-permissions",
                permission: "workspace.roles.view"
            },
            {
                label: "Company Profile",
                icon: Building2,
                href: "/settings/company-profile",
                permission: "workspace.settings.view"
            },
            {
                label: "Notifications",
                icon: BellRing,
                href: "/settings/notification-settings",
                permission: "workspace.settings.view"
            }
        ]
    }
];
