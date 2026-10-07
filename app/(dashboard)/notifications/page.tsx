"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Bell,
    Check,
    CheckCheck,
    Search,
    Loader2,
    Trash2,
    ExternalLink,
    AlertTriangle,
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
    Filter,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    useNotifications,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
    useDeleteNotification,
    type AppNotification,
} from "@/lib/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { formatDistanceToNowStrict } from "date-fns";
import { toast } from "sonner";

export default function NotificationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const workspaceId = user?.tenant_id ?? null;

    const [statusFilter, setStatusFilter] = useState<"all" | "unread">("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");

    const { data, isLoading } = useNotifications({
        unreadOnly: statusFilter === "unread",
        perPage: 50,
        workspaceId,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
    });

    const markReadMutation = useMarkNotificationRead(workspaceId);
    const markAllReadMutation = useMarkAllNotificationsRead(workspaceId);
    const deleteMutation = useDeleteNotification(workspaceId);

    const notifications = data?.notifications || [];

    const filteredNotifications = notifications.filter((n) => {
        const query = searchTerm.toLowerCase();
        return (
            (n.title || "").toLowerCase().includes(query) ||
            (n.message || "").toLowerCase().includes(query)
        );
    });

    const handleItemClick = (n: AppNotification) => {
        if (!n.is_read) {
            markReadMutation.mutate(n.id);
        }
        if (n.action_url) {
            router.push(n.action_url);
        }
    };

    const handleDelete = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        deleteMutation.mutate(id, {
            onSuccess: () => toast.success("Notification removed."),
        });
    };

    const getIconForType = (type: string, priority: string) => {
        const prefix = type.split(".")[0];
        const iconSize = 16;

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
        <div className="space-y-6 max-w-6xl">
            <PageHeader
                icon={Bell}
                title="Notifications"
                description="View and manage all real-time alerts and workspace activity in one centralized feed."
            />

            <Card className="border border-[#EAE6DF] bg-white shadow-xs rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-base font-bold text-slate-800">
                            Workspace Alerts & Feed
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-sm mt-0.5">
                            {data?.unreadCount ?? 0} unread notifications in current workspace.
                        </CardDescription>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Search Input */}
                        <div className="relative w-44 sm:w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                type="search"
                                placeholder="Search alerts..."
                                className="pl-9 h-9 text-xs text-slate-600 rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filter Status */}
                        <div className="flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setStatusFilter("all")}
                                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                    statusFilter === "all"
                                        ? "bg-white text-slate-900 shadow-2xs font-bold"
                                        : "text-slate-500 hover:text-slate-900"
                                }`}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter("unread")}
                                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                    statusFilter === "unread"
                                        ? "bg-white text-slate-900 shadow-2xs font-bold"
                                        : "text-slate-500 hover:text-slate-900"
                                }`}
                            >
                                Unread
                            </button>
                        </div>

                        {/* Mark all as read */}
                        {(data?.unreadCount ?? 0) > 0 && (
                            <Button
                                type="button"
                                onClick={() => markAllReadMutation.mutate()}
                                disabled={markAllReadMutation.isPending}
                                variant="outline"
                                className="border-slate-200 text-slate-700 text-xs h-9 px-3 rounded-xl flex items-center gap-1.5 bg-white font-semibold hover:bg-slate-50 cursor-pointer"
                            >
                                {markAllReadMutation.isPending ? (
                                    <Loader2 size={13} className="animate-spin" />
                                ) : (
                                    <CheckCheck size={14} />
                                )}
                                Mark All Read
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="animate-spin text-[#378179]" size={32} />
                            <p className="text-sm font-medium text-slate-500">Loading alerts...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="p-16 text-center text-slate-400 space-y-2">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-300">
                                <Bell size={24} />
                            </div>
                            <p className="text-sm font-bold text-slate-700">No alerts found</p>
                            <p className="text-xs text-slate-400">
                                {statusFilter === "unread"
                                    ? "You have zero unread notifications."
                                    : "New conversations, campaigns, or system updates will appear here."}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                    <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider pl-6">
                                        Alert
                                    </TableHead>
                                    <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">
                                        Priority
                                    </TableHead>
                                    <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">
                                        Status
                                    </TableHead>
                                    <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">
                                        Time
                                    </TableHead>
                                    <TableHead className="text-right font-extrabold text-slate-500 text-[10px] uppercase tracking-wider pr-6">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredNotifications.map((n) => (
                                    <TableRow
                                        key={n.id}
                                        onClick={() => handleItemClick(n)}
                                        className={`hover:bg-slate-50/60 transition-colors cursor-pointer ${
                                            !n.is_read ? "bg-teal-50/30" : ""
                                        }`}
                                    >
                                        <TableCell className="py-4 pl-6">
                                            <div className="flex items-start gap-3 max-w-xl">
                                                <div
                                                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${
                                                        n.priority === "critical"
                                                            ? "bg-rose-50 border border-rose-200"
                                                            : n.priority === "high"
                                                            ? "bg-amber-50 border border-amber-200"
                                                            : "bg-teal-50/70 border border-teal-100"
                                                    }`}
                                                >
                                                    {getIconForType(n.type, n.priority)}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="font-bold text-slate-800 text-xs">
                                                        {n.title}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                                        {n.message}
                                                    </p>
                                                    {n.action_url && (
                                                        <span className="text-[10px] font-semibold text-[#35877D] inline-flex items-center gap-0.5 pt-0.5 hover:underline">
                                                            View entity <ExternalLink size={10} />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="py-4">
                                            {n.priority === "critical" ? (
                                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                                                    Critical
                                                </span>
                                            ) : n.priority === "high" ? (
                                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                                                    High
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                    Normal
                                                </span>
                                            )}
                                        </TableCell>

                                        <TableCell className="py-4">
                                            {n.is_read ? (
                                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                    Read
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 animate-pulse">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                                                    Unread
                                                </span>
                                            )}
                                        </TableCell>

                                        <TableCell className="py-4 text-xs text-slate-500 font-medium">
                                            {formatTimestamp(n.created_at)}
                                        </TableCell>

                                        <TableCell className="py-4 text-right pr-6">
                                            <div
                                                className="flex items-center justify-end gap-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {!n.is_read && (
                                                    <button
                                                        type="button"
                                                        onClick={() => markReadMutation.mutate(n.id)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#35877D] hover:bg-teal-50 transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDelete(e, n.id)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                    title="Delete notification"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
