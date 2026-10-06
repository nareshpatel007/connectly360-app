"use client";

import { useState } from "react";
import { useListAutomations, useCreateAutomation, useUpdateAutomation, useDeleteAutomation, AutomationRule } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import {
    Plus,
    Search,
    Trash2,
    Edit2,
    Play,
    Loader2,
    AlertTriangle,
    Zap,
    ToggleLeft,
    Activity,
} from "lucide-react";

export default function AutomationsPage() {
    const queryClient = useQueryClient();
    const { data: rules = [], isLoading } = useListAutomations();
    const createMutation = useCreateAutomation();
    const updateMutation = useUpdateAutomation();
    const deleteMutation = useDeleteAutomation();

    // Search
    const [searchTerm, setSearchTerm] = useState("");

    // Dialog state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
    const [ruleIdToDelete, setRuleIdToDelete] = useState<number | null>(null);

    // Form fields
    const [ruleName, setRuleName] = useState("");
    const [triggerType, setTriggerType] = useState("New WhatsApp message is received");
    const [actionType, setActionType] = useState("Send message");
    const [keyword, setKeyword] = useState("");
    const [reply, setReply] = useState("");
    const [status, setStatus] = useState(true);

    const filteredRules = rules.filter(rule =>
        (rule.name || "WhatsApp Rule").toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.reply.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculated Stats
    const totalRules = rules.length;
    const activeRules = rules.filter(r => !!r.status).length;
    const totalExecuted = rules.reduce((acc, curr) => acc + (curr.executed_count ?? 0), 0);

    const openCreateDialog = () => {
        setRuleName("");
        setTriggerType("New WhatsApp message is received");
        setActionType("Send message");
        setKeyword("");
        setReply("");
        setStatus(true);
        setIsCreateOpen(true);
    };

    const openEditDialog = (rule: AutomationRule) => {
        setSelectedRule(rule);
        setRuleName(rule.name || "WhatsApp Rule");
        setTriggerType(rule.trigger_type || "New WhatsApp message is received");
        setActionType(rule.action_type || "Send message");
        setKeyword(rule.keyword);
        setReply(rule.reply);
        setStatus(!!rule.status);
        setIsEditOpen(true);
    };

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ruleName.trim() || !keyword.trim() || !reply.trim()) {
            toast.error("Please fill in all required fields.");
            return;
        }
        try {
            await createMutation.mutateAsync({
                data: {
                    name: ruleName.trim(),
                    trigger_type: triggerType,
                    action_type: actionType,
                    keyword: keyword.trim(),
                    reply: reply.trim(),
                    status: status ? 1 : 0,
                }
            });
            toast.success("Automation rule created successfully");
            queryClient.invalidateQueries({ queryKey: ["listAutomations"] });
            setIsCreateOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to create automation rule");
        }
    };

    const handleUpdateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRule) return;
        if (!ruleName.trim() || !keyword.trim() || !reply.trim()) {
            toast.error("Please fill in all required fields.");
            return;
        }
        try {
            await updateMutation.mutateAsync({
                id: selectedRule.id,
                data: {
                    name: ruleName.trim(),
                    trigger_type: triggerType,
                    action_type: actionType,
                    keyword: keyword.trim(),
                    reply: reply.trim(),
                    status: status ? 1 : 0,
                }
            });
            toast.success("Automation rule updated successfully");
            queryClient.invalidateQueries({ queryKey: ["listAutomations"] });
            setIsEditOpen(false);
            setSelectedRule(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to update automation rule");
        }
    };

    const handleToggleStatus = async (rule: AutomationRule) => {
        const nextStatus = !rule.status;
        try {
            await updateMutation.mutateAsync({
                id: rule.id,
                data: { status: nextStatus ? 1 : 0 }
            });
            toast.success(`Rule "${rule.name || "WhatsApp Rule"}" turned ${nextStatus ? "ON" : "OFF"}`);
            queryClient.invalidateQueries({ queryKey: ["listAutomations"] });
        } catch (err: any) {
            toast.error(err.message || "Failed to update status");
        }
    };

    const confirmDeleteRule = (id: number) => {
        setRuleIdToDelete(id);
        setIsDeleteOpen(true);
    };

    const handleDeleteRule = async () => {
        if (ruleIdToDelete === null) return;
        try {
            await deleteMutation.mutateAsync({ id: ruleIdToDelete });
            toast.success("Rule deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["listAutomations"] });
            setIsDeleteOpen(false);
            setRuleIdToDelete(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to delete rule");
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                icon={Zap}
                title="Automations"
                description="Create keyword rules that trigger automated WhatsApp replies."
                breadcrumbs={[{ label: "Engagement" }, { label: "Automations" }]}
                actions={
                    <Button
                        onClick={openCreateDialog}
                        className="bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        Create Rule
                    </Button>
                }
            />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRules}</div>
                        <p className="text-xs text-muted-foreground">Configured keyword triggers</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeRules}</div>
                        <p className="text-xs text-muted-foreground">Running live automation rules</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Executed</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalExecuted.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Automated trigger dispatches</p>
                    </CardContent>
                </Card>
            </div>

            {/* Table card */}
            <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-base font-bold text-foreground">Automation Rules</CardTitle>
                        <CardDescription className="text-muted-foreground text-sm mt-0.5">
                            Keyword triggers that send automated replies when a message matches.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-44 sm:w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search rules..."
                                className="pl-9 h-9 text-xs rounded-xl border-border bg-background focus:bg-background"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="pl-6">Rule Name</TableHead>
                                    <TableHead>Trigger Type</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Executed</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(4)].map((_, i) => (
                                        <TableRow key={i} className="border-border">
                                            <TableCell className="pl-6"><Skeleton className="h-5 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                            <TableCell className="text-right pr-6"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredRules.length === 0 ? (
                                    <TableRow className="border-border">
                                        <TableCell colSpan={7} className="h-40 text-center">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center">
                                                    <Zap size={18} />
                                                </div>
                                                <p className="text-xs font-semibold text-foreground">No automation rules yet</p>
                                                <p className="text-xs">Click &ldquo;Create Rule&rdquo; to set up your first keyword trigger.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRules.map((rule) => (
                                        <TableRow key={rule.id} className="hover:bg-muted/50 transition-colors border-border">
                                            <TableCell className="py-3.5 pl-6">
                                                <div className="font-semibold text-foreground text-xs">{rule.name || "WhatsApp Rule"}</div>
                                                <span className="text-[9.5px] bg-[#35877D]/10 text-[#35877D] border border-[#35877D]/20 px-1.5 py-0.5 rounded-md italic mt-1 inline-block">
                                                    Keyword: {rule.keyword}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs py-3.5">
                                                <span className="flex items-center gap-1.5">
                                                    <Play size={11} className="text-[#35877D] fill-[#35877D]/10 shrink-0" />
                                                    {rule.trigger_type || "New WhatsApp message is received"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs py-3.5">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="h-2 w-2 rounded-full bg-[#35877D] shrink-0" />
                                                    {rule.action_type || "Send message"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3.5">
                                                <Switch
                                                    checked={!!rule.status}
                                                    onCheckedChange={() => handleToggleStatus(rule)}
                                                    className="scale-75 origin-left data-[state=checked]:bg-[#35877D]"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-semibold text-foreground text-xs py-3.5">
                                                {rule.executed_count ?? 0}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs py-3.5">
                                                {rule.updated_at ? new Date(rule.updated_at).toLocaleDateString("en-IN") : "—"}
                                            </TableCell>
                                            <TableCell className="py-3.5 text-right pr-6">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEditDialog(rule)}
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                                                    >
                                                        <Edit2 size={13} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => confirmDeleteRule(rule.id)}
                                                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg"
                                                    >
                                                        <Trash2 size={13} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* ── CREATE RULE DIALOG ── */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[540px] rounded-2xl overflow-hidden p-0 border border-border shadow-xl bg-card">
                    <div className="bg-[#35877D]/5 border-b border-[#35877D]/10 px-6 py-4 flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-[#35877D]/10 flex items-center justify-center">
                            <Plus size={16} className="text-[#35877D]" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-foreground">Create Automation Rule</DialogTitle>
                            <DialogDescription className="text-muted-foreground text-xs mt-0.5">
                                Set up keyword triggers to send automated WhatsApp replies.
                            </DialogDescription>
                        </div>
                    </div>

                    <form onSubmit={handleCreateRule} className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="createRuleName" className="text-xs font-semibold text-foreground/80">
                                    Rule Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="createRuleName"
                                    value={ruleName}
                                    onChange={(e) => setRuleName(e.target.value)}
                                    placeholder="e.g. Price Query Auto-Reply"
                                    className="text-xs h-9 border-border bg-background focus:ring-[#35877D] text-foreground"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="createKeyword" className="text-xs font-semibold text-foreground/80">
                                    Keyword Trigger <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="createKeyword"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    placeholder="e.g. price"
                                    className="text-xs h-9 border-border bg-background focus:ring-[#35877D] text-foreground"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="createTrigger" className="text-xs font-semibold text-foreground/80">Trigger Type</Label>
                                <select
                                    id="createTrigger"
                                    value={triggerType}
                                    onChange={(e) => setTriggerType(e.target.value)}
                                    className="w-full h-9 px-3 border border-border bg-background rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#35877D]"
                                >
                                    <option value="New WhatsApp message is received">New WhatsApp message is received</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="createAction" className="text-xs font-semibold text-foreground/80">Action Type</Label>
                                <select
                                    id="createAction"
                                    value={actionType}
                                    onChange={(e) => setActionType(e.target.value)}
                                    className="w-full h-9 px-3 border border-border bg-background rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#35877D]"
                                >
                                    <option value="Send message">Send message</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="createReply" className="text-xs font-semibold text-foreground/80">
                                Automatic Reply Message <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="createReply"
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                placeholder="Type the message that will be sent automatically when the keyword matches..."
                                className="min-h-[100px] text-xs leading-relaxed resize-y border-border bg-background text-foreground"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-muted border border-border rounded-xl">
                            <div>
                                <Label htmlFor="createStatus" className="text-xs font-semibold text-foreground/80 cursor-pointer">Rule Active State</Label>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Turn ON to activate this trigger instantly.</p>
                            </div>
                            <Switch
                                id="createStatus"
                                checked={status}
                                onCheckedChange={setStatus}
                                className="data-[state=checked]:bg-[#35877D]"
                            />
                        </div>

                        <div className="pt-2 flex justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                                disabled={createMutation.isPending}
                                className="text-xs rounded-xl h-9 px-4 font-semibold border-border"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#35877D] hover:bg-[#2c6f66] text-white text-xs rounded-xl h-9 px-5 font-semibold border-0 cursor-pointer"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? (
                                    <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Creating...</span>
                                ) : "Create Rule"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── EDIT RULE DIALOG ── */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[540px] rounded-2xl overflow-hidden p-0 border border-border shadow-xl bg-card">
                    <div className="bg-[#35877D]/5 border-b border-[#35877D]/10 px-6 py-4 flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-[#35877D]/10 flex items-center justify-center">
                            <Edit2 size={15} className="text-[#35877D]" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-foreground">Edit Automation Rule</DialogTitle>
                            <DialogDescription className="text-muted-foreground text-xs mt-0.5">
                                Modify trigger parameters and save changes instantly.
                            </DialogDescription>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateRule} className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="editRuleName" className="text-xs font-semibold text-foreground/80">
                                    Rule Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="editRuleName"
                                    value={ruleName}
                                    onChange={(e) => setRuleName(e.target.value)}
                                    placeholder="e.g. Price Query Auto-Reply"
                                    className="text-xs h-9 border-border bg-background focus:ring-[#35877D] text-foreground"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="editKeyword" className="text-xs font-semibold text-foreground/80">
                                    Keyword Trigger <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="editKeyword"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    placeholder="e.g. price"
                                    className="text-xs h-9 border-border bg-background focus:ring-[#35877D] text-foreground"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="editTrigger" className="text-xs font-semibold text-foreground/80">Trigger Type</Label>
                                <select
                                    id="editTrigger"
                                    value={triggerType}
                                    onChange={(e) => setTriggerType(e.target.value)}
                                    className="w-full h-9 px-3 border border-border bg-background rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#35877D]"
                                >
                                    <option value="New WhatsApp message is received">New WhatsApp message is received</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="editAction" className="text-xs font-semibold text-foreground/80">Action Type</Label>
                                <select
                                    id="editAction"
                                    value={actionType}
                                    onChange={(e) => setActionType(e.target.value)}
                                    className="w-full h-9 px-3 border border-border bg-background rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#35877D]"
                                >
                                    <option value="Send message">Send message</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="editReply" className="text-xs font-semibold text-foreground/80">
                                Automatic Reply Message <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="editReply"
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                placeholder="Type the message that will be sent automatically when the keyword matches..."
                                className="min-h-[100px] text-xs leading-relaxed resize-y border-border bg-background text-foreground"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-muted border border-border rounded-xl">
                            <div>
                                <Label htmlFor="editStatus" className="text-xs font-semibold text-foreground/80 cursor-pointer">Rule Active State</Label>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Turn ON to keep this trigger active.</p>
                            </div>
                            <Switch
                                id="editStatus"
                                checked={status}
                                onCheckedChange={setStatus}
                                className="data-[state=checked]:bg-[#35877D]"
                            />
                        </div>

                        <div className="pt-2 flex justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => { setIsEditOpen(false); setSelectedRule(null); }}
                                disabled={updateMutation.isPending}
                                className="text-xs rounded-xl h-9 px-4 font-semibold border-border"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#35877D] hover:bg-[#2c6f66] text-white text-xs rounded-xl h-9 px-5 font-semibold border-0 cursor-pointer"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? (
                                    <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</span>
                                ) : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── DELETE CONFIRMATION DIALOG ── */}
            <Dialog open={isDeleteOpen} onOpenChange={(open) => { setIsDeleteOpen(open); if (!open) setRuleIdToDelete(null); }}>
                <DialogContent className="sm:max-w-[420px] rounded-2xl overflow-hidden p-0 border border-border shadow-xl bg-card">
                    <div className="bg-red-50/50 border-b border-red-100 px-6 py-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                            <AlertTriangle size={18} />
                        </div>
                        <div>
                            <DialogTitle className="text-sm font-bold text-foreground">Delete Automation Rule</DialogTitle>
                            <DialogDescription className="text-muted-foreground text-[11px] mt-0.5">
                                This action is permanent and cannot be undone.
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="px-6 py-5 space-y-5">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Are you sure you want to delete this automation rule? Once deleted, this keyword trigger will no longer match customer messages or send automatic replies.
                        </p>
                        <div className="flex justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => { setIsDeleteOpen(false); setRuleIdToDelete(null); }}
                                disabled={deleteMutation.isPending}
                                className="text-xs rounded-xl h-9 px-4 font-semibold border-border"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleDeleteRule}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs rounded-xl h-9 px-5 font-semibold border-0 cursor-pointer"
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? (
                                    <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Deleting...</span>
                                ) : "Delete Rule"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
