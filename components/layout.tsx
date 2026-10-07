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
import { usePermissions } from "@/hooks/use-permissions";
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
import { resolveActiveNavigation } from "@/lib/navigation-matcher";
import { CLIENT_NAV_SECTIONS, type MenuItem, type SubMenuItem } from "@/lib/navigation-config";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationRealtimeProvider } from "@/components/notifications/NotificationRealtimeProvider";
import { useUnreadNotificationCount } from "@/lib/api-client-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { token, user, logout } = useAuth();
    const { data: unreadNotificationsCount = 0 } = useUnreadNotificationCount(user?.tenant_id);

    // Sidebar states: collapsed & mobile drawer
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const [mobileOpen, setMobileOpen] = useState<boolean>(false);
    const [commandOpen, setCommandOpen] = useState<boolean>(false);

    const { can, isOwner } = usePermissions();

    // Permission checker based on dynamic Spatie RBAC
    const isAllowed = (item: MenuItem | SubMenuItem) => {
        if (!item.permission) return true;
        return isOwner || can(item.permission);
    };

    // Centralized active navigation resolution (guarantees exactly 1 leaf item is active)
    const activeNav = React.useMemo(
        () => resolveActiveNavigation(pathname, CLIENT_NAV_SECTIONS),
        [pathname]
    );

    const [openMenuHref, setOpenMenuHref] = useState<string | null>(
        activeNav.expandedGroupId
    );

    useEffect(() => {
        if (activeNav.expandedGroupId) {
            setOpenMenuHref(activeNav.expandedGroupId);
        }
    }, [activeNav.expandedGroupId]);

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
        <NotificationRealtimeProvider>
            <div className="flex h-screen w-screen overflow-hidden bg-[#F7F9FA] text-[#172033] font-sans selection:bg-[#2F8F83] selection:text-white dashboard-theme">
            {/* Command Palette Component (Cmd + K) */}
            <AppCommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

            {/* Mobile Backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* SIDEBAR APPLICATION PANEL */}
            <aside
                className={`fixed lg:static top-0 left-0 bottom-0 bg-white border-r border-[#E5E9EE] flex flex-col z-50 transition-all duration-300 ease-in-out shrink-0 ${
                    mobileOpen
                        ? "translate-x-0 w-64 shadow-xl"
                        : "-translate-x-full lg:translate-x-0 " + (collapsed ? "w-[72px]" : "w-64")
                }`}
            >
                {/* Brand Header */}
                <div
                    className={`h-14 lg:h-16 px-4 flex items-center border-b border-[#E5E9EE] bg-white shrink-0 ${
                        collapsed ? "justify-center" : "justify-between"
                    }`}
                >
                    <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
                        <img
                            src="/images/logo.png"
                            alt="Connectly360 Logo"
                            className="h-7 w-auto object-contain shrink-0"
                        />
                    </Link>

                    {!collapsed && (
                        <button
                            onClick={toggleCollapse}
                            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Collapse Sidebar"
                        >
                            <PanelLeftClose size={17} />
                        </button>
                    )}

                    <button
                        className="lg:hidden text-slate-400 hover:text-slate-700 cursor-pointer p-1"
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
                                    <div className="px-3 py-1.5 text-[11px] font-semibold text-[#8A95A3] uppercase tracking-wider truncate">
                                        {section.section}
                                    </div>
                                ) : (
                                    <div className="h-px bg-slate-100 my-2" />
                                )}

                                {accessibleItems.map((item) => {
                                    const Icon = item.icon;
                                    const hasSubItems = item.subItems && item.subItems.length > 0;
                                    const isLeafActive = !hasSubItems && activeNav.activeLeafId === (item.id || item.href);

                                    if (!hasSubItems) {
                                        const navLink = (
                                            <Link
                                                key={item.href || item.id}
                                                href={item.href || "#"}
                                                onClick={() => setMobileOpen(false)}
                                                className={`flex items-center ${
                                                    collapsed ? "justify-center px-2" : "justify-between px-3"
                                                } py-2 rounded-lg text-[13px] transition-colors duration-150 ${
                                                    isLeafActive
                                                        ? "bg-[#EAF7F4] text-[#24796F] font-semibold"
                                                        : "text-[#536174] hover:bg-[#F2FAF8] hover:text-[#2F8F83] font-medium"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <Icon size={17} className={isLeafActive ? "text-[#24796F]" : "text-[#536174]"} />
                                                    {!collapsed && <span className="truncate">{item.label}</span>}
                                                </div>

                                                {!collapsed && item.href === "/conversations" && unreadNotificationsCount > 0 && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-500 text-white rounded-full">
                                                        {unreadNotificationsCount}
                                                    </span>
                                                )}

                                                {!collapsed && isLeafActive && item.href !== "/conversations" && (
                                                    <ChevronRight size={13} className="text-[#24796F]/70 shrink-0" />
                                                )}
                                            </Link>
                                        );

                                        if (collapsed) {
                                            return (
                                                <Tooltip key={item.id || item.href} delayDuration={100}>
                                                    <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                                                    <TooltipContent
                                                        side="right"
                                                        className="bg-slate-900 text-white text-xs font-medium px-2.5 py-1 rounded-md shadow-md"
                                                    >
                                                        {item.label}
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        }

                                        return navLink;
                                    }

                                    // Collapsible Group Item
                                    const groupId = item.id || item.label || item.href;
                                    const isOpen = openMenuHref === groupId;
                                    const filteredSubItems = item.subItems!.filter(isAllowed);

                                    const parentLink = (
                                        <Collapsible
                                            key={groupId}
                                            open={isOpen}
                                            onOpenChange={(nextOpen) => {
                                                setOpenMenuHref(nextOpen ? (groupId || null) : null);
                                            }}
                                            className="w-full"
                                        >
                                            <CollapsibleTrigger asChild>
                                                <button
                                                    className={`w-full flex items-center ${
                                                        collapsed ? "justify-center px-2" : "justify-between px-3"
                                                    } py-2 rounded-lg text-[13px] transition-colors duration-150 cursor-pointer ${
                                                        isOpen
                                                            ? "bg-slate-50 text-slate-800 font-semibold"
                                                            : "text-[#536174] hover:bg-[#F2FAF8] hover:text-[#2F8F83] font-medium"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <Icon size={17} className={isOpen ? "text-[#24796F]" : "text-[#536174]"} />
                                                        {!collapsed && <span className="truncate">{item.label}</span>}
                                                    </div>
                                                    {!collapsed && (
                                                        <ChevronDown
                                                            size={13}
                                                            className={`text-slate-400 transition-transform duration-200 ${
                                                                isOpen ? "rotate-180" : ""
                                                            } shrink-0`}
                                                        />
                                                    )}
                                                </button>
                                            </CollapsibleTrigger>

                                            {!collapsed && (
                                                <CollapsibleContent className="pl-3.5 pr-1 pt-0.5 space-y-0.5 border-l border-[#E5E9EE] my-1 ml-4">
                                                    {filteredSubItems.map((sub) => {
                                                        const SubIcon = sub.icon;
                                                        const isSubActive = activeNav.activeLeafId === (sub.id || sub.href);

                                                        return (
                                                            <Link
                                                                key={sub.id || sub.href}
                                                                href={sub.href}
                                                                onClick={() => setMobileOpen(false)}
                                                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                                                                    isSubActive
                                                                        ? "bg-[#EAF7F4] text-[#24796F] font-semibold"
                                                                        : "text-[#536174] hover:bg-slate-50 hover:text-slate-900 font-medium"
                                                                }`}
                                                            >
                                                                <SubIcon size={13} className={isSubActive ? "text-[#24796F]" : "text-slate-400"} />
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
                                            <Tooltip key={groupId} delayDuration={100}>
                                                <TooltipTrigger asChild>{parentLink}</TooltipTrigger>
                                                <TooltipContent
                                                    side="right"
                                                    className="bg-slate-900 text-white text-xs font-medium px-2.5 py-1 rounded-md shadow-md"
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
                <div className="p-3 border-t border-[#E5E9EE] bg-white">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={`w-full flex items-center ${
                                    collapsed ? "justify-center p-1.5" : "gap-2.5 p-2"
                                } rounded-lg bg-slate-50/80 border border-[#E5E9EE] hover:bg-slate-100/70 transition-all text-left focus:outline-none cursor-pointer`}
                            >
                                <div className="h-7 w-7 rounded-full bg-[#E8F6F3] text-[#2F8F83] font-semibold text-xs flex items-center justify-center shrink-0 border border-[#BFE4DD]">
                                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                                </div>
                                {!collapsed && (
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-[#172033] truncate">
                                            {user?.name || "Workspace User"}
                                        </p>
                                        <p className="text-[11px] text-[#5F6B7A] truncate capitalize font-normal">
                                            {user?.role ? user.role.replace("_", " ") : "Member"}
                                        </p>
                                    </div>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="start" className="w-56 p-1 font-sans shadow-lg rounded-lg border-[#E5E9EE]">
                            <DropdownMenuLabel className="text-xs font-semibold text-slate-800">My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/settings/company-profile" className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                                    <Building2 size={14} className="text-slate-500" /> Company Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/workspace/team-members" className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                                    <Users size={14} className="text-slate-500" /> Workspace Team
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={logout}
                                className="flex items-center gap-2 text-xs font-medium text-rose-600 focus:text-rose-600 cursor-pointer"
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
                <header className="h-14 lg:h-16 border-b border-[#E5E9EE] bg-white px-4 lg:px-6 flex items-center justify-between gap-4 shrink-0 z-30">
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <Menu size={19} />
                        </button>

                        {collapsed && (
                            <button
                                onClick={toggleCollapse}
                                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Expand Sidebar"
                            >
                                <PanelLeftOpen size={17} />
                            </button>
                        )}

                        {/* Global Search Button (Cmd + K) */}
                        <button
                            onClick={() => setCommandOpen(true)}
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#F7F9FA] hover:bg-slate-100/80 border border-[#E5E9EE] rounded-lg text-xs font-normal text-[#5F6B7A] transition-all cursor-pointer w-60 md:w-72 justify-between group focus:ring-2 focus:ring-[#2F8F83]/20 h-9"
                        >
                            <div className="flex items-center gap-2">
                                <Search size={14} className="text-[#8A95A3]" />
                                <span>Search contacts, leads, campaigns...</span>
                            </div>
                            <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white border border-[#E5E9EE] rounded shadow-2xs">
                                Ctrl+K
                            </kbd>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-2.5">
                        {/* Quick Create Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="h-9 flex items-center gap-1.5 px-3 bg-white hover:bg-slate-50 text-[#172033] border border-[#E5E9EE] font-medium text-xs rounded-lg shadow-2xs transition-all cursor-pointer">
                                    <Plus size={15} className="text-[#2F8F83]" />
                                    <span className="hidden sm:inline">Quick Create</span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 p-1 font-sans shadow-lg rounded-lg border-[#E5E9EE]">
                                <DropdownMenuLabel className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                    New Workspace Item
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push("/conversations?action=new")} className="text-xs font-medium cursor-pointer">
                                    <MessageSquare size={14} className="text-[#2F8F83] mr-2" /> New Conversation
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/contacts?action=new")} className="text-xs font-medium cursor-pointer">
                                    <Users size={14} className="text-[#2F8F83] mr-2" /> New Contact
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/leads?action=new")} className="text-xs font-medium cursor-pointer">
                                    <GitBranch size={14} className="text-[#2F8F83] mr-2" /> New Lead
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/marketing/campaigns?action=new")} className="text-xs font-medium cursor-pointer">
                                    <Megaphone size={14} className="text-[#2F8F83] mr-2" /> New Campaign
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/automations?action=new")} className="text-xs font-medium cursor-pointer">
                                    <Zap size={14} className="text-[#2F8F83] mr-2" /> New Automation
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/ai-assistant?action=new")} className="text-xs font-medium cursor-pointer">
                                    <Bot size={14} className="text-[#2F8F83] mr-2" /> New AI Agent
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/segments?action=new")} className="text-xs font-medium cursor-pointer">
                                    <Filter size={14} className="text-[#2F8F83] mr-2" /> New Segment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/tasks?action=new")} className="text-xs font-medium cursor-pointer">
                                    <CheckSquare size={14} className="text-[#2F8F83] mr-2" /> New Task
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Credit Balance Badge Component */}
                        <CreditBalance />

                        {/* Real-time Notification Bell & Notification Center */}
                        <NotificationBell />
                    </div>
                </header>

                {/* Page Content Render Area */}
                {pathname?.startsWith("/conversations") ? (
                    <main className="flex-1 overflow-hidden bg-white p-0 flex flex-col min-w-0">
                        {children}
                    </main>
                ) : (
                    <main className="flex-1 overflow-y-auto bg-[#F7F9FA] p-4 sm:p-6 md:p-8">
                        {children}
                    </main>
                )}
            </div>
        </div>
        </NotificationRealtimeProvider>
    );
}
