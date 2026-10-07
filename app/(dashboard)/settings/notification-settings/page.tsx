"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    BellRing,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Bell,
    Globe,
    Mail,
    Monitor,
    MessageSquare,
    Shield,
    Lock,
    ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    useNotificationPreferences,
    useUpdateNotificationPreferences,
    type NotificationCategoryGroup,
    type NotificationPreferenceItem,
} from "@/lib/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { useNotificationRealtime } from "@/components/notifications/NotificationRealtimeProvider";

export default function NotificationSettingsPage() {
    const { user } = useAuth();
    const workspaceId = user?.tenant_id ?? null;

    const { data: preferencesData, isLoading } = useNotificationPreferences(workspaceId);
    const updateMutation = useUpdateNotificationPreferences(workspaceId);
    const { browserPermission, requestBrowserPermission, isSupported } = useNotificationRealtime();

    // Local editable preferences map: key -> preference item
    const [localPreferences, setLocalPreferences] = useState<Record<string, NotificationPreferenceItem>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [requestingBrowser, setRequestingBrowser] = useState(false);

    // Sync from API server state
    useEffect(() => {
        if (preferencesData?.preferences) {
            const map: Record<string, NotificationPreferenceItem> = {};
            preferencesData.preferences.forEach((item) => {
                map[item.key] = { ...item };
            });
            setLocalPreferences(map);
            setIsDirty(false);
        }
    }, [preferencesData]);

    // Group items by category from the server
    const categoryGroups = useMemo<NotificationCategoryGroup[]>(() => {
        if (!preferencesData?.categories) return [];
        return preferencesData.categories.map((cat) => ({
            ...cat,
            items: cat.items.map((item) => localPreferences[item.key] || item),
        }));
    }, [preferencesData, localPreferences]);

    // Toggle master (all channels or in_app) for a specific notification type
    const toggleMaster = (key: string) => {
        const current = localPreferences[key];
        if (!current || current.locked) return;

        // If currently any is on, turn off; if all off, turn on default channels
        const isCurrentlyActive = current.in_app || current.toast || current.browser;
        const nextValue = !isCurrentlyActive;

        setLocalPreferences((prev) => ({
            ...prev,
            [key]: {
                ...current,
                in_app: nextValue,
                toast: nextValue,
                browser: nextValue,
                // Email remains opt-in if it was already on or keep sensible default
                email: nextValue ? current.email : false,
            },
        }));
        setIsDirty(true);
    };

    // Toggle specific channel (in_app, toast, browser, email)
    const toggleChannel = (key: string, channel: "in_app" | "toast" | "browser" | "email") => {
        const current = localPreferences[key];
        if (!current || current.locked) return;

        setLocalPreferences((prev) => ({
            ...prev,
            [key]: {
                ...current,
                [channel]: !current[channel],
            },
        }));
        setIsDirty(true);
    };

    // Save changes
    const handleSave = async () => {
        const itemsToUpdate = Object.values(localPreferences);
        try {
            await updateMutation.mutateAsync(itemsToUpdate);
            setIsDirty(false);
            toast.success("Notification preferences saved successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to save notification preferences.");
        }
    };

    const handleEnableBrowser = async () => {
        setRequestingBrowser(true);
        try {
            await requestBrowserPermission();
        } finally {
            setRequestingBrowser(false);
        }
    };

    return (
        <div className="space-y-6 w-full">
            <PageHeader
                icon={BellRing}
                title="Notification Settings"
                description="Control what alerts you receive via email, web notifications, and mobile."
            />

            {/* Browser Notifications Permission Card */}
            <Card className="border border-[#E5E9EE] bg-white shadow-2xs rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-[#E5E9EE] pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-xl bg-[#E8F6F3] border border-[#BFE4DD] flex items-center justify-center shrink-0 text-[#2F8F83] shadow-2xs mt-0.5">
                                <Monitor size={18} />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-bold text-slate-800">
                                    Browser & System Notifications
                                </CardTitle>
                                <CardDescription className="text-slate-500 text-xs mt-0.5">
                                    Receive important Connectly360 alerts even when this tab isn't active.
                                </CardDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            {browserPermission === "granted" ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 size={13} className="text-emerald-600" />
                                    Enabled
                                </span>
                            ) : browserPermission === "denied" ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <AlertCircle size={13} className="text-amber-600" />
                                    Blocked in Browser
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    Not Configured
                                </span>
                            )}

                            {browserPermission !== "granted" && isSupported && (
                                <Button
                                    type="button"
                                    onClick={handleEnableBrowser}
                                    disabled={requestingBrowser}
                                    variant="outline"
                                    className="border-[#BFE4DD] text-[#2F8F83] hover:bg-[#E8F6F3] text-xs h-8 px-3 rounded-xl font-semibold cursor-pointer"
                                >
                                    {requestingBrowser ? (
                                        <>
                                            <Loader2 size={12} className="animate-spin mr-1.5" />
                                            Requesting...
                                        </>
                                    ) : (
                                        "Enable Browser Notifications"
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                {browserPermission === "denied" && (
                    <CardContent className="p-4 bg-amber-50/50 border-t border-amber-100 text-xs text-amber-800 flex items-center gap-2">
                        <AlertCircle size={15} className="text-amber-600 shrink-0" />
                        <span>
                            Browser notifications are currently blocked by your browser settings. To enable them, click the padlock/settings icon in your browser address bar and set Notifications to "Allow".
                        </span>
                    </CardContent>
                )}
            </Card>

            {/* Notification Category Groups */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="animate-spin text-[#2F8F83]" size={36} />
                    <p className="text-sm font-medium text-slate-500">Loading notification preferences...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {categoryGroups.map((group) => (
                        <Card
                            key={group.id}
                            className="border border-[#E5E9EE] bg-white shadow-2xs rounded-2xl overflow-hidden"
                        >
                            <CardHeader className="border-b border-[#E5E9EE] pb-4">
                                <CardTitle className="text-base font-bold text-slate-800">
                                    {group.name}
                                </CardTitle>
                                <CardDescription className="text-slate-500 text-sm mt-0.5">
                                    {group.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 divide-y divide-[#E5E9EE]">
                                {group.items.map((item) => {
                                    const isMasterActive =
                                        item.in_app || item.toast || item.browser;

                                    return (
                                        <div
                                            key={item.key}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50/50 transition-colors gap-3"
                                        >
                                            <div className="space-y-1 max-w-xl">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-bold text-slate-800">
                                                        {item.title}
                                                    </p>
                                                    {item.locked && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                             <Lock size={10} />
                                                            Required Security Policy
                                                        </span>
                                                    )}
                                                    {item.priority === "critical" && (
                                                        <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                                                            Critical
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed">
                                                    {item.description}
                                                </p>

                                                {/* Channel customization pills */}
                                                {!item.locked && (
                                                    <div className="flex items-center gap-1.5 pt-1">
                                                        <span className="text-[10px] font-semibold text-slate-400 mr-1">
                                                            Channels:
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleChannel(item.key, "in_app")}
                                                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer border ${
                                                                item.in_app
                                                                    ? "bg-[#E8F6F3] text-[#2F8F83] border-[#BFE4DD]"
                                                                    : "bg-slate-50 text-slate-400 border-slate-200"
                                                            }`}
                                                            title="Toggle In-App center notification"
                                                        >
                                                            In-App
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleChannel(item.key, "toast")}
                                                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer border ${
                                                                item.toast
                                                                    ? "bg-[#E8F6F3] text-[#2F8F83] border-[#BFE4DD]"
                                                                    : "bg-slate-50 text-slate-400 border-slate-200"
                                                            }`}
                                                            title="Toggle popup toast"
                                                        >
                                                            Toast
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleChannel(item.key, "browser")}
                                                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer border ${
                                                                item.browser
                                                                    ? "bg-[#E8F6F3] text-[#2F8F83] border-[#BFE4DD]"
                                                                    : "bg-slate-50 text-slate-400 border-slate-200"
                                                            }`}
                                                            title="Toggle Browser desktop notification"
                                                        >
                                                            Browser
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleChannel(item.key, "email")}
                                                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer border ${
                                                                item.email
                                                                    ? "bg-[#E8F6F3] text-[#2F8F83] border-[#BFE4DD]"
                                                                    : "bg-slate-50 text-slate-400 border-slate-200"
                                                            }`}
                                                            title="Toggle Email notification"
                                                        >
                                                            Email
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Master toggle switch */}
                                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                                <button
                                                    type="button"
                                                    disabled={item.locked}
                                                    onClick={() => toggleMaster(item.key)}
                                                    className={`h-6 w-11 rounded-full ${
                                                        isMasterActive || item.locked
                                                            ? "bg-[#2F8F83]"
                                                            : "bg-slate-200"
                                                    } relative transition-colors ${
                                                        item.locked ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
                                                    }`}
                                                    aria-label={`Toggle ${item.title}`}
                                                >
                                                    <div
                                                        className={`h-5 w-5 rounded-full bg-white absolute top-0.5 shadow-xs transition-all ${
                                                            isMasterActive || item.locked
                                                                ? "right-0.5"
                                                                : "left-0.5"
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    ))}

                    {/* Bottom Save Bar */}
                    <div className="flex items-center justify-between pt-2">
                        {isDirty ? (
                            <span className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
                                <AlertCircle size={14} />
                                You have unsaved changes.
                            </span>
                        ) : (
                            <span className="text-xs font-medium text-slate-400">
                                All preferences are up to date.
                            </span>
                        )}

                        <Button
                            onClick={handleSave}
                            disabled={updateMutation.isPending || !isDirty}
                            className="bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs h-9 px-5 rounded-xl border-0 font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                        >
                            {updateMutation.isPending ? (
                                <>
                                    <Loader2 className="animate-spin mr-1.5" size={14} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={14} className="mr-1.5" />
                                    Save Preferences
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
