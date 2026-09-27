"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    ChevronRight,
    ChevronDown,
    LogOut,
    Bell,
    Search,
    Menu,
    X,
    PanelLeftClose,
    PanelLeftOpen,
    Plus,
    MessageSquare,
    Users,
    GitBranch,
    Megaphone,
    Zap,
    Bot,
    Filter,
    CheckSquare,
    Building2,
    Shield,
    Sparkles,
    User
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
import { CLIENT_NAV_SECTIONS, MenuItem, SubMenuItem } from "@/lib/navigation-config";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { token, user, logout } = useAuth();

    // Sidebar states: collapsed & mobile drawer
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const [mobileOpen, setMobileOpen] = useState<boolean>(false);
    const [commandOpen, setCommandOpen] = useState<boolean>(false);

    // Permission checker based on workspace RBAC
    const isAllowed = (item: MenuItem | SubMenuItem) => {
        if (!item.permission) return true;
        if (!user?.role) return true;
        const normalizedRole = user.role.toLowerCase();
        if (["owner", "admin", "super_admin"].includes(normalizedRole)) return true;

        if (normalizedRole === "manager") {
            return !["workspace.roles.view", "billing.view"].includes(item.permission);
        }
        if (normalizedRole === "agent") {
            return ["inbox.view", "contacts.view", "leads.view", "tasks.view", "templates.view", "dashboard.view"].includes(item.permission);
        }
        if (normalizedRole === "developer") {
            return ["developer.view", "integrations.view", "whatsapp.view", "dashboard.view"].includes(item.permission);
        }
        return true;
    };

    // Sub-menu active state detector
    const checkActiveSub = (sub: SubMenuItem) => {
        return (
            pathname === sub.href ||
            (sub.href !== "/dashboard" && sub.href !== "/billing" && pathname.startsWith(sub.href + "/"))
        );
    };

    const initialActiveParent = CLIENT_NAV_SECTIONS
        .flatMap((s) => s.items)
        .find((item) => item.subItems?.some(checkActiveSub));

    const [openMenuHref, setOpenMenuHref] = useState<string | null>(
        initialActiveParent ? initialActiveParent.href : null
    );

    useEffect(() => {
        const currentActiveParent = CLIENT_NAV_SECTIONS
            .flatMap((s) => s.items)
            .find((item) => item.subItems?.some(checkActiveSub));
        if (currentActiveParent) {
            setOpenMenuHref(currentActiveParent.href);
        }
    }, [pathname]);

    // Notifications state
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Load collapse state from localStorage
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

    // Fetch Notifications & Unread Count from backend API
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
        } catch {
            // Silently handle offline/mock mode
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
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
        } catch {
            toast.error("Failed to mark notifications as read.");
        }
    };

    // Auth pages bypass
    const isAuthPage =
        pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/forgot-password" ||
        pathname === "/verify-email";

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans selection:bg-[#35877D] selection:text-white dashboard-theme">
            {/* Command Palette Component (Cmd + K) */}
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
                <div
                    className={`h-16 px-4 flex items-center border-b border-slate-200 bg-white shrink-0 ${
                        collapsed ? "justify-center" : "justify-between"
                    }`}
                >
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
                    {CLIENT_NAV_SECTIONS.map((section, sIdx) => {
                        const accessibleItems = section.items.filter((item) => {
                            if (!isAllowed(item)) return false;
                            if (item.subItems) {
                                return item.subItems.some(isAllowed);
                            }
                            return true;
                        });

                        if (accessibleItems.length === 0) return null;

                        return (
                            <div key={sIdx} className="space-y-1">
                                {!collapsed ? (
                                    <div className="px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest truncate">
                                        {section.section}
                                    </div>
                                ) : (
                                    <div className="h-px bg-slate-100 my-2" />
                                )}

                                {accessibleItems.map((item) => {
                                    const Icon = item.icon;
                                    const hasSubItems = item.subItems && item.subItems.length > 0;
                                    const isActive =
                                        pathname === item.href ||
                                        (item.href !== "/dashboard" && item.href !== "/billing" && pathname.startsWith(item.href + "/")) ||
                                        (hasSubItems && item.subItems!.some(checkActiveSub));

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

                                                {!collapsed && item.href === "/conversations" && unreadCount > 0 && (
                                                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-500 text-white rounded-full shadow-2xs">
                                                        {unreadCount}
                                                    </span>
                                                )}

                                                {!collapsed && isActive && item.href !== "/conversations" && (
                                                    <ChevronRight size={14} className="text-white/80 shrink-0" />
                                                )}
                                            </Link>
                                        );

                                        if (collapsed) {
                                            return (
                                                <Tooltip key={item.href} delayDuration={100}>
                                                    <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                                                    <TooltipContent
                                                        side="right"
                                                        className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg"
                                                    >
                                                        {item.label}
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        }

                                        return navLink;
                                    }

                                    // Collapsible Group Item
                                    const isOpen = openMenuHref === item.href;
                                    const filteredSubItems = item.subItems!.filter(isAllowed);

                                    const parentLink = (
                                        <Collapsible
                                            key={item.href}
                                            open={isOpen}
                                            onOpenChange={(nextOpen) => {
                                                setOpenMenuHref(nextOpen ? item.href : null);
                                            }}
                                            className="w-full"
                                        >
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
                                                        <ChevronDown
                                                            size={14}
                                                            className={`text-slate-400 transition-transform duration-200 ${
                                                                isOpen ? "rotate-180" : ""
                                                            } shrink-0`}
                                                        />
                                                    )}
                                                </button>
                                            </CollapsibleTrigger>

                                            {!collapsed && (
                                                <CollapsibleContent className="pl-4 pr-1 pt-1 space-y-0.5 border-l border-slate-100 my-1 ml-4">
                                                    {filteredSubItems.map((sub) => {
                                                        const SubIcon = sub.icon;
                                                        const isSubActive = checkActiveSub(sub);

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
                                                <TooltipContent
                                                    side="right"
                                                    className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg"
                                                >
                                                    {item.label}
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    }

                                    return parentLink;
                                })}
                            </div>
                        );
                    })}
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
                                        <p className="text-[10px] text-slate-500 truncate capitalize font-medium">
                                            {user?.role ? user.role.replace("_", " ") : "Member"}
                                        </p>
                                    </div>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="start" className="w-56 p-1.5 font-sans">
                            <DropdownMenuLabel className="text-xs font-bold text-slate-900">My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/settings/company-profile" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                                    <Building2 size={14} className="text-slate-500" /> Company Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/workspace/team-members" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                                    <Users size={14} className="text-slate-500" /> Workspace Team
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={logout}
                                className="flex items-center gap-2 text-xs font-bold text-rose-600 focus:text-rose-600 cursor-pointer"
                            >
                                <LogOut size={14} /> Log Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* MAIN CONTENT AREA & GLOBAL HEADER */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Global Header Bar */}
                <header className="h-16 border-b border-slate-200 bg-white px-4 lg:px-6 flex items-center justify-between gap-4 shrink-0 z-30">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <Menu size={20} />
                        </button>

                        {collapsed && (
                            <button
                                onClick={toggleCollapse}
                                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Expand Sidebar"
                            >
                                <PanelLeftOpen size={18} />
                            </button>
                        )}

                        {/* Global Search Button (Cmd + K) */}
                        <button
                            onClick={() => setCommandOpen(true)}
                            className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 transition-all cursor-pointer w-64 md:w-80 justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <Search size={15} className="text-[#35877D]" />
                                <span>Search contacts, leads, campaigns...</span>
                            </div>
                            <kbd className="px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs">
                                Ctrl+K
                            </kbd>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Quick Create Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer">
                                    <Plus size={16} />
                                    <span className="hidden sm:inline">Quick Create</span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 p-1.5 font-sans">
                                <DropdownMenuLabel className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                                    New Workspace Item
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push("/conversations?action=new")} className="text-xs font-semibold cursor-pointer">
                                    <MessageSquare size={14} className="text-[#35877D] mr-2" /> New Conversation
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/contacts?action=new")} className="text-xs font-semibold cursor-pointer">
                                    <Users size={14} className="text-[#35877D] mr-2" /> New Contact
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/leads?action=new")} className="text-xs font-semibold cursor-pointer">
                                    <GitBranch size={14} className="text-[#35877D] mr-2" /> New Lead
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/marketing/campaigns?action=new")} className="text-xs font-semibold cursor-pointer">
                                    <Megaphone size={14} className="text-[#35877D] mr-2" /> New Campaign
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/automations?action=new")} className="text-xs font-semibold cursor-pointer">
                                    <Zap size={14} className="text-[#35877D] mr-2" /> New Automation
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/ai-assistant?action=new")} className="text-xs font-semibold cursor-pointer">
                                    <Bot size={14} className="text-[#35877D] mr-2" /> New AI Agent
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/segments?action=new")} className="text-xs font-semibold cursor-pointer">
                                    <Filter size={14} className="text-[#35877D] mr-2" /> New Segment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/tasks?action=new")} className="text-xs font-semibold cursor-pointer">
                                    <CheckSquare size={14} className="text-[#35877D] mr-2" /> New Task
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Credit Balance Badge Component */}
                        <CreditBalance />

                        {/* Notifications Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer">
                                    <Bell size={18} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 h-4 w-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80 p-0 font-sans shadow-xl border border-slate-200 rounded-2xl overflow-hidden">
                                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-900">Workspace Alerts</span>
                                    {unreadCount > 0 && (
                                        <button onClick={handleReadAll} className="text-[11px] font-bold text-[#35877D] hover:underline cursor-pointer">
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-2 text-xs">
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400 font-semibold">No recent alerts</div>
                                    ) : (
                                        notifications.map((n) => (
                                            <div key={n.id} className={`p-2.5 rounded-xl space-y-1 ${!n.is_read ? "bg-teal-50/50" : ""}`}>
                                                <p className="font-bold text-slate-900">{n.title || "System Alert"}</p>
                                                <p className="text-slate-600 text-[11px]">{n.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Content Render Area */}
                <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
            </div>
        </div>
    );
}
