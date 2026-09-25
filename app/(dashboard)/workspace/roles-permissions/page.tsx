"use client";

import { Shield, CheckCircle2, Lock } from "lucide-react";
import { UpgradeGuard } from "@/components/upgrade-guard";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const ROLES = [
    {
        name: "Owner",
        desc: "Full access to workspace settings, billing, team management, and workspace deletion.",
        permissions: ["Manage billing & subscriptions", "Invite & remove team members", "Configure AI agents & workflows", "Delete workspace"],
        badgeClass: "bg-purple-50 text-purple-700 border border-purple-200",
    },
    {
        name: "Admin",
        desc: "Manage team members, integrations, channels, and platform settings.",
        permissions: ["Invite team members", "Manage WABA & API integrations", "View detailed usage & analytics", "Configure message templates"],
        badgeClass: "bg-blue-50 text-blue-700 border border-blue-200",
    },
    {
        name: "Agent",
        desc: "Handle customer conversations, execute campaigns, and manage contacts.",
        permissions: ["View & respond in shared inbox", "Use AI assistant & quick replies", "Manage contacts & leads", "Launch messaging campaigns"],
        badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
];

export default function RolesPermissionsPage() {
    return (
        <UpgradeGuard 
            allowedPlans={["growth", "business", "enterprise"]} 
            featureName="Roles & Permissions" 
            description="Delegate workspace administration, configure security levels, and manage role assignments."
        >
            <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-4">
                <PageHeader
                    icon={Shield}
                    title="Roles & Permissions"
                    description="Configure access levels and role-based permissions across your workspace."
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {ROLES.map((role) => (
                        <Card key={role.name} className="border border-[#EAE6DF] bg-white shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
                            <CardHeader className="border-b border-slate-100 pb-4">
                                <div className="flex items-center justify-between">
                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${role.badgeClass}`}>
                                        {role.name}
                                    </span>
                                </div>
                                <CardDescription className="text-slate-500 text-xs mt-2 leading-relaxed">
                                    {role.desc}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 flex-1 bg-slate-50/30">
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">Allowed Capabilities</p>
                                <ul className="space-y-2.5">
                                    {role.permissions.map((p) => (
                                        <li key={p} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                                            <CheckCircle2 size={15} className="text-[#378179] shrink-0 mt-0.5" />
                                            <span>{p}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </UpgradeGuard>
    );
}
