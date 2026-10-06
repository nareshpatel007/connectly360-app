"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2, Search, Check, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";

interface Notification {
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export default function NotificationsPage() {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchNotifications = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch("/api/notifications", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.status) {
                setNotifications(data.notifications || []);
            }
        } catch (err) {
            console.error("Failed to load notifications", err);
            toast.error("Failed to load notifications.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [token]);

    const handleMarkAllRead = async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/notifications/read-all", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.status) {
                toast.success("All notifications marked as read.");
                fetchNotifications();
            } else {
                toast.error("Failed to mark notifications as read.");
            }
        } catch (err) {
            toast.error("Failed to update notifications.");
        }
    };

    const filteredNotifications = notifications.filter(n =>
        (n.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.message || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">

            <PageHeader
                icon={Bell}
                title="Notifications"
                description="View all system alerts and workspace activities in one place."
            />

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="animate-spin text-[#378179]" size={36} />
                    <p className="text-sm font-medium text-slate-500">Loading notifications...</p>
                </div>
            ) : (
                <Card className="border border-[#EAE6DF] bg-white shadow-xs rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-base font-bold text-slate-800">All Notifications</CardTitle>
                            <CardDescription className="text-slate-500 text-sm mt-0.5">
                                System notifications and activity alerts for your workspace.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
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
                            {notifications.some(n => !n.is_read) && (
                                <Button
                                    onClick={handleMarkAllRead}
                                    variant="outline"
                                    className="border-slate-200 text-slate-700 text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 bg-white font-semibold hover:bg-slate-50 cursor-pointer"
                                >
                                    <Check size={14} />
                                    Mark All as Read
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                    <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider pl-6">Notification</TableHead>
                                    <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Status</TableHead>
                                    <TableHead className="text-right font-extrabold text-slate-500 text-[10px] uppercase tracking-wider pr-6">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredNotifications.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-40 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                                                    <Bell size={18} />
                                                </div>
                                                <p className="text-xs font-semibold text-slate-500">No notifications found</p>
                                                <p className="text-xs">System warnings or updates will appear here.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredNotifications.map((n) => (
                                        <TableRow key={n.id} className="hover:bg-slate-50/40 transition-colors">
                                            <TableCell className="py-4 pl-6">
                                                <div className="flex flex-col gap-1 max-w-2xl">
                                                    <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
                                                        {n.title}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 leading-relaxed">{n.message}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {n.is_read ? (
                                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-105 text-slate-600 border border-slate-205">
                                                        Read
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100 animate-pulse">
                                                        Unread
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4 text-right text-xs text-slate-500 font-medium pr-6">
                                                {new Date(n.created_at).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
