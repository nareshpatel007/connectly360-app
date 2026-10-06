"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
    Zap,
    MessageSquare,
    Plus,
    Search,
    Copy,
    Trash2,
    Edit3,
    Play,
    CheckCircle2,
    XCircle,
    Clock,
    Filter,
    ArrowUpDown,
    Check,
    MoreVertical,
    Send,
    AlertCircle,
    Info,
    Sparkles,
    Hash,
    HelpCircle
} from "lucide-react";

export interface AutoReplyRule {
    id: number;
    tenant_id: number;
    whatsapp_account_id?: number | null;
    name: string;
    keyword: string;
    keywords_array?: string[];
    reply: string;
    match_type?: "CONTAINS" | "EXACT" | "STARTS_WITH" | "ENDS_WITH";
    priority?: number;
    status: number | boolean;
    executed_count?: number;
    last_triggered_at?: string | null;
    created_at: string;
    updated_at: string;
}

export default function AutoReplyRulesPage() {
    const queryClient = useQueryClient();

    // Filters and search state
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [matchTypeFilter, setMatchTypeFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<"priority" | "recently_updated" | "recently_created" | "name">("priority");

    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
    const [deletingRule, setDeletingRule] = useState<AutoReplyRule | null>(null);

    // Form fields
    const [formName, setFormName] = useState("");
    const [formKeywords, setFormKeywords] = useState("");
    const [formMatchType, setFormMatchType] = useState<"CONTAINS" | "EXACT" | "STARTS_WITH" | "ENDS_WITH">("CONTAINS");
    const [formPriority, setFormPriority] = useState<number>(1);
    const [formReply, setFormReply] = useState("");
    const [formStatus, setFormStatus] = useState(true);

    // Test Rule Modal state
    const [testModalOpen, setTestModalOpen] = useState(false);
    const [testRuleTarget, setTestRuleTarget] = useState<AutoReplyRule | null>(null);
    const [testInputMessage, setTestInputMessage] = useState("Hi, what is your pricing and cost?");
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{
        matched: boolean;
        matched_keyword?: string | null;
        match_type?: string;
        reply?: string | null;
    } | null>(null);

    // Query for rules
    const { data: rawRules = [], isLoading, isError, refetch } = useQuery<AutoReplyRule[]>({
        queryKey: ["automations", "auto-replies", searchQuery, statusFilter, sortBy],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchQuery.trim()) params.append("search", searchQuery.trim());
            if (statusFilter !== "all") params.append("status", statusFilter);
            params.append("sort", sortBy);

            const res = await fetch(`/api/automations?${params.toString()}`);
            if (!res.ok) {
                throw new Error("Failed to load auto-reply rules");
            }
            return res.json();
        },
    });

    // Create Rule Mutation
    const createMutation = useMutation({
        mutationFn: async (payload: Partial<AutoReplyRule>) => {
            const res = await fetch("/api/automations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create rule");
            return data;
        },
        onSuccess: () => {
            toast.success("Auto-reply rule created successfully");
            queryClient.invalidateQueries({ queryKey: ["automations"] });
            setIsCreateOpen(false);
            resetForm();
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to create rule");
        },
    });

    // Update Rule Mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<AutoReplyRule> }) => {
            const res = await fetch(`/api/automations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to update rule");
            return json;
        },
        onSuccess: () => {
            toast.success("Auto-reply rule updated successfully");
            queryClient.invalidateQueries({ queryKey: ["automations"] });
            setEditingRule(null);
            resetForm();
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to update rule");
        },
    });

    // Delete Rule Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/automations/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to delete rule");
            return data;
        },
        onSuccess: () => {
            toast.success("Auto-reply rule removed");
            queryClient.invalidateQueries({ queryKey: ["automations"] });
            setDeletingRule(null);
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to delete rule");
        },
    });

    // Duplicate Rule Mutation
    const duplicateMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/automations/${id}/duplicate`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to duplicate rule");
            return data;
        },
        onSuccess: () => {
            toast.success("Rule duplicated as inactive copy");
            queryClient.invalidateQueries({ queryKey: ["automations"] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to duplicate rule");
        },
    });

    // Helper to open create modal
    const handleOpenCreate = () => {
        resetForm();
        setIsCreateOpen(true);
    };

    // Helper to open edit modal
    const handleOpenEdit = (rule: AutoReplyRule) => {
        setEditingRule(rule);
        setFormName(rule.name || "");
        setFormKeywords(rule.keyword || "");
        setFormMatchType(rule.match_type || "CONTAINS");
        setFormPriority(rule.priority || 1);
        setFormReply(rule.reply || "");
        setFormStatus(rule.status === 1 || rule.status === true);
    };

    const resetForm = () => {
        setFormName("");
        setFormKeywords("");
        setFormMatchType("CONTAINS");
        setFormPriority(1);
        setFormReply("");
        setFormStatus(true);
    };

    // Form submit handler
    const handleSubmitForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formKeywords.trim() || !formReply.trim()) {
            toast.error("Please provide trigger keyword(s) and a reply message.");
            return;
        }

        const payload = {
            name: formName.trim() || "WhatsApp Auto-Reply",
            keyword: formKeywords.trim(),
            reply: formReply.trim(),
            match_type: formMatchType,
            priority: Number(formPriority) || 1,
            status: formStatus ? 1 : 0,
            trigger_type: "New WhatsApp message is received",
            action_type: "Send message",
        };

        if (editingRule) {
            updateMutation.mutate({ id: editingRule.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    // Toggle rule status directly from row switch
    const handleToggleStatus = (rule: AutoReplyRule) => {
        const nextStatus = (rule.status === 1 || rule.status === true) ? 0 : 1;
        updateMutation.mutate(
            { id: rule.id, data: { status: nextStatus } },
            {
                onSuccess: () => {
                    toast.success(`Rule "${rule.name}" turned ${nextStatus ? "ON" : "OFF"}`);
                }
            }
        );
    };

    // Open Test Modal
    const handleOpenTest = (rule?: AutoReplyRule) => {
        setTestRuleTarget(rule || null);
        setTestResult(null);
        setTestModalOpen(true);
    };

    // Execute rule test evaluation
    const handleExecuteTest = async () => {
        if (!testInputMessage.trim()) {
            toast.error("Please enter a test message.");
            return;
        }

        setIsTesting(true);
        try {
            let res: Response;
            if (testRuleTarget) {
                res = await fetch(`/api/automations/${testRuleTarget.id}/test`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: testInputMessage.trim() }),
                });
            } else {
                res = await fetch("/api/automations/test", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: testInputMessage.trim(),
                        keyword: formKeywords || "price, info",
                        match_type: formMatchType,
                        reply: formReply || "Test automated response.",
                    }),
                });
            }

            const data = await res.json();
            setTestResult(data);
        } catch (err: any) {
            toast.error(err.message || "Failed to evaluate test message.");
        } finally {
            setIsTesting(false);
        }
    };

    // Client-side filtering for match type
    const filteredRules = useMemo(() => {
        return rawRules.filter((r) => {
            if (matchTypeFilter !== "all") {
                const mt = r.match_type || "CONTAINS";
                if (mt !== matchTypeFilter) return false;
            }
            return true;
        });
    }, [rawRules, matchTypeFilter]);

    // Summary statistics
    const totalRules = rawRules.length;
    const activeRulesCount = rawRules.filter((r) => r.status === 1 || r.status === true).length;
    const totalExecutedCount = rawRules.reduce((acc, curr) => acc + (curr.executed_count || 0), 0);

    return (
        <div className="space-y-6 w-full">
            {/* Page Header */}
            <PageHeader
                icon={MessageSquare}
                title="WhatsApp Auto-Reply Rules"
                description="Automatically respond to incoming WhatsApp messages based on keywords and conversation triggers."
                breadcrumbs={[
                    { label: "Home", href: "/dashboard" },
                    { label: "Automations", href: "/automations" },
                    { label: "Auto-Reply Rules" }
                ]}
                actions={
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenTest()}
                            className="border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl h-9 px-3.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
                        >
                            <Play size={13} className="text-[#35877D]" />
                            <span>Test Simulator</span>
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleOpenCreate}
                            className="bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl h-9 px-4 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs border-0"
                        >
                            <Plus size={14} />
                            <span>New Auto-Reply Rule</span>
                        </Button>
                    </div>
                }
            />

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border border-[#EAE6DF] rounded-2xl shadow-xs">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Rules</p>
                            <h3 className="text-xl font-bold text-[#0B2E1E] mt-0.5">{totalRules}</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">Configured keyword triggers</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-teal-50 text-[#35877D] flex items-center justify-center">
                            <MessageSquare size={18} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[#EAE6DF] rounded-2xl shadow-xs">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Rules</p>
                            <h3 className="text-xl font-bold text-emerald-700 mt-0.5">{activeRulesCount}</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">Evaluating incoming chats</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 size={18} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[#EAE6DF] rounded-2xl shadow-xs">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Dispatched</p>
                            <h3 className="text-xl font-bold text-[#0B2E1E] mt-0.5">{totalExecutedCount.toLocaleString()}</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">Replies sent via webhook</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Zap size={18} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[#EAE6DF] rounded-2xl shadow-xs">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Conflict Handling</p>
                            <h3 className="text-sm font-bold text-[#0B2E1E] mt-0.5 flex items-center gap-1.5">
                                <Sparkles size={14} className="text-[#35877D]" />
                                Deterministic
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">Priority &amp; specificity order</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Hash size={18} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Search Bar */}
            <Card className="bg-white border border-[#EAE6DF] rounded-2xl shadow-xs">
                <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="flex flex-1 items-center gap-3 w-full">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Search by rule name, keyword, or reply..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-xs rounded-xl border-[#EAE6DF] focus:border-[#35877D]"
                            />
                        </div>

                        {/* Status Filter Pills */}
                        <div className="hidden sm:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 text-xs">
                            <button
                                onClick={() => setStatusFilter("all")}
                                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                                    statusFilter === "all" ? "bg-white text-[#35877D] font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setStatusFilter("active")}
                                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                                    statusFilter === "active" ? "bg-white text-emerald-700 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setStatusFilter("inactive")}
                                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                                    statusFilter === "inactive" ? "bg-white text-slate-700 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Inactive
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                        {/* Match Type Dropdown */}
                        <Select value={matchTypeFilter} onValueChange={setMatchTypeFilter}>
                            <SelectTrigger className="h-9 text-xs rounded-xl border-[#EAE6DF] w-36">
                                <SelectValue placeholder="Match Type" />
                            </SelectTrigger>
                            <SelectContent className="text-xs rounded-xl">
                                <SelectItem value="all">All Match Types</SelectItem>
                                <SelectItem value="CONTAINS">Contains</SelectItem>
                                <SelectItem value="EXACT">Exact Match</SelectItem>
                                <SelectItem value="STARTS_WITH">Starts With</SelectItem>
                                <SelectItem value="ENDS_WITH">Ends With</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort Dropdown */}
                        <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                            <SelectTrigger className="h-9 text-xs rounded-xl border-[#EAE6DF] w-40">
                                <SelectValue placeholder="Sort By" />
                            </SelectTrigger>
                            <SelectContent className="text-xs rounded-xl">
                                <SelectItem value="priority">Sort: Priority (1st)</SelectItem>
                                <SelectItem value="recently_updated">Recently Updated</SelectItem>
                                <SelectItem value="recently_created">Recently Created</SelectItem>
                                <SelectItem value="name">Name (A-Z)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Rules Listing */}
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-28 w-full rounded-2xl" />
                    <Skeleton className="h-28 w-full rounded-2xl" />
                    <Skeleton className="h-28 w-full rounded-2xl" />
                </div>
            ) : isError ? (
                <Card className="rounded-2xl border-red-200 bg-red-50/50 p-8 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                        <AlertCircle className="mx-auto text-red-600" size={32} />
                        <h3 className="text-sm font-bold text-red-900">Unable to load auto-reply rules</h3>
                        <p className="text-xs text-red-700">A network or server error occurred while retrieving your automation rules.</p>
                        <Button size="sm" onClick={() => refetch()} className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs h-8">
                            Retry
                        </Button>
                    </div>
                </Card>
            ) : filteredRules.length === 0 ? (
                <Card className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
                    <div className="max-w-md mx-auto flex flex-col items-center">
                        <div className="h-16 w-16 rounded-2xl bg-teal-50 text-[#35877D] flex items-center justify-center mb-4 shadow-2xs">
                            <MessageSquare size={30} />
                        </div>
                        <h3 className="text-sm font-bold text-[#0B2E1E]">No auto-reply rules configured</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                            Create keyword-based WhatsApp responses to handle common customer questions automatically (e.g. pricing, working hours, catalog, or support greetings).
                        </p>
                        <Button
                            onClick={handleOpenCreate}
                            className="bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl text-xs h-9 font-semibold gap-1.5 mt-5 shadow-xs border-0 cursor-pointer"
                        >
                            <Plus size={14} />
                            <span>Create Auto-Reply Rule</span>
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-3.5">
                    {filteredRules.map((rule) => {
                        const isActive = rule.status === 1 || rule.status === true;
                        const keywords = rule.keywords_array || (rule.keyword ? rule.keyword.split(",").map(k => k.trim()) : []);
                        const matchType = rule.match_type || "CONTAINS";

                        return (
                            <Card
                                key={rule.id}
                                className={`rounded-2xl border transition-all duration-200 bg-white overflow-hidden shadow-xs hover:shadow-md ${
                                    isActive
                                        ? "border-[#35877D]/30 hover:border-[#35877D]/60"
                                        : "border-slate-200/90 bg-slate-50/40 opacity-75"
                                }`}
                            >
                                <CardContent className="p-5">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        {/* Left Details */}
                                        <div className="space-y-2.5 flex-1 min-w-0">
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <h3 className="text-sm font-bold text-[#0B2E1E] truncate">
                                                    {rule.name || "Auto-Reply Rule"}
                                                </h3>

                                                {/* Status Badge */}
                                                <Badge
                                                    className={`text-[10px] font-bold rounded-lg px-2 py-0.5 border ${
                                                        isActive
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                            : "bg-slate-100 text-slate-600 border-slate-200"
                                                    }`}
                                                >
                                                    {isActive ? "ACTIVE" : "INACTIVE"}
                                                </Badge>

                                                {/* Priority Badge */}
                                                <Badge className="bg-[#FAF8F5] text-slate-700 border border-[#EAE6DF] text-[10px] font-semibold rounded-lg px-2 py-0.5">
                                                    Priority #{rule.priority || 1}
                                                </Badge>

                                                {/* Match Type Badge */}
                                                <Badge className="bg-teal-50/80 text-[#35877D] border border-teal-200/60 text-[10px] font-semibold rounded-lg px-2 py-0.5 uppercase tracking-wider">
                                                    {matchType.replace("_", " ")}
                                                </Badge>
                                            </div>

                                            {/* Keywords Display */}
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                                                    <Hash size={12} className="text-slate-400" />
                                                    Keywords:
                                                </span>
                                                {keywords.map((kw, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-0.5 text-xs font-medium rounded-md bg-[#FAF8F5] text-[#0B2E1E] border border-[#EAE6DF]"
                                                    >
                                                        "{kw}"
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Reply Bubble Preview */}
                                            <div className="bg-slate-50/90 border border-slate-200/70 rounded-xl p-3 text-xs text-slate-700 font-medium leading-relaxed max-w-2xl relative">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                    <Send size={10} className="text-[#35877D]" />
                                                    Automated Reply
                                                </div>
                                                <p className="whitespace-pre-wrap">{rule.reply}</p>
                                            </div>
                                        </div>

                                        {/* Right Actions & Switch */}
                                        <div className="flex items-center md:flex-col items-end justify-between md:justify-start gap-3 shrink-0 pt-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[11px] font-semibold text-slate-500">
                                                    {isActive ? "Active" : "Disabled"}
                                                </span>
                                                <Switch
                                                    checked={isActive}
                                                    onCheckedChange={() => handleToggleStatus(rule)}
                                                    className="cursor-pointer data-[state=checked]:bg-[#35877D]"
                                                />
                                            </div>

                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenTest(rule)}
                                                    className="h-8 px-2.5 text-xs font-semibold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer gap-1"
                                                    title="Test this rule with a sample incoming message"
                                                >
                                                    <Play size={11} className="text-[#35877D]" />
                                                    <span>Test</span>
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenEdit(rule)}
                                                    className="h-8 px-2.5 text-xs font-semibold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer gap-1"
                                                >
                                                    <Edit3 size={11} />
                                                    <span>Edit</span>
                                                </Button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                                                        >
                                                            <MoreVertical size={14} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="text-xs rounded-xl">
                                                        <DropdownMenuItem
                                                            onClick={() => duplicateMutation.mutate(rule.id)}
                                                            className="cursor-pointer gap-2 font-medium"
                                                        >
                                                            <Copy size={13} className="text-slate-500" />
                                                            <span>Duplicate Rule</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setDeletingRule(rule)}
                                                            className="cursor-pointer gap-2 font-medium text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        >
                                                            <Trash2 size={13} />
                                                            <span>Delete Rule</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Metrics Bar */}
                                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-medium">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                                                <Zap size={12} className="text-[#35877D]" />
                                                Executed {rule.executed_count || 0} times
                                            </span>
                                            {rule.last_triggered_at && (
                                                <span className="flex items-center gap-1 text-slate-500">
                                                    <Clock size={11} />
                                                    Last triggered {new Date(rule.last_triggered_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-slate-400 text-[11px]">
                                            Created {new Date(rule.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* CREATE / EDIT RULE DIALOG */}
            <Dialog open={isCreateOpen || !!editingRule} onOpenChange={(open) => {
                if (!open) {
                    setIsCreateOpen(false);
                    setEditingRule(null);
                    resetForm();
                }
            }}>
                <DialogContent className="sm:max-w-[560px] rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-[#0B2E1E] flex items-center gap-2">
                            <MessageSquare size={18} className="text-[#35877D]" />
                            {editingRule ? "Edit Auto-Reply Rule" : "Create New Auto-Reply Rule"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Configure keyword triggers and automated responses for incoming WhatsApp messages.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitForm} className="space-y-4 pt-2">
                        {/* Rule Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="ruleName" className="text-xs font-semibold text-slate-700">
                                Rule Name (Optional)
                            </Label>
                            <Input
                                id="ruleName"
                                placeholder="e.g., Pricing Inquiry, Welcome Greeting"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                className="h-9 text-xs rounded-xl border-[#EAE6DF] focus:border-[#35877D]"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Match Type */}
                            <div className="space-y-1.5">
                                <Label htmlFor="matchType" className="text-xs font-semibold text-slate-700">
                                    Match Type
                                </Label>
                                <Select
                                    value={formMatchType}
                                    onValueChange={(val: any) => setFormMatchType(val)}
                                >
                                    <SelectTrigger id="matchType" className="h-9 text-xs rounded-xl border-[#EAE6DF]">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent className="text-xs rounded-xl">
                                        <SelectItem value="CONTAINS">Contains (Anywhere in text)</SelectItem>
                                        <SelectItem value="EXACT">Exact Match (Full message)</SelectItem>
                                        <SelectItem value="STARTS_WITH">Starts With</SelectItem>
                                        <SelectItem value="ENDS_WITH">Ends With</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Priority */}
                            <div className="space-y-1.5">
                                <Label htmlFor="priority" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                    <span>Priority</span>
                                    <span className="text-[10px] text-slate-400 font-normal">1 = Highest</span>
                                </Label>
                                <Input
                                    id="priority"
                                    type="number"
                                    min={1}
                                    max={99}
                                    value={formPriority}
                                    onChange={(e) => setFormPriority(Number(e.target.value))}
                                    className="h-9 text-xs rounded-xl border-[#EAE6DF] focus:border-[#35877D]"
                                />
                            </div>
                        </div>

                        {/* Trigger Keywords */}
                        <div className="space-y-1.5">
                            <Label htmlFor="keywords" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                <span>Trigger Keywords</span>
                                <span className="text-[10px] text-slate-400 font-normal">Case-insensitive</span>
                            </Label>
                            <Input
                                id="keywords"
                                placeholder="e.g. price, pricing, cost, catalog"
                                value={formKeywords}
                                onChange={(e) => setFormKeywords(e.target.value)}
                                required
                                className="h-9 text-xs rounded-xl border-[#EAE6DF] focus:border-[#35877D]"
                            />
                            <p className="text-[11px] text-slate-400">
                                Separate multiple keywords with commas. Any matching keyword will trigger this rule.
                            </p>
                        </div>

                        {/* Reply Message */}
                        <div className="space-y-1.5">
                            <Label htmlFor="replyMessage" className="text-xs font-semibold text-slate-700">
                                Automated Reply Message
                            </Label>
                            <Textarea
                                id="replyMessage"
                                rows={4}
                                placeholder="Write your automated WhatsApp response text here..."
                                value={formReply}
                                onChange={(e) => setFormReply(e.target.value)}
                                required
                                className="text-xs rounded-xl border-[#EAE6DF] focus:border-[#35877D] resize-none"
                            />
                        </div>

                        {/* Status Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
                            <div>
                                <p className="text-xs font-bold text-slate-800">Rule Active Status</p>
                                <p className="text-[11px] text-slate-500">Enable this rule immediately upon saving</p>
                            </div>
                            <Switch
                                checked={formStatus}
                                onCheckedChange={setFormStatus}
                                className="cursor-pointer data-[state=checked]:bg-[#35877D]"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsCreateOpen(false);
                                    setEditingRule(null);
                                    resetForm();
                                }}
                                className="rounded-xl border-slate-200 text-xs h-9"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl text-xs h-9 font-semibold"
                            >
                                {createMutation.isPending || updateMutation.isPending ? "Saving..." : (editingRule ? "Update Rule" : "Create Rule")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* TEST RULE SIMULATOR DIALOG */}
            <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
                <DialogContent className="sm:max-w-[560px] rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-[#0B2E1E] flex items-center gap-2">
                            <Play size={18} className="text-[#35877D]" />
                            Auto-Reply Simulation Engine
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Safely simulate incoming WhatsApp messages to test rule keywords, priority resolution, and response output.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        {testRuleTarget ? (
                            <div className="p-3 bg-teal-50/70 border border-teal-200/60 rounded-xl text-xs">
                                <span className="font-bold text-[#0B2E1E]">Testing Rule: </span>
                                <span className="text-[#35877D] font-bold">{testRuleTarget.name}</span>
                                <span className="text-slate-500 ml-2">({testRuleTarget.match_type || "CONTAINS"} on "{testRuleTarget.keyword}")</span>
                            </div>
                        ) : (
                            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                                <Info size={14} className="text-[#35877D] shrink-0" />
                                <span>Evaluating against all active auto-reply rules.</span>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="testMessage" className="text-xs font-semibold text-slate-700">
                                Simulated Incoming Message
                            </Label>
                            <Textarea
                                id="testMessage"
                                rows={3}
                                value={testInputMessage}
                                onChange={(e) => setTestInputMessage(e.target.value)}
                                placeholder="Type a sample customer message here..."
                                className="text-xs rounded-xl border-[#EAE6DF] focus:border-[#35877D] resize-none"
                            />
                        </div>

                        <Button
                            onClick={handleExecuteTest}
                            disabled={isTesting || !testInputMessage.trim()}
                            className="w-full bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl text-xs h-9 font-semibold gap-1.5 cursor-pointer"
                        >
                            <Play size={12} />
                            <span>{isTesting ? "Evaluating Match..." : "Evaluate Simulation"}</span>
                        </Button>

                        {/* Test Evaluation Results Display */}
                        {testResult && (
                            <div className={`p-4 rounded-xl border transition-all ${
                                testResult.matched
                                    ? "bg-emerald-50/70 border-emerald-200"
                                    : "bg-amber-50/70 border-amber-200"
                            }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {testResult.matched ? (
                                            <CheckCircle2 size={16} className="text-emerald-600" />
                                        ) : (
                                            <XCircle size={16} className="text-amber-600" />
                                        )}
                                        <span className={`text-xs font-bold uppercase tracking-wider ${
                                            testResult.matched ? "text-emerald-800" : "text-amber-800"
                                        }`}>
                                            {testResult.matched ? "TRIGGER MATCHED" : "NO RULE MATCHED"}
                                        </span>
                                    </div>
                                    {testResult.matched && testResult.matched_keyword && (
                                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold border-0">
                                            Matched: "{testResult.matched_keyword}"
                                        </Badge>
                                    )}
                                </div>

                                {testResult.matched && testResult.reply ? (
                                    <div className="mt-3 pt-3 border-t border-emerald-200/60 text-xs">
                                        <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                                            Automated Response Delivered:
                                        </p>
                                        <div className="p-2.5 bg-white/90 rounded-lg text-slate-800 font-medium whitespace-pre-wrap shadow-2xs border border-emerald-100">
                                            {testResult.reply}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-amber-900 leading-normal mt-1">
                                        No active auto-reply rule matched the incoming message keywords or conditions.
                                    </p>
                                )}
                            </div>
                        )}

                        <p className="text-[11px] text-slate-400 italic text-center">
                            * Simulation mode executes business logic safely without debiting credits or messaging real customers.
                        </p>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setTestModalOpen(false)}
                            className="rounded-xl border-slate-200 text-xs h-9"
                        >
                            Close Simulator
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE RULE CONFIRMATION DIALOG */}
            <Dialog open={!!deletingRule} onOpenChange={(open) => !open && setDeletingRule(null)}>
                <DialogContent className="sm:max-w-[420px] rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-red-600 flex items-center gap-2">
                            <Trash2 size={16} />
                            Delete Auto-Reply Rule?
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-600 pt-1 leading-relaxed">
                            Are you sure you want to delete <span className="font-bold text-slate-800">"{deletingRule?.name}"</span>?
                            This rule will no longer respond to incoming WhatsApp keyword triggers.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setDeletingRule(null)}
                            className="rounded-xl border-slate-200 text-xs h-9"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deletingRule && deleteMutation.mutate(deletingRule.id)}
                            disabled={deleteMutation.isPending}
                            className="rounded-xl text-xs h-9 font-semibold"
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete Rule"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
