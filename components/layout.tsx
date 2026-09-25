"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    Settings,
    BarChart3,
    Plug,
    ChevronRight,
    Sparkles,
    ChevronDown,
    LogOut,
    Bell,
    BookOpen,
    Bot,
    Megaphone,
    FileText,
    Key,
    Webhook,
    PieChart,
    Receipt,
    CreditCard,
    Wallet,
    Shield,
    Building2,
    MessageCircle,
    BellRing,
    UserPlus,
    Zap,
    GitBranch,
    Coins,
    Search,
    Menu,
    X,
    PanelLeftClose,
    PanelLeftOpen,
    ShieldCheck
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { CreditBalance } from "@/components/credit-balance";
import { AppCommandPalette } from "@/components/app-command-palette";

interface SubItem {
    icon: React.ElementType;
    label: string;
    href: string;
}

interface NavItem {
    label: string;
    icon: React.ElementType;
    href: string;
    subItems?: SubItem[];
}

interface NavSection {
    section: string;
    items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
    {
        section: "OVERVIEW",
        items: [
            { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
        ]
    },
    {
        section: "CUSTOMER & SALES",
        items: [
            {
                label: "CRM",
                icon: MessageSquare,
                href: "/conversations",
                subItems: [
                    { label: "Inbox", icon: MessageSquare, href: "/conversations" },
                    { label: "Contacts", icon: Users, href: "/contacts" },
                    { label: "Leads", icon: GitBranch, href: "/leads" },
                ]
            }
        ]
    },
    {
        section: "AI & AUTOMATION",
        items: [
            {
                label: "AI Platform",
                icon: Bot,
                href: "/ai-assistant",
                subItems: [
                    { label: "AI Assistant", icon: Bot, href: "/ai-assistant" },
                    { label: "Knowledge Base", icon: BookOpen, href: "/knowledge-base" },
                ]
            },
            { label: "Automations", icon: Zap, href: "/automations" },
        ]
    },
    {
        section: "MARKETING",
        items: [
            {
                label: "Marketing",
                icon: Megaphone,
                href: "/marketing/campaigns",
                subItems: [
                    { label: "Campaigns", icon: Megaphone, href: "/marketing/campaigns" },
                    { label: "Templates", icon: FileText, href: "/marketing/templates" },
                ]
            }
        ]
    },
    {
        section: "INTEGRATIONS",
        items: [
            {
                label: "Integrations",
                icon: Plug,
                href: "/integrations/whatsapp",
                subItems: [
                    { label: "WhatsApp WABA", icon: MessageCircle, href: "/integrations/whatsapp" },
                    { label: "API Keys", icon: Key, href: "/integrations/api-keys" },
                    { label: "Webhooks", icon: Webhook, href: "/integrations/webhooks" },
                ]
            }
        ]
    },
    {
        section: "ANALYTICS",
        items: [
            {
                label: "Reports",
                icon: BarChart3,
                href: "/analytics",
                subItems: [
                    { label: "Analytics", icon: PieChart, href: "/analytics" },
                    { label: "Usage Reports", icon: BarChart3, href: "/reports/usage-reports" },
                ]
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
                subItems: [
                    { label: "Overview", icon: LayoutDashboard, href: "/billing" },
                    { label: "Buy Credits", icon: Sparkles, href: "/billing/buy-credits" },
                    { label: "Credit History", icon: Receipt, href: "/billing/credit-history" },
                    { label: "Payments", icon: CreditCard, href: "/billing/payments" },
                    { label: "Invoices", icon: FileText, href: "/billing/invoices" },
                ]
            }
        ]
    },
    {
        section: "ACCOUNT",
        items: [
            {
                label: "Settings",
                icon: Settings,
                href: "/settings/company-profile",
                subItems: [
                    { label: "Team Members", icon: UserPlus, href: "/workspace/team-members" },
                    { label: "Roles & Permissions", icon: Shield, href: "/workspace/roles-permissions" },
                    { label: "Company Profile", icon: Building2, href: "/settings/company-profile" },
                    { label: "Notifications", icon: BellRing, href: "/settings/notification-settings" },
                ]
            }
        ]
    }
];

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { token, user, logout } = useAuth();

    // Sidebar states: collapsed & mobile drawer
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const [mobileOpen, setMobileOpen] = useState<boolean>(false);
    const [commandOpen, setCommandOpen] = useState<boolean>(false);

    // Notifications state
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Load initial collapse state from localStorage
    useEffect(() => {
        const savedState = localStorage.getItem("connectly360-sidebar-collapsed");
        if (savedState !== null) {
            setCollapsed(savedState === "true");
        }
    }, []);

    const toggleCollapse = () => {
        setCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem("connectly360-sidebar-collapsed", String(next));
            return next;
        });
    };

    // Fetch Notifications
    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status) {
                setNotifications(data.notifications || []);
                const unread = (data.notifications || []).filter((n: any) => !n.is_read).length;
                setUnreadCount(unread);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 12000);
        return () => clearInterval(interval);
    }, [token]);

    const handleReadAll = async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/notifications/read-all", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status) {
                fetchNotifications();
                toast.success("All notifications marked as read.");
            }
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    // Handle authentication / public standalone pages
    const isAuthPage =
        pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/forgot-password" ||
        pathname === "/verify-email";

    if (isAuthPage) {
        return <>{children}</>;
    }

    const isAdmin = user?.role === "owner" || user?.role === "admin";
    const navSections = [...NAV_SECTIONS];

    if (isAdmin) {
        // Append Platform section for authorized admin users
        navSections.push({
            section: "PLATFORM",
            items: [
                {
                    label: "Admin Panel",
                    icon: ShieldCheck,
                    href: "/admin/credits",
                    subItems: [
                        { label: "Credit Management", icon: Coins, href: "/admin/credits" }
                    ]
                }
            ]
        });
    }

    const isInboxPage = pathname === "/conversations" || pathname.startsWith("/customer/inbox");

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans selection:bg-[#35877D] selection:text-white dashboard-theme">
            {/* Command Palette Component */}
            <AppCommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

            {/* Mobile Backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* SIDEBAR APPLICATION PANEL */}
            <aside
                className={`fixed lg:static top-0 left-0 bottom-0 bg-white border-r border-slate-200 flex flex-col z-50 transition-all duration-300 ease-in-out shrink-0 ${
                    mobileOpen
                        ? "translate-x-0 w-64"
                        : "-translate-x-full lg:translate-x-0 " + (collapsed ? "w-[72px]" : "w-64")
                }`}
            >
                {/* Brand Header */}
                <div className={`h-16 px-4 flex items-center border-b border-slate-200 bg-white shrink-0 ${
                    collapsed ? "justify-center" : "justify-between"
                }`}>
                    <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
                        <img
                            src="/images/logo.png"
                            alt="Connectly360 Logo"
                            className="h-8 w-auto object-contain shrink-0"
                        />
                    </Link>

                    {!collapsed && (
                        <button
                            onClick={toggleCollapse}
                            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Collapse Sidebar"
                        >
                            <PanelLeftClose size={18} />
                        </button>
                    )}

                    <button
                        className="lg:hidden text-slate-400 hover:text-slate-700 cursor-pointer"
                        onClick={() => setMobileOpen(false)}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-4 font-sans scrollbar-thin">
                    {navSections.map((section, sIdx) => (
                        <div key={sIdx} className="space-y-1">
                            {!collapsed ? (
                                <div className="px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest truncate">
                                    {section.section}
                                </div>
                            ) : (
                                <div className="h-px bg-slate-100 my-2" />
                            )}

                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const hasSubItems = item.subItems && item.subItems.length > 0;
                                const isActive =
                                    pathname === item.href ||
                                    (item.href !== "/dashboard" && pathname.startsWith(item.href)) ||
                                    (hasSubItems && item.subItems!.some(s => pathname === s.href || (s.href !== "/dashboard" && pathname.startsWith(s.href))));

                                if (!hasSubItems) {
                                    const navLink = (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileOpen(false)}
                                            className={`flex items-center ${
                                                collapsed ? "justify-center px-2" : "justify-between px-3.5"
                                            } py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                                                isActive
                                                    ? "bg-[#35877D] text-white shadow-xs font-bold"
                                                    : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Icon size={18} className={isActive ? "text-white" : "text-slate-500"} />
                                                {!collapsed && <span className="truncate">{item.label}</span>}
                                            </div>
                                            {!collapsed && isActive && (
                                                <ChevronRight size={14} className="text-white/80 shrink-0" />
                                            )}
                                        </Link>
                                    );

                                    if (collapsed) {
                                        return (
                                            <Tooltip key={item.href} delayDuration={100}>
                                                <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                                                <TooltipContent side="right" className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
                                                    {item.label}
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    }

                                    return navLink;
                                }

                                // Collapsible Group Item
                                const parentLink = (
                                    <Collapsible key={item.href} defaultOpen={isActive} className="w-full">
                                        <CollapsibleTrigger asChild>
                                            <button
                                                className={`w-full flex items-center ${
                                                    collapsed ? "justify-center px-2" : "justify-between px-3.5"
                                                } py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                                                    isActive
                                                        ? "bg-[#35877D]/10 text-[#35877D] font-bold"
                                                        : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Icon size={18} className={isActive ? "text-[#35877D]" : "text-slate-500"} />
                                                    {!collapsed && <span className="truncate">{item.label}</span>}
                                                </div>
                                                {!collapsed && (
                                                    <ChevronDown size={14} className="text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0" />
                                                )}
                                            </button>
                                        </CollapsibleTrigger>

                                        {!collapsed && (
                                            <CollapsibleContent className="pl-4 pr-1 pt-1 space-y-0.5 border-l border-slate-100 my-1 ml-4">
                                                {item.subItems!.map((sub) => {
                                                    const SubIcon = sub.icon;
                                                    const isSubActive = pathname === sub.href || (sub.href !== "/dashboard" && pathname.startsWith(sub.href));

                                                    return (
                                                        <Link
                                                            key={sub.href}
                                                            href={sub.href}
                                                            onClick={() => setMobileOpen(false)}
                                                            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                                                                isSubActive
                                                                    ? "bg-[#35877D] text-white font-bold shadow-2xs"
                                                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                                            }`}
                                                        >
                                                            <SubIcon size={14} className={isSubActive ? "text-white" : "text-slate-400"} />
                                                            <span className="truncate">{sub.label}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </CollapsibleContent>
                                        )}
                                    </Collapsible>
                                );

                                if (collapsed) {
                                    return (
                                        <Tooltip key={item.href} delayDuration={100}>
                                            <TooltipTrigger asChild>{parentLink}</TooltipTrigger>
                                            <TooltipContent side="right" className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
                                                {item.label}
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                }

                                return parentLink;
                            })}
                        </div>
                    ))}
                </nav>

                {/* Sidebar Footer User Info */}
                <div className="p-3 border-t border-slate-200 bg-slate-50/70">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={`w-full flex items-center ${
                                    collapsed ? "justify-center p-2" : "gap-3 p-2.5"
                                } rounded-xl bg-white border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors text-left focus:outline-none cursor-pointer`}
                            >
                                <div className="h-8 w-8 rounded-full bg-[#35877D] text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                                </div>
                                {!collapsed && (
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-slate-900 truncate">
                                            {user?.name || "Workspace User"}
                                        </p>
                                        <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Workspace Admin
                                        </span>
                                    </div>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            side="top"
                            className="w-56 p-1.5 border border-slate-200 bg-white text-slate-800 rounded-2xl shadow-xl font-sans"
                        >
                            <DropdownMenuLabel className="px-2 py-1.5">
                                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                                    Account Profile
                                </p>
                                <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                                    {user?.name || "User"}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                    {user?.email || ""}
                                </p>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-100" />
                            <DropdownMenuItem asChild className="rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer font-semibold">
                                <Link href="/settings/company-profile" className="flex items-center gap-2">
                                    <Settings size={14} />
                                    <span>Account Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer font-semibold">
                                <Link href="/integrations/whatsapp" className="flex items-center gap-2">
                                    <MessageCircle size={14} />
                                    <span>WhatsApp Setup</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-100" />
                            <DropdownMenuItem
                                onClick={logout}
                                className="rounded-lg px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer font-bold flex items-center gap-2"
                            >
                                <LogOut size={14} />
                                <span>Sign Out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* MAIN APPLICATION VIEWPORT CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50/60">
                {/* STICKY TOP HEADER */}
                <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 sticky top-0">
                    <div className="flex items-center gap-3">
                        <button
                            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu size={20} />
                        </button>

                        {/* Expand button when collapsed desktop */}
                        {collapsed && (
                            <button
                                onClick={toggleCollapse}
                                className="hidden lg:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer mr-1"
                                title="Expand Sidebar"
                            >
                                <PanelLeftOpen size={18} />
                            </button>
                        )}

                        {/* Global Search Bar (opens Command Palette) */}
                        <button
                            onClick={() => setCommandOpen(true)}
                            className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#35877D]/50 text-xs text-slate-500 w-52 sm:w-72 md:w-80 transition-all cursor-pointer shadow-2xs group"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <Search size={14} className="text-slate-400 group-hover:text-[#35877D] shrink-0" />
                                <span className="truncate text-slate-500 font-medium text-xs">
                                    Search contacts, leads, campaigns...
                                </span>
                            </div>
                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs shrink-0">
                                ⌘K
                            </kbd>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Credits Balance display */}
                        <CreditBalance variant="header" />

                        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                        {/* Notifications Bell */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="relative p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-xl cursor-pointer transition-colors focus:outline-none">
                                    <Bell size={18} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 bg-rose-500 text-white font-extrabold text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-2xs">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-80 p-2 border border-slate-200 bg-white rounded-2xl shadow-xl z-50 flex flex-col gap-1 font-sans"
                                side="bottom"
                                align="end"
                            >
                                <div className="flex items-center justify-between px-2 py-1">
                                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReadAll();
                                            }}
                                            className="text-[10px] text-[#35877D] font-bold hover:underline bg-transparent border-0 cursor-pointer"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <DropdownMenuSeparator className="my-1 bg-slate-100" />
                                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 flex flex-col">
                                    {notifications.length === 0 ? (
                                        <div className="py-8 px-4 flex flex-col items-center justify-center text-center select-none">
                                            <div className="h-9 w-9 rounded-xl bg-[#35877D]/10 text-[#35877D] flex items-center justify-center mb-2">
                                                <Bell size={16} />
                                            </div>
                                            <p className="text-xs font-bold text-slate-800">All caught up!</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                                                No new notifications. We'll update you when activities occur.
                                            </p>
                                        </div>
                                    ) : (
                                        notifications.slice(0, 5).map((n) => (
                                            <div
                                                key={n.id}
                                                className={`p-2 hover:bg-slate-50 transition-colors flex flex-col gap-0.5 rounded-xl ${!n.is_read ? 'bg-slate-50/70' : ''}`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="text-xs font-bold text-slate-800 truncate">{n.title}</span>
                                                    {!n.is_read && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-[#35877D] shrink-0 mt-1" />
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-500 leading-normal">{n.message}</p>
                                                <span className="text-[9px] text-slate-400 font-semibold">
                                                    {new Date(n.created_at).toLocaleDateString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <DropdownMenuSeparator className="my-1 bg-slate-100" />
                                <Link
                                    href="/settings/notification-settings"
                                    className="w-full text-center text-xs font-bold text-[#35877D] hover:bg-[#35877D]/5 rounded-xl py-1.5 block cursor-pointer transition-colors"
                                >
                                    View all notifications
                                </Link>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="h-4 w-px bg-slate-200" />

                        {/* User Profile Header Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all focus:outline-none cursor-pointer">
                                    <div className="h-7 w-7 rounded-full bg-[#35877D] text-white flex items-center justify-center font-extrabold text-xs shrink-0">
                                        {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                                    </div>
                                    <span className="hidden md:inline-block text-xs font-bold text-slate-800 truncate max-w-28">
                                        {user?.name || "User"}
                                    </span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-56 p-1.5 border border-slate-200 bg-white text-slate-800 rounded-2xl shadow-xl font-sans"
                            >
                                <DropdownMenuLabel className="px-2 py-1.5">
                                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                                        Workspace Account
                                    </p>
                                    <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                                        {user?.name || "User"}
                                    </p>
                                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                        {user?.email || ""}
                                    </p>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-100" />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem asChild className="rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer font-semibold">
                                        <Link href="/settings/company-profile" className="flex items-center gap-2">
                                            <Settings size={14} />
                                            <span>Account Settings</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer font-semibold">
                                        <Link href="/integrations/whatsapp" className="flex items-center gap-2">
                                            <Plug size={14} />
                                            <span>WhatsApp Setup</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator className="bg-slate-100" />
                                <DropdownMenuItem
                                    onClick={logout}
                                    className="rounded-lg px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer font-bold flex items-center gap-2"
                                >
                                    <LogOut size={14} />
                                    <span>Sign Out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* SCROLLABLE FULL-VIEWPORT MAIN CONTENT */}
                <main className={`flex-1 overflow-y-auto w-full min-w-0 ${isInboxPage ? "p-0" : "p-4 sm:p-6 md:p-8 lg:p-10 space-y-6"}`}>
                    {children}
                </main>
            </div>
        </div>
    );
}
