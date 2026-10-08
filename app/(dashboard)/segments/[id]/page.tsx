"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Users,
    Send,
    Edit3,
    Copy,
    Trash2,
    ArrowLeft,
    Calendar,
    Clock,
    ShieldCheck,
    Download,
    CheckCircle2,
    Filter,
    Megaphone,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    UserCheck,
    Phone,
    Mail,
    MapPin,
    Tag as TagIcon,
    Layers,
    Sparkles
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { SegmentBuilderDialog, SegmentData } from "@/components/segments/segment-builder-dialog";

interface SegmentDetail {
    id: string;
    name: string;
    description: string;
    type: "dynamic" | "static";
    targetCount: number;
    rules_json: any;
    conditions: {
        field: string;
        operator: string;
        value: string;
        field_label: string;
        operator_label: string;
        value_label: string;
        readable: string;
    }[];
    summaryText: string;
    isSystem: boolean;
    lastCalculated: string;
    created_at: string | null;
    sampleContacts?: any[];
    campaignUsages?: {
        id: number;
        name: string;
        status: string;
        total_recipients: number;
        sent_count: number;
        used_at: string;
    }[];
}

export default function SegmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const segmentId = params.id as string;
    const { token } = useAuth();

    const [segment, setSegment] = useState<SegmentDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    // Paginated contacts state
    const [contacts, setContacts] = useState<any[]>([]);
    const [contactsLoading, setContactsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalContactsCount, setTotalContactsCount] = useState(0);

    // Edit modal
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isCloning, setIsCloning] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchSegment = useCallback(async () => {
        if (!segmentId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/segments/${segmentId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (data.status && data.data) {
                setSegment(data.data);
            } else {
                toast.error(data.message || "Audience not found");
            }
        } catch (e) {
            toast.error("Failed to load audience details");
        } finally {
            setIsLoading(false);
        }
    }, [segmentId, token]);

    const fetchContacts = useCallback(async (targetPage = 1) => {
        if (!segmentId) return;
        setContactsLoading(true);
        try {
            const res = await fetch(`/api/segments/${segmentId}/contacts?page=${targetPage}&per_page=15`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (data.status && data.data) {
                setContacts(data.data);
                if (data.pagination) {
                    setPage(data.pagination.current_page);
                    setTotalPages(data.pagination.last_page);
                    setTotalContactsCount(data.pagination.total);
                }
            }
        } catch (e) {
            console.error("Failed to load contacts for segment", e);
        } finally {
            setContactsLoading(false);
        }
    }, [segmentId, token]);

    useEffect(() => {
        fetchSegment();
    }, [fetchSegment]);

    useEffect(() => {
        if (activeTab === "contacts") {
            fetchContacts(1);
        }
    }, [activeTab, fetchContacts]);

    const handleClone = async () => {
        if (!segment) return;
        setIsCloning(true);
        try {
            const res = await fetch(`/api/segments/${segment.id}/clone`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (data.status && data.data) {
                toast.success(data.message || "Audience cloned successfully");
                router.push(`/segments/${data.data.id}`);
            } else {
                toast.error(data.message || "Failed to clone audience");
            }
        } catch (e) {
            toast.error("Error cloning audience");
        } finally {
            setIsCloning(false);
        }
    };

    const handleDelete = async () => {
        if (!segment) return;
        if (segment.isSystem) {
            toast.error("System audiences cannot be deleted");
            return;
        }
        if (!confirm(`Are you sure you want to delete audience "${segment.name}"?`)) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/segments/${segment.id}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (data.status) {
                toast.success(data.message || "Audience deleted");
                router.push("/segments");
            } else {
                toast.error(data.message || "Failed to delete audience");
            }
        } catch (e) {
            toast.error("Error deleting audience");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExport = () => {
        if (!segment) return;
        window.open(`/api/customers/export?scope=segment&segment_id=${segment.id}`, "_blank");
    };

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto p-6">
                <div className="h-10 w-48 bg-slate-200 animate-pulse rounded-lg" />
                <div className="h-32 bg-slate-200 animate-pulse rounded-2xl" />
                <div className="h-80 bg-slate-200 animate-pulse rounded-2xl" />
            </div>
        );
    }

    if (!segment) {
        return (
            <div className="p-12 text-center max-w-md mx-auto space-y-4">
                <AlertCircle className="h-12 w-12 text-slate-400 mx-auto" />
                <h2 className="text-lg font-bold text-slate-800">Audience Not Found</h2>
                <p className="text-xs text-slate-500">The segment you requested does not exist or has been removed.</p>
                <Link href="/segments">
                    <Button variant="outline" size="sm">Back to Segments</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <PageHeader
                icon={Users}
                title={segment.name}
                description={segment.description || segment.summaryText || "Reusable audience for campaigns and targeting."}
                breadcrumbs={[
                    { label: "Inbox & CRM" },
                    { label: "Segments", href: "/segments" },
                    { label: segment.name }
                ]}
                actions={
                    <div className="flex items-center gap-2">
                        <Link href="/segments">
                            <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-xs font-semibold">
                                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                                Audiences
                            </Button>
                        </Link>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClone}
                            disabled={isCloning}
                            className="rounded-xl border-slate-200 text-xs font-semibold cursor-pointer"
                        >
                            {isCloning ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                            Clone
                        </Button>

                        {!segment.isSystem && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditOpen(true)}
                                className="rounded-xl border-slate-200 text-xs font-semibold cursor-pointer"
                            >
                                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                                Edit
                            </Button>
                        )}

                        <Link href={`/marketing/campaigns/new?segment_id=${segment.id}`}>
                            <Button
                                size="sm"
                                className="rounded-xl bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs shadow-xs cursor-pointer"
                            >
                                <Send className="h-3.5 w-3.5 mr-1.5" />
                                Use in Campaign
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Audience Size</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black text-slate-900">{segment.targetCount.toLocaleString()}</span>
                        <span className="text-xs text-slate-400 font-medium">contacts</span>
                    </div>
                </Card>

                <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Audience Type</span>
                    <div className="flex items-center gap-2 mt-1.5">
                        <Badge
                            variant="outline"
                            className={`text-xs font-bold rounded-lg px-2.5 py-0.5 ${
                                segment.type === "dynamic"
                                    ? "bg-teal-50 text-[#35877D] border-teal-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                        >
                            {segment.type === "dynamic" ? "Dynamic" : "Static Snapshot"}
                        </Badge>
                        {segment.isSystem && (
                            <Badge variant="outline" className="text-xs font-bold rounded-lg px-2 py-0.5 bg-amber-50 text-amber-700 border-amber-200">
                                SYSTEM
                            </Badge>
                        )}
                    </div>
                </Card>

                <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Campaign Usage</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black text-slate-900">{segment.campaignUsages?.length ?? 0}</span>
                        <span className="text-xs text-slate-400 font-medium">campaigns</span>
                    </div>
                </Card>

                <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Last Evaluated</span>
                    <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{segment.lastCalculated}</span>
                    </div>
                </Card>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-slate-100/80 p-1 rounded-xl">
                    <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold">Overview</TabsTrigger>
                    <TabsTrigger value="contacts" className="rounded-lg text-xs font-semibold">
                        Contacts ({segment.targetCount.toLocaleString()})
                    </TabsTrigger>
                    <TabsTrigger value="conditions" className="rounded-lg text-xs font-semibold">Audience Rules</TabsTrigger>
                    <TabsTrigger value="activity" className="rounded-lg text-xs font-semibold">Campaign Activity</TabsTrigger>
                </TabsList>

                {/* Tab: Overview */}
                <TabsContent value="overview" className="space-y-4">
                    <Card className="rounded-2xl border-slate-200 bg-white shadow-xs">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="text-sm font-bold text-slate-900">Audience Definition</CardTitle>
                            <CardDescription className="text-xs text-slate-500">
                                {segment.type === "dynamic"
                                    ? "This audience continuously includes any contact who matches the rules below."
                                    : "This audience is a fixed snapshot frozen at creation time."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Natural Language Summary</h4>
                                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                                    "{segment.summaryText}"
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Rules</h4>
                                <div className="space-y-2">
                                    {segment.conditions && segment.conditions.length > 0 ? (
                                        segment.conditions.map((c, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 text-xs"
                                            >
                                                <span className="font-bold text-[#35877D]">{c.field_label || c.field}</span>
                                                <span className="text-slate-400">{c.operator_label || c.operator}</span>
                                                <span className="font-semibold text-slate-800 px-2 py-0.5 rounded bg-slate-100">
                                                    {c.value_label || c.value}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-400">All workspace contacts are included.</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Contacts */}
                <TabsContent value="contacts" className="space-y-4">
                    <Card className="rounded-2xl border-slate-200 bg-white shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 py-3.5">
                            <div>
                                <CardTitle className="text-sm font-bold text-slate-900">Matching Contacts</CardTitle>
                                <CardDescription className="text-xs text-slate-500">
                                    Browse contacts that satisfy this audience filter.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExport}
                                    className="rounded-xl border-slate-200 text-xs font-semibold cursor-pointer"
                                >
                                    <Download className="h-3.5 w-3.5 mr-1.5" />
                                    Export CSV
                                </Button>
                                <Link href={`/marketing/campaigns/new?segment_id=${segment.id}`}>
                                    <Button
                                        size="sm"
                                        className="rounded-xl bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs shadow-xs cursor-pointer"
                                    >
                                        <Send className="h-3.5 w-3.5 mr-1.5" />
                                        Broadcast to Audience
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {contactsLoading ? (
                                <div className="p-8 space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="h-10 w-full rounded-lg" />
                                    ))}
                                </div>
                            ) : contacts.length === 0 ? (
                                <div className="py-16 text-center text-slate-400 text-xs font-semibold">
                                    No contacts match this audience criteria currently.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-slate-50/70">
                                        <TableRow className="border-b border-slate-100">
                                            <TableHead className="text-xs font-bold text-slate-600">Contact</TableHead>
                                            <TableHead className="text-xs font-bold text-slate-600">Phone</TableHead>
                                            <TableHead className="text-xs font-bold text-slate-600">Location</TableHead>
                                            <TableHead className="text-xs font-bold text-slate-600">Lead Stage</TableHead>
                                            <TableHead className="text-xs font-bold text-slate-600">WhatsApp Opt-in</TableHead>
                                            <TableHead className="text-xs font-bold text-slate-600">Created</TableHead>
                                            <TableHead className="text-xs font-bold text-slate-600 text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {contacts.map((c) => (
                                            <TableRow key={c.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                                                <TableCell>
                                                    <div className="font-bold text-xs text-slate-900">{c.name || "WhatsApp User"}</div>
                                                    {c.email && <div className="text-[11px] text-slate-400">{c.email}</div>}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-slate-700">
                                                    +{c.phone}
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-600">
                                                    {c.city || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                                                        {c.stage || "new_lead"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {c.whatsapp_opt_in ? (
                                                        <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                                                            Opted-in
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] font-medium bg-slate-100 text-slate-500 border-slate-200">
                                                            No Opt-in
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-500">
                                                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/contacts/${c.id}`} className="text-xs font-semibold text-[#35877D] hover:underline">
                                                        View Details
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                    <span>Page {page} of {totalPages}</span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page <= 1}
                                            onClick={() => fetchContacts(page - 1)}
                                            className="h-8 rounded-lg"
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page >= totalPages}
                                            onClick={() => fetchContacts(page + 1)}
                                            className="h-8 rounded-lg"
                                        >
                                            Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Conditions */}
                <TabsContent value="conditions" className="space-y-4">
                    <Card className="rounded-2xl border-slate-200 bg-white shadow-xs">
                        <CardHeader className="border-b border-slate-100 pb-3">
                            <CardTitle className="text-sm font-bold text-slate-900">Configured Filter Rules</CardTitle>
                            <CardDescription className="text-xs text-slate-500">
                                Logical criteria defining who enters or leaves this audience.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                {segment.conditions.map((cond, i) => (
                                    <div
                                        key={i}
                                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                                    >
                                        <div className="space-y-0.5">
                                            <span className="text-xs font-bold text-slate-800">{cond.readable}</span>
                                            <p className="text-[11px] text-slate-400">
                                                Attribute: <span className="font-mono text-slate-600">{cond.field}</span> · Operator: <span className="font-mono text-slate-600">{cond.operator}</span>
                                            </p>
                                        </div>
                                        <CheckCircle2 className="h-4 w-4 text-[#35877D]" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Campaign Activity */}
                <TabsContent value="activity" className="space-y-4">
                    <Card className="rounded-2xl border-slate-200 bg-white shadow-xs">
                        <CardHeader className="border-b border-slate-100 pb-3">
                            <CardTitle className="text-sm font-bold text-slate-900">Campaign History</CardTitle>
                            <CardDescription className="text-xs text-slate-500">
                                Outbound broadcasts that targeted this audience.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            {segment.campaignUsages && segment.campaignUsages.length > 0 ? (
                                <div className="space-y-3">
                                    {segment.campaignUsages.map((usage) => (
                                        <div
                                            key={usage.id}
                                            className="p-3 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Megaphone className="h-4 w-4 text-[#35877D]" />
                                                <div>
                                                    <span className="font-bold text-xs text-slate-900 block">{usage.name}</span>
                                                    <span className="text-[11px] text-slate-400">
                                                        Used on {new Date(usage.used_at).toLocaleDateString()} · {usage.sent_count || usage.total_recipients} messages
                                                    </span>
                                                </div>
                                            </div>
                                            <Link href={`/marketing/campaigns/${usage.id}`}>
                                                <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg">
                                                    View Campaign
                                                </Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                                    This audience has not been used in any campaign yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Segment Edit Dialog */}
            <SegmentBuilderDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                token={token}
                editingSegment={{
                    id: segment.id,
                    name: segment.name,
                    description: segment.description,
                    type: segment.type,
                    rules_json: segment.rules_json,
                    targetCount: segment.targetCount,
                    isSystem: segment.isSystem,
                }}
                onSaveSuccess={() => {
                    setIsEditOpen(false);
                    fetchSegment();
                }}
            />
        </div>
    );
}
