"use client";

import { useState } from "react";
import { BellRing, Save, Loader2, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NotificationItem {
    id: string;
    label: string;
    desc: string;
    enabled: boolean;
}

interface NotificationGroup {
    group: string;
    description: string;
    items: NotificationItem[];
}

const INITIAL_GROUPS: NotificationGroup[] = [
    {
        group: "Conversations & Inbox",
        description: "Alerts for incoming messages, assignments, and customer replies.",
        items: [
            { id: "new_msg", label: "New message received", desc: "Get notified when a new incoming message arrives", enabled: true },
            { id: "assigned", label: "Conversation assigned to me", desc: "Alert when a conversation is assigned to your account", enabled: true },
            { id: "reply", label: "Customer replied", desc: "Notify when a customer replies to an active thread", enabled: true },
        ],
    },
    {
        group: "Marketing & Campaigns",
        description: "Notifications for broadcast executions, completions, and delivery errors.",
        items: [
            { id: "camp_start", label: "Campaign launched", desc: "Alert when a broadcast campaign begins sending", enabled: false },
            { id: "camp_done", label: "Campaign completed", desc: "Notify when all campaign messages have been dispatched", enabled: true },
            { id: "camp_fail", label: "Campaign failed", desc: "Alert on campaign dispatch errors or API failures", enabled: true },
        ],
    },
    {
        group: "Billing & Credits",
        description: "Notifications for credit thresholds, invoices, and payment confirmations.",
        items: [
            { id: "low_credit", label: "Low credit balance", desc: "Alert when messaging credits fall below threshold", enabled: true },
            { id: "invoice", label: "Invoice generated", desc: "Notify when a monthly billing invoice is ready for download", enabled: false },
            { id: "payment", label: "Payment successful", desc: "Confirm successful credit recharge and subscription payments", enabled: true },
        ],
    },
];

export default function NotificationSettingsPage() {
    const [groups, setGroups] = useState<NotificationGroup[]>(INITIAL_GROUPS);
    const [isSaving, setIsSaving] = useState(false);

    const toggleNotification = (groupIdx: number, itemIdx: number) => {
        setGroups((prev) => {
            const next = JSON.parse(JSON.stringify(prev));
            next[groupIdx].items[itemIdx].enabled = !next[groupIdx].items[itemIdx].enabled;
            return next;
        });
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Notification settings saved successfully!");
        }, 1000);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                icon={BellRing}
                title="Notification Settings"
                description="Control what alerts you receive via email, web notifications, and mobile."
            />

            <div className="space-y-6">
                {groups.map((group, gIdx) => (
                    <Card key={group.group} className="border border-[#EAE6DF] bg-white shadow-xs rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="text-base font-bold text-slate-800">{group.group}</CardTitle>
                            <CardDescription className="text-slate-500 text-sm mt-0.5">
                                {group.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 divide-y divide-slate-100">
                            {group.items.map((item, iIdx) => (
                                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">{item.label}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => toggleNotification(gIdx, iIdx)}
                                        className={`h-6 w-11 rounded-full ${item.enabled ? "bg-[#378179]" : "bg-slate-200"} relative cursor-pointer shrink-0 transition-colors`}
                                    >
                                        <div className={`h-5 w-5 rounded-full bg-white absolute top-0.5 shadow-xs transition-all ${item.enabled ? "right-0.5" : "left-0.5"}`} />
                                    </button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}

                <div className="flex justify-end pt-2">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-[#378179] hover:bg-[#2c6f66] text-white text-xs h-9 px-5 rounded-xl border-0 font-semibold cursor-pointer shadow-xs"
                    >
                        {isSaving ? (
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
        </div>
    );
}
