"use client";

import { useState, useEffect } from "react";
import { UpgradeGuard } from "@/components/upgrade-guard";
import {
    useListKnowledgeBase,
    useCreateKnowledgeBase,
    useUpdateKnowledgeBase,
    useDeleteKnowledgeBase,
    useGetAiSettings,
    useUpdateAiSettings,
    useSimulateAiReply,
    KnowledgeBaseItem,
    AiSettings
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import {
    ChevronDown,
    ChevronRight,
    Plus,
    Search,
    Trash2,
    Edit2,
    BookOpen,
    Bot,
    Loader2,
    Send,
    RefreshCw,
    HelpCircle,
    MessageSquare,
    AlertCircle,
    Sparkles
} from "lucide-react";

interface ChatMessage {
    id: string;
    sender: "user" | "ai";
    text: string;
    timestamp: Date;
}

export default function KnowledgeBasePage() {
    const queryClient = useQueryClient();

    // Data fetching
    const { data: kbItems, isLoading: isKbLoading } = useListKnowledgeBase();
    const { data: aiSettings, isLoading: isSettingsLoading } = useGetAiSettings();

    // Mutations
    const createKbMutation = useCreateKnowledgeBase();
    const updateKbMutation = useUpdateKnowledgeBase();
    const deleteKbMutation = useDeleteKnowledgeBase();
    const updateSettingsMutation = useUpdateAiSettings();
    const simulateAiReplyMutation = useSimulateAiReply();

    // Navigation sub-tabs
    const [activeSubTab, setActiveSubTab] = useState<"articles" | "settings" | "sandbox">("articles");
    const [isMenuExpanded, setIsMenuExpanded] = useState(true);

    // Search filter
    const [searchTerm, setSearchTerm] = useState("");

    // Dialog Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<KnowledgeBaseItem | null>(null);

    // Q&A Form States
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [status, setStatus] = useState(true);

    // Settings Form States
    const [aiAutoReply, setAiAutoReply] = useState(false);
    const [aiSystemPrompt, setAiSystemPrompt] = useState("");

    // Sandbox States
    const [sandboxMessages, setSandboxMessages] = useState<ChatMessage[]>([]);
    const [sandboxInput, setSandboxInput] = useState("");

    // Sync AI Settings values when loaded
    useEffect(() => {
        if (aiSettings) {
            setAiAutoReply(!!aiSettings.ai_auto_reply);
            setAiSystemPrompt(aiSettings.ai_system_prompt || "");
        }
    }, [aiSettings]);

    // Prepopulate simulator with sample welcome messages if empty
    useEffect(() => {
        if (sandboxMessages.length === 0) {
            setSandboxMessages([
                {
                    id: "system-welcome",
                    sender: "ai",
                    text: "Hi! I am your AI assistant. You can test how I respond based on your Knowledge Base context here. Ask me anything!",
                    timestamp: new Date()
                }
            ]);
        }
    }, [sandboxMessages]);

    // Filter Q&As
    const filteredItems = kbItems?.filter(item =>
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Dialog action handlers
    const openCreateDialog = () => {
        setQuestion("");
        setAnswer("");
        setStatus(true);
        setIsCreateOpen(true);
    };

    const openEditDialog = (item: KnowledgeBaseItem) => {
        setSelectedItem(item);
        setQuestion(item.question);
        setAnswer(item.answer);
        setStatus(!!item.status);
        setIsEditOpen(true);
    };

    const handleCreateKb = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !answer.trim()) {
            toast.error("Please fill in both the Question and the Answer.");
            return;
        }

        try {
            await createKbMutation.mutateAsync({
                data: {
                    question: question.trim(),
                    answer: answer.trim(),
                    status: status
                }
            });
            toast.success("Knowledge Base entry added successfully.");
            queryClient.invalidateQueries({ queryKey: ["listKnowledgeBase"] });
            setIsCreateOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to add Knowledge Base entry.");
        }
    };

    const handleUpdateKb = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;
        if (!question.trim() || !answer.trim()) {
            toast.error("Please fill in both the Question and the Answer.");
            return;
        }

        try {
            await updateKbMutation.mutateAsync({
                id: selectedItem.id,
                data: {
                    question: question.trim(),
                    answer: answer.trim(),
                    status: status
                }
            });
            toast.success("Knowledge Base entry updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["listKnowledgeBase"] });
            setIsEditOpen(false);
            setSelectedItem(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to update Knowledge Base entry.");
        }
    };

    const handleToggleStatus = async (item: KnowledgeBaseItem) => {
        const nextStatus = !item.status;
        try {
            await updateKbMutation.mutateAsync({
                id: item.id,
                data: { status: nextStatus }
            });
            toast.success(`Entry status changed to ${nextStatus ? "Active" : "Inactive"}`);
            queryClient.invalidateQueries({ queryKey: ["listKnowledgeBase"] });
        } catch (err: any) {
            toast.error(err.message || "Failed to update status.");
        }
    };

    const [deletingKbId, setDeletingKbId] = useState<number | null>(null);

    const confirmDeleteKb = async () => {
        if (!deletingKbId) return;
        try {
            await deleteKbMutation.mutateAsync({ id: deletingKbId });
            toast.success("Knowledge Base entry deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["listKnowledgeBase"] });
            setDeletingKbId(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to delete entry.");
        }
    };

    // Settings submit handler
    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateSettingsMutation.mutateAsync({
                data: {
                    ai_auto_reply: aiAutoReply,
                    ai_system_prompt: aiSystemPrompt.trim() || null
                }
            });
            toast.success("AI auto-reply configurations saved successfully.");
            queryClient.invalidateQueries({ queryKey: ["getAiSettings"] });
        } catch (err: any) {
            toast.error(err.message || "Failed to save AI configurations.");
        }
    };

    // Sandbox send message handler
    const handleSendSandboxMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sandboxInput.trim()) return;

        const userMsgText = sandboxInput.trim();
        setSandboxInput("");

        // Append user message
        const newUserMsg: ChatMessage = {
            id: `msg-${Date.now()}-user`,
            sender: "user",
            text: userMsgText,
            timestamp: new Date()
        };
        setSandboxMessages(prev => [...prev, newUserMsg]);

        try {
            const result = await simulateAiReplyMutation.mutateAsync({
                message: userMsgText,
                ai_system_prompt: aiSystemPrompt.trim() || null
            });

            // Append AI response
            const newAiMsg: ChatMessage = {
                id: `msg-${Date.now()}-ai`,
                sender: "ai",
                text: result.reply || "No reply returned.",
                timestamp: new Date()
            };
            setSandboxMessages(prev => [...prev, newAiMsg]);
        } catch (err: any) {
            // Append error message
            const newErrorMsg: ChatMessage = {
                id: `msg-${Date.now()}-err`,
                sender: "ai",
                text: `Error: ${err.message || "Something went wrong. Please ensure the backend is connected and OpenAI key is set."}`,
                timestamp: new Date()
            };
            setSandboxMessages(prev => [...prev, newErrorMsg]);
        }
    };

    const handleClearSandbox = () => {
        setSandboxMessages([
            {
                id: "system-welcome",
                sender: "ai",
                text: "Sandbox cleared. Type a message to test how the AI chatbot handles it.",
                timestamp: new Date()
            }
        ]);
    };

    return (
        <UpgradeGuard 
            allowedPlans={["growth", "business", "enterprise"]} 
            featureName="AI Knowledge Base" 
            description="Train a custom AI agent on your business files and automate customer replies 24/7."
        >
            <div className="space-y-6">
                <PageHeader
                    icon={BookOpen}
                    title="Knowledge Base"
                    description="Teach the AI about your business operations, customize instructions, and test answers."
                    breadcrumbs={[{ label: "AI" }, { label: "Knowledge Base" }]}
                />

            <div className="grid gap-6 md:grid-cols-12 items-start">

                {/* Left Side Sub-Navigation Panel */}
                <div className="md:col-span-3 space-y-4">
                    <Card className="border border-[#EAE6DF] bg-white shadow-sm rounded-xl overflow-hidden p-2">
                        <div className="space-y-1">
                            <button
                                onClick={() => setIsMenuExpanded(!isMenuExpanded)}
                                className="w-full flex items-center justify-between p-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                <span className="flex items-center gap-2 uppercase tracking-wider">
                                    <Bot size={14} className="text-[#378179]" />
                                    AI Control Room
                                </span>
                                {isMenuExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>

                            {isMenuExpanded && (
                                <div className="pl-2 space-y-1 mt-1">
                                    <button
                                        onClick={() => setActiveSubTab("articles")}
                                        className={`w-full flex items-center justify-between p-2 text-xs font-medium rounded-lg text-left transition-colors ${activeSubTab === "articles"
                                            ? "bg-[#378179]/10 text-[#29605a] font-semibold"
                                            : "text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <BookOpen size={13} />
                                            Q&A Articles
                                        </span>
                                        {activeSubTab === "articles" && <span className="h-1.5 w-1.5 rounded-full bg-[#378179]" />}
                                    </button>

                                    <button
                                        onClick={() => setActiveSubTab("settings")}
                                        className={`w-full flex items-center justify-between p-2 text-xs font-medium rounded-lg text-left transition-colors ${activeSubTab === "settings"
                                            ? "bg-[#378179]/10 text-[#29605a] font-semibold"
                                            : "text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Bot size={13} />
                                            AI Settings
                                        </span>
                                        {activeSubTab === "settings" && <span className="h-1.5 w-1.5 rounded-full bg-[#378179]" />}
                                    </button>

                                    <button
                                        onClick={() => setActiveSubTab("sandbox")}
                                        className={`w-full flex items-center justify-between p-2 text-xs font-medium rounded-lg text-left transition-colors ${activeSubTab === "sandbox"
                                            ? "bg-[#378179]/10 text-[#29605a] font-semibold"
                                            : "text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <MessageSquare size={13} />
                                            Testing Sandbox
                                        </span>
                                        {activeSubTab === "sandbox" && <span className="h-1.5 w-1.5 rounded-full bg-[#378179]" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Quick Helper Banner */}
                    <div className="border border-slate-100 border-l-4 border-l-[#378179] bg-slate-50/50 p-4 rounded-r-xl rounded-l-md shadow-sm">
                        <div className="flex gap-2.5">
                            <div className="h-6 w-6 rounded-full bg-[#378179]/10 flex items-center justify-center shrink-0">
                                <AlertCircle size={13} className="text-[#378179]" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xs font-semibold text-slate-800">How it works?</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    When customers ask questions on WhatsApp, the AI reviews active Q&As and answers based on the prompt instructions.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side Content Panel */}
                <div className="md:col-span-9 space-y-6">

                    {/* Tab 1: Q&A Articles list */}
                    {activeSubTab === "articles" && (
                        <Card className="border border-[#EAE6DF] bg-white shadow-sm rounded-xl overflow-hidden">
                            <CardHeader className="border-b border-[#FAF8F5] pb-4 flex flex-row flex-wrap items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-bold text-slate-800">Q&A Knowledge Base</CardTitle>
                                    <CardDescription className="text-slate-600 text-xs">
                                        Manage facts, answers, and business information the AI should refer to.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="relative w-44 sm:w-56">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            type="search"
                                            placeholder="Search Q&As..."
                                            className="pl-9 h-9 text-xs text-slate-600"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        onClick={openCreateDialog}
                                        className="bg-[#378179] hover:bg-[#2c6761] text-white text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 border-0 font-medium"
                                    >
                                        <Plus size={14} />
                                        Add Q&A
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                            <TableHead className="w-[30%] font-semibold text-slate-700 text-xs pl-6">Question</TableHead>
                                            <TableHead className="w-[50%] font-semibold text-slate-700 text-xs">Answer</TableHead>
                                            <TableHead className="w-[10%] font-semibold text-slate-700 text-xs">Status</TableHead>
                                            <TableHead className="w-[10%] font-semibold text-slate-700 text-xs text-right pr-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isKbLoading ? (
                                            [...Array(3)].map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="pl-6"><Skeleton className="h-5 w-full bg-slate-100" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-full bg-slate-100" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-10 bg-slate-100" /></TableCell>
                                                    <TableCell className="text-right pr-6"><Skeleton className="h-7 w-14 ml-auto bg-slate-100" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : filteredItems?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-32 text-center text-slate-600 text-xs pl-6 pr-6">
                                                    No knowledge base articles found. Click "Add Q&A" to get started.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredItems?.map((item) => (
                                                <TableRow key={item.id} className="hover:bg-slate-50/40 text-slate-600">
                                                    <TableCell className="align-top font-medium text-slate-800 text-xs py-3 pl-6">
                                                        {item.question}
                                                    </TableCell>
                                                    <TableCell className="align-top text-xs py-3 whitespace-pre-line leading-relaxed text-slate-600">
                                                        {item.answer}
                                                    </TableCell>
                                                    <TableCell className="align-top py-3">
                                                        <Switch
                                                            checked={!!item.status}
                                                            onCheckedChange={() => handleToggleStatus(item)}
                                                            className="scale-75 origin-left data-[state=checked]:bg-[#378179]"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="align-top py-3 text-right pr-6">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openEditDialog(item)}
                                                                className="h-8 w-8 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                                                            >
                                                                <Edit2 size={13} />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setDeletingKbId(item.id)}
                                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
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
                            </CardContent>
                        </Card>
                    )}

                    {/* Tab 2: AI Settings configurations */}
                    {activeSubTab === "settings" && (
                        <Card className="border border-[#EAE6DF] bg-white shadow-sm rounded-xl">
                            <CardHeader className="border-b border-[#FAF8F5]">
                                <CardTitle className="text-xl font-bold text-slate-800">AI Reply Rule Settings</CardTitle>
                                <CardDescription className="text-slate-600 text-xs">
                                    Toggle automation rules and customize system behaviors.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                {isSettingsLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-12 w-full bg-slate-100" />
                                        <Skeleton className="h-28 w-full bg-slate-100" />
                                        <Skeleton className="h-10 w-24 bg-slate-100" />
                                    </div>
                                ) : (
                                    <form onSubmit={handleSaveSettings} className="space-y-6">

                                        {/* Toggle Auto Reply */}
                                        <div className="flex items-start justify-between p-4 bg-[#378179]/5 border border-[#378179]/10 rounded-xl">
                                            <div className="space-y-1 pr-4">
                                                <Label htmlFor="aiAutoReply" className="text-xs font-semibold text-slate-800">
                                                    AI Auto-reply Mode
                                                </Label>
                                                <p className="text-xs text-slate-600 leading-normal">
                                                    If enabled, questions that do not trigger keyword rules will be automatically answered by the AI using details from your Q&A Knowledge Base.
                                                </p>
                                            </div>
                                            <Switch
                                                id="aiAutoReply"
                                                checked={aiAutoReply}
                                                onCheckedChange={setAiAutoReply}
                                                className="data-[state=checked]:bg-[#378179]"
                                            />
                                        </div>

                                        {/* System Prompt Instructions */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label htmlFor="aiSystemPrompt" className="text-xs font-semibold text-slate-800">
                                                    AI System Prompt
                                                </Label>
                                                <span className="text-xs text-slate-600 font-medium">Optional</span>
                                            </div>
                                            <Textarea
                                                id="aiSystemPrompt"
                                                value={aiSystemPrompt}
                                                onChange={(e) => setAiSystemPrompt(e.target.value)}
                                                placeholder="e.g. You are a helpful support agent for Travel Company. Be polite, direct, and keep responses short. Do not answer questions that require access to personal accounts."
                                                className="min-h-[120px] text-xs text-slate-600 leading-relaxed resize-y"
                                            />
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                Instruct the AI on how to behave, what tone to write in, and any boundary restrictions. If left empty, a standard professional customer service assistant prompt is automatically set.
                                            </p>
                                        </div>

                                        {/* Submit Button */}
                                        <div className="pt-2 flex justify-start">
                                            <Button
                                                type="submit"
                                                className="bg-[#378179] hover:bg-[#2c6761] text-white text-xs px-5 h-9 rounded-xl font-medium"
                                                disabled={updateSettingsMutation.isPending}
                                            >
                                                {updateSettingsMutation.isPending ? (
                                                    <span className="flex items-center gap-1.5">
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        Saving...
                                                    </span>
                                                ) : (
                                                    "Save Settings"
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Tab 3: Interactive Sandbox Chat Simulator */}
                    {activeSubTab === "sandbox" && (
                        <div className="grid gap-6 lg:grid-cols-12 items-stretch">

                            {/* Input Settings Side-panel */}
                            <div className="lg:col-span-5 space-y-4">
                                <Card className="border border-[#EAE6DF] bg-white shadow-sm rounded-xl p-5 h-full flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                                <Sparkles size={14} className="text-[#378179]" />
                                                Simulator Playground
                                            </h3>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                Test how the AI replies dynamically based on your current knowledge articles. This sandbox uses your active configurations.
                                            </p>
                                        </div>

                                        <div className="space-y-1.5 border-t border-slate-100 pt-3">
                                            <Label className="text-xs font-semibold text-slate-700">Prompt Mode In-Use</Label>
                                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-600 italic leading-relaxed max-h-[140px] overflow-y-auto">
                                                {aiSystemPrompt.trim()
                                                    ? aiSystemPrompt.trim()
                                                    : "Default Persona: You are a helpful customer support AI assistant. Keep responses short and professional."}
                                            </div>
                                        </div>

                                        <div className="space-y-1 border-t border-slate-100 pt-3">
                                            <div className="text-xs font-semibold text-slate-700">Active Facts Count</div>
                                            <div className="text-xs font-medium text-slate-600">
                                                {kbItems ? kbItems.filter(i => i.status).length : 0} Q&A items will be fed as search context to OpenAI.
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleClearSandbox}
                                            className="w-full text-xs text-slate-600 flex items-center justify-center gap-1 rounded-xl h-9 hover:bg-slate-50"
                                        >
                                            <RefreshCw size={12} />
                                            Clear Sandbox Chat
                                        </Button>
                                    </div>
                                </Card>
                            </div>

                            {/* Chat smartphone mockup */}
                            <div className="lg:col-span-7">
                                <div className="border border-[#EAE6DF] bg-slate-100 shadow-sm rounded-3xl overflow-hidden flex flex-col h-[480px] max-w-[420px] mx-auto relative">

                                    {/* Mock Smartphone Header */}
                                    <div className="bg-[#378179] text-white px-4 py-3 shrink-0 flex items-center gap-3 shadow-md relative z-10">
                                        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                            <Bot size={18} className="text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-semibold text-white tracking-wide">AI Sandbox Simulator</h4>
                                            <p className="text-[9.5px] text-white/80">WhatsApp Sandbox Channel</p>
                                        </div>
                                    </div>

                                    {/* Smartphone Message Body */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e5ddd5] relative">
                                        <div className="absolute inset-0 bg-repeat opacity-[0.04]" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}></div>

                                        <div className="relative space-y-3 z-10">
                                            {sandboxMessages.map((msg) => (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div
                                                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-sm leading-relaxed ${msg.sender === "user"
                                                            ? "bg-[#dcf8c6] text-slate-800 rounded-tr-none"
                                                            : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                                                            }`}
                                                    >
                                                        {msg.text}
                                                        <div className="text-[8.5px] text-slate-600 text-right mt-1">
                                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Thinking Indicator */}
                                            {simulateAiReplyMutation.isPending && (
                                                <div className="flex justify-start">
                                                    <div className="bg-white border border-slate-200 text-slate-600 rounded-2xl rounded-tl-none px-3 py-2.5 text-xs shadow-sm flex items-center gap-2">
                                                        <Loader2 className="h-3 w-3 animate-spin text-[#378179]" />
                                                        <span>AI is writing reply...</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mock Smartphone Input Box */}
                                    <form onSubmit={handleSendSandboxMessage} className="bg-[#f0f0f0] p-2 shrink-0 border-t border-slate-200 flex gap-1.5 items-center relative z-10">
                                        <Input
                                            type="text"
                                            placeholder="Type message to test AI..."
                                            value={sandboxInput}
                                            onChange={(e) => setSandboxInput(e.target.value)}
                                            className="flex-1 h-9 rounded-full px-4 text-xs border border-slate-300 bg-white"
                                            disabled={simulateAiReplyMutation.isPending}
                                        />
                                        <Button
                                            type="submit"
                                            size="icon"
                                            className="h-9 w-9 rounded-full bg-[#378179] hover:bg-[#2c6761] text-white border-0"
                                            disabled={!sandboxInput.trim() || simulateAiReplyMutation.isPending}
                                        >
                                            <Send size={14} />
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CREATE DIALOG MODAL */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-800">Add Q&A Entry</DialogTitle>
                        <DialogDescription className="text-slate-600 text-xs">
                            Define facts or business answers that the AI should query when talking to customers.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateKb} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="createQuestion" className="text-xs font-semibold text-slate-700">
                                Question / Topic Keyword <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="createQuestion"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="e.g. What are your opening hours?"
                                className="text-xs text-slate-700"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="createAnswer" className="text-xs font-semibold text-slate-700">
                                Correct Business Answer <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="createAnswer"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="e.g. We are open Monday to Friday from 9:00 AM to 6:00 PM IST. We are closed on weekends."
                                className="min-h-[100px] text-xs text-slate-700 leading-relaxed"
                                required
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="space-y-0.5">
                                <Label htmlFor="createStatus" className="text-xs font-bold text-slate-700">Entry Active</Label>
                                <p className="text-xs text-slate-600">Disable to temporarily hide this fact from the AI.</p>
                            </div>
                            <Switch
                                id="createStatus"
                                checked={status}
                                onCheckedChange={setStatus}
                                className="data-[state=checked]:bg-[#378179]"
                            />
                        </div>
                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                                disabled={createKbMutation.isPending}
                                className="text-xs rounded-lg"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#378179] hover:bg-[#2c6761] text-white text-xs rounded-lg font-semibold"
                                disabled={createKbMutation.isPending}
                            >
                                {createKbMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Entry"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* EDIT DIALOG MODAL */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-800">Edit Q&A Entry</DialogTitle>
                        <DialogDescription className="text-slate-600 text-xs">
                            Update custom details and save changes instantly.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateKb} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="editQuestion" className="text-xs font-semibold text-slate-700">
                                Question / Topic Keyword <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="editQuestion"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="e.g. What are your opening hours?"
                                className="text-xs text-slate-700"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="editAnswer" className="text-xs font-semibold text-slate-700">
                                Correct Business Answer <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="editAnswer"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="e.g. We are open Monday to Friday from 9:00 AM to 6:00 PM IST."
                                className="min-h-[100px] text-xs text-slate-700 leading-relaxed"
                                required
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="space-y-0.5">
                                <Label htmlFor="editStatus" className="text-xs font-bold text-slate-700">Entry Active</Label>
                                <p className="text-xs text-slate-600">Disable to temporarily hide this fact from the AI.</p>
                            </div>
                            <Switch
                                id="editStatus"
                                checked={status}
                                onCheckedChange={setStatus}
                                className="data-[state=checked]:bg-[#378179]"
                            />
                        </div>
                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsEditOpen(false);
                                    setSelectedItem(null);
                                }}
                                disabled={updateKbMutation.isPending}
                                className="text-xs rounded-lg"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#378179] hover:bg-[#2c6761] text-white text-xs rounded-lg font-semibold"
                                disabled={updateKbMutation.isPending}
                            >
                                {updateKbMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deletingKbId}
                onOpenChange={(open) => !open && setDeletingKbId(null)}
                title="Delete Q&A Entry?"
                description="Are you sure you want to delete this Knowledge Base entry? This action cannot be undone."
                confirmText="Delete Entry"
                variant="destructive"
                onConfirm={confirmDeleteKb}
            />

        </div>
        </UpgradeGuard>
    );
}
