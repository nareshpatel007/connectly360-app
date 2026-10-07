"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Bell,
    CheckCheck,
    MessageSquare,
    PhoneCall,
    Megaphone,
    CreditCard,
    Users,
    Zap,
    Bot,
    Plug,
    Code,
    Shield,
    CheckSquare,
    AlertTriangle,
    Settings,
    CheckCircle2,
    ExternalLink,
    Loader2,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    useNotifications,
    useUnreadNotificationCount,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
    type AppNotification,
} from "@/lib/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { formatDistanceToNowStrict } from "date-fns";

export function NotificationBell() {
    const { user } = useAuth();
    const router = useRouter();
    const workspaceId = user?.tenant_id ?? null;

    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

    const { data: unreadCount = 0 } = useUnreadNotificationCount(workspaceId);
    const {
        data: notifData,
        isLoading,
    } = useNotifications({
        unreadOnly: activeTab === "unread",
        perPage: 25,
        workspaceId,
    });

    const markReadMutation = useMarkNotificationRead(workspaceId);
    const markAllReadMutation = useMarkAllNotificationsRead(workspaceId);

    const notifications = notifData?.notifications || [];

    const handleItemClick = (n: AppNotification) => {
        if (!n.is_read) {
            markReadMutation.mutate(n.id);
        }
        setIsOpen(false);
        if (n.action_url) {
            router.push(n.action_url);
        }
    };

    const handleMarkAllRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        markAllReadMutation.mutate();
    };

    const getIconForType = (type: string, priority: string) => {
        const prefix = type.split(".")[0];
        const iconSize = 15;

        if (priority === "critical") {
            return <AlertTriangle size={iconSize} className="text-rose-600" />;
        }

        switch (prefix) {
            case "whatsapp":
                return <PhoneCall size={iconSize} className="text-emerald-600" />;
            case "conversation":
                return <MessageSquare size={iconSize} className="text-[#35877D]" />;
            case "campaign":
                return <Megaphone size={iconSize} className="text-indigo-600" />;
            case "billing":
                return <CreditCard size={iconSize} className="text-amber-600" />;
            case "team":
                return <Users size={iconSize} className="text-blue-600" />;
            case "task":
                return <CheckSquare size={iconSize} className="text-teal-600" />;
            case "automation":
                return <Zap size={iconSize} className="text-amber-500" />;
            case "ai":
                return <Bot size={iconSize} className="text-purple-600" />;
            case "integration":
                return <Plug size={iconSize} className="text-cyan-600" />;
            case "developer":
                return <Code size={iconSize} className="text-slate-700" />;
            case "security":
                return <Shield size={iconSize} className="text-rose-500" />;
            default:
                return <Bell size={iconSize} className="text-[#35877D]" />;
        }
    };

    const formatTimestamp = (dateString: string) => {
        try {
            return formatDistanceToNowStrict(new Date(dateString), { addSuffix: true });
        } catch {
            return "recently";
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none"
                    aria-label={`Notifications (${unreadCount} unread)`}
                >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-88 sm:w-96 p-0 font-sans shadow-2xl border border-slate-200/90 rounded-2xl overflow-hidden bg-white z-50"
            >
                {/* Header */}
                <div className="p-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                                {unreadCount} new
                            </span>
                        )}
                    </div>

                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={handleMarkAllRead}
                            disabled={markAllReadMutation.isPending}
                            className="text-[11px] font-bold text-[#35877D] hover:text-[#28665e] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                            {markAllReadMutation.isPending ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <CheckCheck size={13} />
                            )}
                            Mark all read
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex border-b border-slate-100 bg-white px-3 pt-2 gap-2 text-xs">
                    <button
                        type="button"
                        onClick={() => setActiveTab("all")}
                        className={`pb-2 px-2 font-bold cursor-pointer transition-colors border-b-2 ${
                            activeTab === "all"
                                ? "border-[#35877D] text-[#35877D]"
                                : "border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                    >
                        All
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("unread")}
                        className={`pb-2 px-2 font-bold cursor-pointer transition-colors border-b-2 flex items-center gap-1.5 ${
                            activeTab === "unread"
                                ? "border-[#35877D] text-[#35877D]"
                                : "border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                    >
                        Unread
                        {unreadCount > 0 && (
                            <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
                        )}
                    </button>
                </div>

                {/* Notification Items List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1 text-xs">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-400 font-semibold flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin text-[#35877D]" />
                            Loading alerts...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 space-y-1">
                            <CheckCircle2 size={24} className="mx-auto text-slate-300 mb-2" />
                            <p className="font-bold text-slate-700">No alerts right now</p>
                            <p className="text-[11px] text-slate-400">
                                {activeTab === "unread"
                                    ? "You have marked all notifications as read."
                                    : "You're all caught up on workspace activity."}
                            </p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => handleItemClick(n)}
                                className={`p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 hover:bg-slate-50 ${
                                    !n.is_read ? "bg-teal-50/40" : "opacity-85"
                                }`}
                            >
                                <div
                                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${
                                        n.priority === "critical"
                                            ? "bg-rose-50 border border-rose-200"
                                            : n.priority === "high"
                                            ? "bg-amber-50 border border-amber-200"
                                            : "bg-teal-50/70 border border-teal-100"
                                    }`}
                                >
                                    {getIconForType(n.type, n.priority)}
                                </div>

                                <div className="min-w-0 flex-1 space-y-0.5">
                                    <div className="flex items-center justify-between gap-1">
                                        <p className="font-bold text-slate-900 truncate text-xs">
                                            {n.title}
                                        </p>
                                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                                            {formatTimestamp(n.created_at)}
                                        </span>
                                    </div>

                                    <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed">
                                        {n.message}
                                    </p>

                                    <div className="flex items-center gap-2 pt-0.5">
                                        {n.priority === "critical" && (
                                            <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                                                Critical
                                            </span>
                                        )}
                                        {n.priority === "high" && (
                                            <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-700">
                                                High
                                            </span>
                                        )}
                                        {n.action_url && (
                                            <span className="text-[10px] font-semibold text-[#35877D] flex items-center gap-0.5 hover:underline">
                                                Open <ExternalLink size={10} />
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {!n.is_read && (
                                    <span className="h-2 w-2 rounded-full bg-[#35877D] shrink-0 mt-1.5" />
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-2.5 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            router.push("/settings/notification-settings");
                        }}
                        className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                        <Settings size={12} />
                        Notification Settings
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            router.push("/notifications");
                        }}
                        className="text-[#35877D] hover:underline font-bold cursor-pointer"
                    >
                        View all
                    </button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
